import { readJsonFile, writeJsonFile, getDataFilePath } from './json-store';
import type { AuthCode, AuthCodeRepository } from './types';

const AUTH_CODES_FILE = getDataFilePath('auth-codes.json');
const MAX_ATTEMPTS = 3;

export class JsonAuthCodeRepository implements AuthCodeRepository {
  async find(email: string): Promise<AuthCode | null> {
    const codes = await this.loadAndCleanExpired();
    const normalizedEmail = email.toLowerCase();
    const code = codes.find((c) => c.email === normalizedEmail);
    if (!code) return null;
    if (code.attempts >= MAX_ATTEMPTS) return null;
    return code;
  }

  async upsert(email: string, code: string, ttlMs: number): Promise<void> {
    const codes = await this.loadAndCleanExpired();
    const normalizedEmail = email.toLowerCase();
    const index = codes.findIndex((c) => c.email === normalizedEmail);

    const authCode: AuthCode = {
      email: normalizedEmail,
      code,
      expiresAt: new Date(Date.now() + ttlMs).toISOString(),
      attempts: 0,
    };

    if (index === -1) {
      codes.push(authCode);
    } else {
      codes[index] = authCode;
    }

    await writeJsonFile(AUTH_CODES_FILE, codes);
  }

  async delete(email: string): Promise<void> {
    const codes = await readJsonFile<AuthCode[]>(AUTH_CODES_FILE, []);
    const normalizedEmail = email.toLowerCase();
    const filtered = codes.filter((c) => c.email !== normalizedEmail);
    await writeJsonFile(AUTH_CODES_FILE, filtered);
  }

  async incrementAttempts(email: string): Promise<number> {
    const codes = await readJsonFile<AuthCode[]>(AUTH_CODES_FILE, []);
    const normalizedEmail = email.toLowerCase();
    const index = codes.findIndex((c) => c.email === normalizedEmail);

    if (index === -1) return MAX_ATTEMPTS;

    codes[index].attempts += 1;
    await writeJsonFile(AUTH_CODES_FILE, codes);
    return codes[index].attempts;
  }

  private async loadAndCleanExpired(): Promise<AuthCode[]> {
    const codes = await readJsonFile<AuthCode[]>(AUTH_CODES_FILE, []);
    const now = new Date().toISOString();
    const valid = codes.filter((c) => c.expiresAt > now);

    if (valid.length !== codes.length) {
      await writeJsonFile(AUTH_CODES_FILE, valid);
    }

    return valid;
  }
}
