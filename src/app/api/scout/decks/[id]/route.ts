import { NextRequest, NextResponse } from 'next/server';
import { hasScoutAccess } from '@/lib/scout-auth';
import { scoutRepository } from '@/lib/repositories';
import type { ScoutVerdict } from '@/lib/repositories';

const VALID_VERDICTS: ScoutVerdict[] = ['카운터', '미러', '비등', '회피'];

// 덱 수정 (주로 커스텀 덱의 수동 상성 변경)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasScoutAccess(request)) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const patch: Record<string, unknown> = {};

    if (typeof body?.name === 'string') patch.name = body.name;
    if (Array.isArray(body?.generals)) {
      patch.generals = body.generals.filter((g: unknown) => typeof g === 'string');
    }
    if (typeof body?.isStandard === 'boolean') patch.isStandard = body.isStandard;
    if (body?.manualVerdict === null || VALID_VERDICTS.includes(body?.manualVerdict)) {
      patch.manualVerdict = body.manualVerdict;
    }

    const deck = await scoutRepository.updateDeck(id, patch);
    return NextResponse.json(deck);
  } catch {
    return NextResponse.json({ error: '수정에 실패했습니다.' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasScoutAccess(request)) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 401 });
  }
  try {
    const { id } = await params;
    await scoutRepository.deleteDeck(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 400 });
  }
}
