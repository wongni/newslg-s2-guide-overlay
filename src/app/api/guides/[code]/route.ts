import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { guideRepository, userRepository } from '@/lib/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const guide = await guideRepository.findByCode(code);

    if (!guide) {
      return NextResponse.json(
        { error: '가이드를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // If hidden, only author or admin can see
    if (guide.isHidden) {
      const authUser = await getAuthUser(request);
      if (!authUser || (authUser.userId !== guide.authorId && authUser.role !== 'admin')) {
        return NextResponse.json(
          { error: '가이드를 찾을 수 없습니다' },
          { status: 404 }
        );
      }
    }

    const author = await userRepository.findById(guide.authorId);
    const authorInfo = author
      ? { nickname: author.nickname, server: author.server, alliance: author.alliance }
      : { nickname: '알 수 없음', server: null, alliance: null };

    return NextResponse.json({ guide, author: authorInfo });
  } catch (error) {
    console.error('Guide get error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const { code } = await params;
    const guide = await guideRepository.findByCode(code);

    if (!guide) {
      return NextResponse.json(
        { error: '가이드를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Only author or admin can update
    if (authUser.userId !== guide.authorId && authUser.role !== 'admin') {
      return NextResponse.json(
        { error: '수정 권한이 없습니다' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, steps, tierValues, commonValues, glossary, isPublic, supportedTiers } = body;

    // Validate title if provided
    if (title !== undefined) {
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { error: '제목은 필수입니다' },
          { status: 400 }
        );
      }
      if (title.length > 50) {
        return NextResponse.json(
          { error: '제목은 50자 이하여야 합니다' },
          { status: 400 }
        );
      }
    }

    // Validate steps if provided
    if (steps !== undefined) {
      if (!Array.isArray(steps) || steps.length === 0) {
        return NextResponse.json(
          { error: '스텝 목록은 필수입니다' },
          { status: 400 }
        );
      }
      if (steps.length > 100) {
        return NextResponse.json(
          { error: '스텝은 최대 100개까지 가능합니다' },
          { status: 400 }
        );
      }
    }

    // Check JSON size
    const jsonSize = Buffer.byteLength(JSON.stringify(body), 'utf-8');
    if (jsonSize > 1_000_000) {
      return NextResponse.json(
        { error: '요청 데이터가 너무 큽니다 (최대 1MB)' },
        { status: 413 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (steps !== undefined) updateData.steps = steps;
    if (tierValues !== undefined) updateData.tierValues = tierValues;
    if (commonValues !== undefined) updateData.commonValues = commonValues;
    if (glossary !== undefined) updateData.glossary = glossary;
    if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic);
    if (supportedTiers !== undefined) updateData.supportedTiers = supportedTiers;

    const updated = await guideRepository.update(code, updateData);

    return NextResponse.json({ guide: updated });
  } catch (error) {
    console.error('Guide update error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const { code } = await params;
    const guide = await guideRepository.findByCode(code);

    if (!guide) {
      return NextResponse.json(
        { error: '가이드를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Only author or admin can delete
    if (authUser.userId !== guide.authorId && authUser.role !== 'admin') {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다' },
        { status: 403 }
      );
    }

    await guideRepository.delete(code);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Guide delete error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
