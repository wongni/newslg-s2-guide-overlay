import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { myDeckRepository } from '@/lib/repositories';
import { ARMY_COUNT } from '@/data/enemy-decks';
import type {
  MyDeckEntry,
  MyDeckSettingsData,
  ScoutReinforcement,
  ScoutTroopType,
} from '@/lib/repositories';

const VALID_REINFORCEMENTS: ScoutReinforcement[] = ['명함', '저돌파', '중돌파', '고돌파'];
const VALID_TROOPS: ScoutTroopType[] = ['방패병', '창병', '궁병', '기병'];

// 임의 입력을 안전한 MyDeckEntry | null 로 정규화
function sanitizeEntry(raw: unknown): MyDeckEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const name = typeof obj.name === 'string' ? obj.name.trim() : '';
  if (!name) return null;
  const reinforcement: ScoutReinforcement = VALID_REINFORCEMENTS.includes(
    obj.reinforcement as ScoutReinforcement
  )
    ? (obj.reinforcement as ScoutReinforcement)
    : '명함';
  let troops: (ScoutTroopType | null)[] | undefined;
  if (Array.isArray(obj.troops)) {
    troops = [0, 1, 2].map((i) => {
      const t = obj.troops as unknown[];
      return VALID_TROOPS.includes(t[i] as ScoutTroopType)
        ? (t[i] as ScoutTroopType)
        : null;
    });
  }
  return troops ? { name, reinforcement, troops } : { name, reinforcement };
}

function sanitizeSettings(raw: unknown): MyDeckSettingsData {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const arr = Array.isArray(obj.decks) ? obj.decks : [];
  const decks = Array.from({ length: ARMY_COUNT }, (_, i) => sanitizeEntry(arr[i]));
  return { decks };
}

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  const settings = await myDeckRepository.get(auth.userId);
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const clean = sanitizeSettings(body);
    const saved = await myDeckRepository.set(auth.userId, clean);
    return NextResponse.json({ settings: saved });
  } catch {
    return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 400 });
  }
}
