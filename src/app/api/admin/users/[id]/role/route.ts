import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { userRepository } from '@/lib/repositories';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    if (authUser.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (role !== 'user' && role !== 'admin') {
      return NextResponse.json(
        { error: '유효하지 않은 역할입니다' },
        { status: 400 }
      );
    }

    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const updatedUser = await userRepository.update(id, { role });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Admin role update error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
