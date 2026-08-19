import { readFile, writeFile, mkdir } from 'fs/promises';
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

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function getDataFilePath(...segments: string[]): string {
  return path.join(DATA_DIR, ...segments);
}
