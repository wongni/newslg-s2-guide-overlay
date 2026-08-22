import { NextRequest, NextResponse } from 'next/server';
import { hasScoutAccess } from '@/lib/scout-auth';
import { scoutRepository } from '@/lib/repositories';
import { sanitizeArmies } from '../route';

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
    if (typeof body?.alliance === 'string') patch.alliance = body.alliance;
    if (Array.isArray(body?.armies)) {
      patch.armies = sanitizeArmies(body.armies);
    }
    if (typeof body?.note === 'string') patch.note = body.note;

    const player = await scoutRepository.updatePlayer(id, patch);
    return NextResponse.json(player);
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
    await scoutRepository.deletePlayer(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 400 });
  }
}
