import { NextResponse } from 'next/server';
import { scoutRepository } from '@/lib/repositories';

// 전체 정찰 데이터 (덱 + 플레이어) 조회
export async function GET() {
  const data = await scoutRepository.getAll();
  return NextResponse.json(data);
}
