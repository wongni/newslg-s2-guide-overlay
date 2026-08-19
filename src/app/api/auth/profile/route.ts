import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { userRepository } from '@/lib/repositories';

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nickname, server, alliance } = body;

    const updates: Record<string, string | null> = {};

    if (nickname !== undefined) {
      if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
        return NextResponse.json(
          { error: '닉네임을 입력해주세요.' },
          { status: 400 }
        );
      }
      updates.nickname = nickname.trim();
    }

    if (server !== undefined) {
      updates.server = server?.trim() || null;
    }

    if (alliance !== undefined) {
      updates.alliance = alliance?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: '변경할 항목이 없습니다.' },
        { status: 400 }
      );
    }

    const user = await userRepository.update(authUser.userId, updates);

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
