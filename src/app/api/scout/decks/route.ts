import { NextRequest, NextResponse } from 'next/server';
import { hasScoutAccess } from '@/lib/scout-auth';
import { scoutRepository } from '@/lib/repositories';
import type { ScoutVerdict } from '@/lib/repositories';

const VALID_VERDICTS: ScoutVerdict[] = ['카운터', '미러', '비등', '회피'];

// 덱 생성 또는 재사용 (이름/구성 동일 시 기존 반환)
export async function POST(request: NextRequest) {
  if (!hasScoutAccess(request)) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const generals = Array.isArray(body?.generals)
      ? body.generals.filter((g: unknown): g is string => typeof g === 'string')
      : [];
    const isStandard = Boolean(body?.isStandard);
    const manualVerdict: ScoutVerdict | null =
      VALID_VERDICTS.includes(body?.manualVerdict) ? body.manualVerdict : null;
    const createdBy = typeof body?.createdBy === 'string' ? body.createdBy : null;

    if (!name) {
      return NextResponse.json({ error: '덱 이름을 입력해주세요.' }, { status: 400 });
    }
    if (generals.length !== 3) {
      return NextResponse.json({ error: '무장 3명을 입력해주세요.' }, { status: 400 });
    }

    const deck = await scoutRepository.findOrCreateDeck({
      name,
      generals,
      isStandard,
      manualVerdict,
      createdBy,
    });
    return NextResponse.json(deck);
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
