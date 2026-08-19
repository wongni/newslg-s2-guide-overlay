export interface User {
  id: string;
  email: string;
  nickname: string;
  server: string | null;
  alliance: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  nickname: string;
  server: string | null;
  alliance: string | null;
  role?: string;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, data: Partial<Pick<User, 'nickname' | 'server' | 'alliance' | 'role'>>): Promise<User>;
  list(): Promise<User[]>;
}

export interface AuthCode {
  email: string;
  code: string;
  expiresAt: string;
  attempts: number;
}

export interface AuthCodeRepository {
  find(email: string): Promise<AuthCode | null>;
  upsert(email: string, code: string, ttlMs: number): Promise<void>;
  delete(email: string): Promise<void>;
  incrementAttempts(email: string): Promise<number>;
}

export interface SharedGuide {
  id: string;
  code: string;
  authorId: string;
  title: string;
  description: string;
  steps: unknown[];
  tierValues?: Record<string, unknown>;
  commonValues?: Record<string, unknown>;
  glossary?: Record<string, string>;
  supportedTiers?: string[];
  isPublic: boolean;
  likes: number;
  dislikes: number;
  reports: number;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuideInput {
  authorId: string;
  title: string;
  description: string;
  steps: unknown[];
  tierValues?: Record<string, unknown>;
  commonValues?: Record<string, unknown>;
  glossary?: Record<string, string>;
  supportedTiers?: string[];
  isPublic: boolean;
}

export interface ListGuidesOptions {
  authorId?: string;
  isPublic?: boolean;
  sort?: 'recent' | 'popular';
  page?: number;
  limit?: number;
}

export interface GuideRepository {
  findByCode(code: string): Promise<SharedGuide | null>;
  findById(id: string): Promise<SharedGuide | null>;
  list(options: ListGuidesOptions): Promise<{ guides: SharedGuide[]; total: number }>;
  create(input: CreateGuideInput): Promise<SharedGuide>;
  update(code: string, data: Partial<SharedGuide>): Promise<SharedGuide>;
  delete(code: string): Promise<void>;
  countByAuthor(authorId: string, isPublic?: boolean): Promise<number>;
}

export interface Reaction {
  guideId: string;
  userId: string;
  type: 'like' | 'dislike';
  createdAt: string;
}

export interface ReactionRepository {
  find(guideId: string, userId: string): Promise<Reaction | null>;
  upsert(guideId: string, userId: string, type: 'like' | 'dislike'): Promise<void>;
  remove(guideId: string, userId: string): Promise<void>;
}

export interface Report {
  guideId: string;
  userId: string;
  reason: string;
  createdAt: string;
}

export interface ReportRepository {
  find(guideId: string, userId: string): Promise<Report | null>;
  create(guideId: string, userId: string, reason: string): Promise<void>;
  countByGuide(guideId: string): Promise<number>;
  countByUserRecent(userId: string, sinceMs: number): Promise<number>;
}
