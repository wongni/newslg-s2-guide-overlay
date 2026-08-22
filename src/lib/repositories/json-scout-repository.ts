import { randomUUID } from 'crypto';
import { readJsonFile, writeJsonFile, getDataFilePath } from './json-store';
import { isSameDeckCanonical } from '@/data/enemy-decks';
import type {
  ScoutData,
  ScoutRepository,
  EnemyDeck,
  EnemyPlayer,
  UpsertEnemyDeckInput,
  UpsertEnemyPlayerInput,
} from './types';

const SCOUT_FILE = getDataFilePath('scout.json');
const EMPTY: ScoutData = { decks: [], players: [] };

// 같은 덱인지 판정: 표준명/별칭이 같거나, 무장 3명 구성이 동일(순서 무관)하면 동일 덱.
// (정규 키 기반 — 순서·별칭·표기 흔들림을 모두 흡수)
function isSameDeck(
  a: { name: string; generals: string[] },
  b: { name: string; generals: string[] }
): boolean {
  return isSameDeckCanonical(a, b);
}

export class JsonScoutRepository implements ScoutRepository {
  private async load(): Promise<ScoutData> {
    const data = await readJsonFile<ScoutData>(SCOUT_FILE, EMPTY);
    return {
      decks: Array.isArray(data.decks) ? data.decks : [],
      players: Array.isArray(data.players) ? data.players : [],
    };
  }

  private async save(data: ScoutData): Promise<void> {
    await writeJsonFile(SCOUT_FILE, data);
  }

  async getAll(): Promise<ScoutData> {
    return this.load();
  }

  async findOrCreateDeck(input: UpsertEnemyDeckInput): Promise<EnemyDeck> {
    const data = await this.load();
    const existing = data.decks.find((d) =>
      isSameDeck(d, { name: input.name, generals: input.generals })
    );
    if (existing) return existing;

    const now = new Date().toISOString();
    const deck: EnemyDeck = {
      id: randomUUID(),
      name: input.name.trim(),
      generals: input.generals.map((g) => g.trim()).filter(Boolean),
      isStandard: input.isStandard,
      manualVerdict: input.manualVerdict ?? null,
      createdBy: input.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    };
    data.decks.push(deck);
    await this.save(data);
    return deck;
  }

  async updateDeck(id: string, patch: Partial<UpsertEnemyDeckInput>): Promise<EnemyDeck> {
    const data = await this.load();
    const idx = data.decks.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('덱을 찾을 수 없습니다.');
    const prev = data.decks[idx];
    const next: EnemyDeck = {
      ...prev,
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.generals !== undefined
        ? { generals: patch.generals.map((g) => g.trim()).filter(Boolean) }
        : {}),
      ...(patch.isStandard !== undefined ? { isStandard: patch.isStandard } : {}),
      ...(patch.manualVerdict !== undefined ? { manualVerdict: patch.manualVerdict } : {}),
      updatedAt: new Date().toISOString(),
    };
    data.decks[idx] = next;
    await this.save(data);
    return next;
  }

  async deleteDeck(id: string): Promise<void> {
    const data = await this.load();
    data.decks = data.decks.filter((d) => d.id !== id);
    // 플레이어 군 슬롯의 참조에서도 제거 (해당 군을 미확인으로)
    data.players = data.players.map((p) => ({
      ...p,
      armies: p.armies.map((a) =>
        a.deckId === id ? { ...a, deckId: null } : a
      ) as EnemyPlayer['armies'],
    }));
    await this.save(data);
  }

  async createPlayer(input: UpsertEnemyPlayerInput): Promise<EnemyPlayer> {
    const data = await this.load();
    const now = new Date().toISOString();
    const player: EnemyPlayer = {
      id: randomUUID(),
      name: input.name.trim(),
      alliance: input.alliance?.trim() || undefined,
      armies: input.armies,
      note: input.note?.trim() || undefined,
      createdBy: input.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    };
    data.players.push(player);
    await this.save(data);
    return player;
  }

  async updatePlayer(id: string, patch: Partial<UpsertEnemyPlayerInput>): Promise<EnemyPlayer> {
    const data = await this.load();
    const idx = data.players.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('적 기록을 찾을 수 없습니다.');
    const prev = data.players[idx];
    const next: EnemyPlayer = {
      ...prev,
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.alliance !== undefined
        ? { alliance: patch.alliance?.trim() || undefined }
        : {}),
      ...(patch.armies !== undefined ? { armies: patch.armies } : {}),
      ...(patch.note !== undefined ? { note: patch.note?.trim() || undefined } : {}),
      updatedAt: new Date().toISOString(),
    };
    data.players[idx] = next;
    await this.save(data);
    return next;
  }

  async deletePlayer(id: string): Promise<void> {
    const data = await this.load();
    data.players = data.players.filter((p) => p.id !== id);
    await this.save(data);
  }
}
