import { readFile, writeFile, mkdir, copyFile, readdir, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function ensureDataDir(subdir?: string): Promise<string> {
  const dir = subdir ? path.join(DATA_DIR, subdir) : DATA_DIR;
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  return dir;
}

export async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    if (!existsSync(filePath)) return defaultValue;
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

/** 파일 저장 옵션. */
export interface WriteJsonOptions {
  /**
   * true이면 덮어쓰기 직전의 파일 상태를 타임스탬프 스냅샷으로 백업한다.
   * 악의적 삭제/오염 시 직전 버전으로 되돌릴 수 있게 한다.
   */
  backup?: boolean;
  /** 유지할 최대 백업 개수(초과분은 오래된 것부터 삭제). 기본 200. */
  maxBackups?: number;
}

// 백업 루트: data/backups/<파일명(확장자 제외)>/<파일명>-<timestamp>.json
function backupDirFor(filePath: string): string {
  const base = path.basename(filePath, path.extname(filePath));
  return path.join(DATA_DIR, 'backups', base);
}

/**
 * 기존 파일(=이번에 덮어써질 이전 상태)을 타임스탬프 스냅샷으로 복사한다.
 * 파일이 아직 없으면(최초 생성) 백업할 것이 없으므로 조용히 스킵한다.
 * 백업 실패가 본 저장을 막지 않도록 오류는 삼킨다(로그만).
 */
async function backupExisting(filePath: string, maxBackups: number): Promise<void> {
  try {
    if (!existsSync(filePath)) return;
    const dir = backupDirFor(filePath);
    await mkdir(dir, { recursive: true });

    const ext = path.extname(filePath) || '.json';
    const base = path.basename(filePath, ext);
    // 파일시스템 안전한 타임스탬프: 2026-09-28T14-19-24-123Z
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = path.join(dir, `${base}-${ts}${ext}`);
    await copyFile(filePath, dest);

    await rotateBackups(dir, maxBackups);
  } catch (err) {
    // 백업 실패는 치명적이지 않다 — 본 저장은 계속 진행.
    console.error('[json-store] backup failed:', err);
  }
}

/** 백업 디렉터리에서 오래된 스냅샷을 정리해 maxBackups개만 남긴다. */
async function rotateBackups(dir: string, maxBackups: number): Promise<void> {
  try {
    const entries = await readdir(dir);
    const files = entries.filter((f) => f.endsWith('.json') || f.endsWith('.json.bak'));
    if (files.length <= maxBackups) return;

    // 수정 시각 기준 오름차순 정렬 후 오래된 것부터 삭제.
    const withTime = await Promise.all(
      files.map(async (f) => {
        const full = path.join(dir, f);
        try {
          const s = await stat(full);
          return { full, mtime: s.mtimeMs };
        } catch {
          return { full, mtime: 0 };
        }
      })
    );
    withTime.sort((a, b) => a.mtime - b.mtime);
    const toDelete = withTime.slice(0, withTime.length - maxBackups);
    await Promise.all(
      toDelete.map((x) => unlink(x.full).catch(() => undefined))
    );
  } catch {
    // 정리 실패는 무시(다음 저장 때 다시 시도).
  }
}

export async function writeJsonFile(
  filePath: string,
  data: unknown,
  options?: WriteJsonOptions
): Promise<void> {
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  // 덮어쓰기 전에 기존 상태를 백업(옵션).
  if (options?.backup) {
    await backupExisting(filePath, options.maxBackups ?? 200);
  }
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function getDataFilePath(...segments: string[]): string {
  return path.join(DATA_DIR, ...segments);
}
