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

// --- 적 정찰(scout) ---------------------------------------------------------

export type ScoutVerdict = "카운터" | "미러" | "비등" | "회피";
export type ScoutReinforcement = "명함" | "저돌파" | "중돌파" | "고돌파";
export type ScoutTroopType = "방패병" | "창병" | "궁병" | "기병";

// 관측된 적 덱 (표준 or 커스텀). 이름/구성으로 중복 없이 재사용된다.
export interface EnemyDeck {
  id: string;
  name: string; // 덱 이름 (표준명/별칭 또는 커스텀 예: "하관등")
  generals: string[]; // 무장 3명
  isStandard: boolean; // 표준 9개 덱 매칭 여부
  // 내 1군 기준 수동 상성 (커스텀 덱일 때만 사용, 표준은 매트릭스로 자동 판정)
  manualVerdict?: ScoutVerdict | null;
  createdBy?: string | null; // 기록자 표시용 (선택)
  createdAt: string;
  updatedAt: string;
}

// 적의 한 부대(군) 슬롯.
// 무장 3명 각각의 병종(troops[i] = generals[i]의 병종), 군별 강화 단계.
export interface EnemyArmy {
  deckId: string | null; // 이 군에서 확인된 덱 (없으면 null = 미확인)
  troops: (ScoutTroopType | null)[]; // 무장 3명 각각의 병종 (미상은 null)
  reinforcement: ScoutReinforcement; // 이 군의 강화 단계
}

// 적 동맹원 기록. 1군/2군/3군 슬롯을 가진다.
// 적 동맹원 기록. 최대 5개 군 슬롯을 가진다. (ARMY_COUNT)
export interface EnemyPlayer {
  id: string;
  name: string; // 게임상 이름
  alliance?: string; // 소속 동맹(군단) 이름
  armies: EnemyArmy[]; // 1군~5군 (길이 = ARMY_COUNT)
  note?: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// 정찰 데이터 전체 스냅샷 (단일 JSON 파일에 저장)
export interface ScoutData {
  decks: EnemyDeck[];
  players: EnemyPlayer[];
}

export interface UpsertEnemyDeckInput {
  name: string;
  generals: string[];
  isStandard: boolean;
  manualVerdict?: ScoutVerdict | null;
  createdBy?: string | null;
}

export interface UpsertEnemyPlayerInput {
  name: string;
  alliance?: string;
  armies: EnemyArmy[];
  note?: string;
  createdBy?: string | null;
}

export interface ScoutRepository {
  getAll(): Promise<ScoutData>;
  // 이름/구성이 같은 덱이 있으면 재사용, 없으면 생성
  findOrCreateDeck(input: UpsertEnemyDeckInput): Promise<EnemyDeck>;
  updateDeck(id: string, data: Partial<UpsertEnemyDeckInput>): Promise<EnemyDeck>;
  deleteDeck(id: string): Promise<void>;
  createPlayer(input: UpsertEnemyPlayerInput): Promise<EnemyPlayer>;
  updatePlayer(id: string, data: Partial<UpsertEnemyPlayerInput>): Promise<EnemyPlayer>;
  deletePlayer(id: string): Promise<void>;
}

export interface ReportRepository {
  find(guideId: string, userId: string): Promise<Report | null>;
  create(guideId: string, userId: string, reason: string): Promise<void>;
  countByGuide(guideId: string): Promise<number>;
  countByUserRecent(userId: string, sinceMs: number): Promise<number>;
}
