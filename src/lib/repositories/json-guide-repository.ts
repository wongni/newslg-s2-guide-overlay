import crypto from 'crypto';
import { existsSync } from 'fs';
import { readdir, unlink } from 'fs/promises';
import { readJsonFile, writeJsonFile, ensureDataDir, getDataFilePath } from './json-store';
import type { SharedGuide, CreateGuideInput, ListGuidesOptions, GuideRepository } from './types';

const GUIDES_DIR = 'guides';

// Exclude ambiguous characters: 0/O, 1/I/L
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

function generateCode(): string {
  let code = '';
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  }
  return code;
}

function guideFilePath(code: string): string {
  return getDataFilePath(GUIDES_DIR, `${code}.json`);
}

export class JsonGuideRepository implements GuideRepository {
  async findByCode(code: string): Promise<SharedGuide | null> {
    const filePath = guideFilePath(code.toUpperCase());
    if (!existsSync(filePath)) return null;
    return readJsonFile<SharedGuide | null>(filePath, null);
  }

  async findById(id: string): Promise<SharedGuide | null> {
    const guides = await this.loadAllGuides();
    return guides.find((g) => g.id === id) ?? null;
  }

  async list(options: ListGuidesOptions): Promise<{ guides: SharedGuide[]; total: number }> {
    let guides = await this.loadAllGuides();

    // Filter
    if (options.authorId !== undefined) {
      guides = guides.filter((g) => g.authorId === options.authorId);
    }
    if (options.isPublic !== undefined) {
      guides = guides.filter((g) => g.isPublic === options.isPublic);
    }

    // Hide hidden guides from public listings
    guides = guides.filter((g) => !g.isHidden);

    // Sort
    if (options.sort === 'popular') {
      guides.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
    } else {
      // Default: recent
      guides.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = guides.length;

    // Paginate
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const start = (page - 1) * limit;
    guides = guides.slice(start, start + limit);

    return { guides, total };
  }

  async create(input: CreateGuideInput): Promise<SharedGuide> {
    await ensureDataDir(GUIDES_DIR);

    // Generate unique code
    let code = generateCode();
    while (existsSync(guideFilePath(code))) {
      code = generateCode();
    }

    const now = new Date().toISOString();
    const guide: SharedGuide = {
      id: crypto.randomUUID(),
      code,
      authorId: input.authorId,
      title: input.title,
      description: input.description,
      steps: input.steps,
      tierValues: input.tierValues,
      commonValues: input.commonValues,
      supportedTiers: input.supportedTiers,
      isPublic: input.isPublic,
      likes: 0,
      dislikes: 0,
      reports: 0,
      isHidden: false,
      createdAt: now,
      updatedAt: now,
    };

    await writeJsonFile(guideFilePath(code), guide);
    return guide;
  }

  async update(code: string, data: Partial<SharedGuide>): Promise<SharedGuide> {
    const upperCode = code.toUpperCase();
    const filePath = guideFilePath(upperCode);
    const existing = await readJsonFile<SharedGuide | null>(filePath, null);

    if (!existing) {
      throw new Error(`Guide not found: ${upperCode}`);
    }

    const updated: SharedGuide = {
      ...existing,
      ...data,
      code: existing.code, // Never change the code
      id: existing.id, // Never change the id
      updatedAt: new Date().toISOString(),
    };

    await writeJsonFile(filePath, updated);
    return updated;
  }

  async delete(code: string): Promise<void> {
    const filePath = guideFilePath(code.toUpperCase());
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  }

  async countByAuthor(authorId: string, isPublic?: boolean): Promise<number> {
    const guides = await this.loadAllGuides();
    return guides.filter((g) => {
      if (g.authorId !== authorId) return false;
      if (isPublic !== undefined && g.isPublic !== isPublic) return false;
      return true;
    }).length;
  }

  private async loadAllGuides(): Promise<SharedGuide[]> {
    const dir = getDataFilePath(GUIDES_DIR);
    if (!existsSync(dir)) return [];

    const files = await readdir(dir);
    const guides: SharedGuide[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const guide = await readJsonFile<SharedGuide | null>(
        getDataFilePath(GUIDES_DIR, file),
        null
      );
      if (guide) guides.push(guide);
    }

    return guides;
  }
}
