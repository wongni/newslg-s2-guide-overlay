import { NextRequest, NextResponse } from 'next/server';
import { hasScoutAccess } from '@/lib/scout-auth';
import { scoutRepository } from '@/lib/repositories';
import { ARMY_COUNT } from '@/data/enemy-decks';
import type {
  ScoutReinforcement,
  ScoutTroopType,
  EnemyArmy,
} from '@/lib/repositories';

const VALID_REINFORCEMENTS: ScoutReinforcement[] = ['명함', '저돌파', '중돌파', '고돌파'];
const VALID_TROOPS: ScoutTroopType[] = ['방패병', '창병', '궁병', '기병'];

// 임의 입력을 안전한 EnemyArmy로 정규화
export function sanitizeArmy(raw: unknown): EnemyArmy {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const deckId = typeof obj.deckId === 'string' ? obj.deckId : null;
  const reinforcement: ScoutReinforcement = VALID_REINFORCEMENTS.includes(
    obj.reinforcement as ScoutReinforcement
  )
    ? (obj.reinforcement as ScoutReinforcement)
    : '명함';
  const troopsRaw = Array.isArray(obj.troops) ? obj.troops : [];
  const troops: (ScoutTroopType | null)[] = [0, 1, 2].map((i) => {
    const t = troopsRaw[i];
    return VALID_TROOPS.includes(t as ScoutTroopType) ? (t as ScoutTroopType) : null;
  });
  return { deckId, troops, reinforcement };
}

// 최대 ARMY_COUNT개의 군 슬롯으로 정규화 (부족분은 빈 슬롯으로 채움)
export function sanitizeArmies(raw: unknown): EnemyArmy[] {
  const arr = Array.isArray(raw) ? raw : [];
  return Array.from({ length: ARMY_COUNT }, (_, i) => sanitizeArmy(arr[i]));
}

export async function POST(request: NextRequest) {
  if (!hasScoutAccess(request)) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const alliance = typeof body?.alliance === 'string' ? body.alliance : undefined;
    const note = typeof body?.note === 'string' ? body.note : undefined;
    const createdBy = typeof body?.createdBy === 'string' ? body.createdBy : null;

    if (!name) {
      return NextResponse.json({ error: '적 이름을 입력해주세요.' }, { status: 400 });
    }

    const player = await scoutRepository.createPlayer({
      name,
      alliance,
      armies: sanitizeArmies(body?.armies),
      note,
      createdBy,
    });
    return NextResponse.json(player);
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
