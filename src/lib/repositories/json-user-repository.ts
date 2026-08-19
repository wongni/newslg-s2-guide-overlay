import crypto from 'crypto';
import { readJsonFile, writeJsonFile, getDataFilePath } from './json-store';
import type { User, CreateUserInput, UserRepository } from './types';

const USERS_FILE = getDataFilePath('users.json');

export class JsonUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const users = await readJsonFile<User[]>(USERS_FILE, []);
    return users.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const users = await readJsonFile<User[]>(USERS_FILE, []);
    return users.find((u) => u.email === email.toLowerCase()) ?? null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const users = await readJsonFile<User[]>(USERS_FILE, []);
    const now = new Date().toISOString();
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

    const user: User = {
      id: crypto.randomUUID(),
      email: input.email.toLowerCase(),
      nickname: input.nickname,
      server: input.server,
      alliance: input.alliance,
      role: adminEmail && input.email.toLowerCase() === adminEmail ? 'admin' : 'user',
      createdAt: now,
      updatedAt: now,
    };

    users.push(user);
    await writeJsonFile(USERS_FILE, users);
    return user;
  }

  async update(
    id: string,
    data: Partial<Pick<User, 'nickname' | 'server' | 'alliance' | 'role'>>
  ): Promise<User> {
    const users = await readJsonFile<User[]>(USERS_FILE, []);
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      throw new Error(`User not found: ${id}`);
    }

    const updated: User = {
      ...users[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    users[index] = updated;
    await writeJsonFile(USERS_FILE, users);
    return updated;
  }

  async list(): Promise<User[]> {
    return readJsonFile<User[]>(USERS_FILE, []);
  }
}
