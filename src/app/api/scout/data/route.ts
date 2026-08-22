import { NextRequest, NextResponse } from 'next/server';
import { hasScoutAccess } from '@/lib/scout-auth';
import { scoutRepository } from '@/lib/repositories';

// 전체 정찰 데이터 (덱 + 플레이어) 조회
export async function GET(request: NextRequest) {
  if (!hasScoutAccess(request)) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 401 });
  }
  const data = await scoutRepository.getAll();
  return NextResponse.json(data);
}
