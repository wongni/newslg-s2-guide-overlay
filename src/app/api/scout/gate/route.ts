import { NextRequest, NextResponse } from 'next/server';
import { verifyPasscode, setScoutCookie, hasScoutAccess } from '@/lib/scout-auth';

// 패스코드 입력 → 검증 → 쿠키 발급
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const passcode = typeof body?.passcode === 'string' ? body.passcode : '';

    if (!passcode.trim()) {
      return NextResponse.json({ error: '패스코드를 입력해주세요.' }, { status: 400 });
    }

    if (!process.env.SCOUT_PASSCODE) {
      return NextResponse.json(
        { error: '정찰 기능이 설정되지 않았습니다. (SCOUT_PASSCODE 없음)' },
        { status: 500 }
      );
    }

    if (!verifyPasscode(passcode)) {
      return NextResponse.json({ error: '패스코드가 올바르지 않습니다.' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    setScoutCookie(response);
    return response;
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 현재 접근 권한 여부 확인
export async function GET(request: NextRequest) {
  return NextResponse.json({ authorized: hasScoutAccess(request) });
}
