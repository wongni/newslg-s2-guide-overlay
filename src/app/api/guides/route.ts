import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { guideRepository, userRepository } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const mine = url.searchParams.get('mine') === 'true';

    // If mine=true, return all guides by the authenticated user (both public and private)
    if (mine) {
      const authUser = await getAuthUser(request);
      if (!authUser) {
        return NextResponse.json(
          { error: '로그인이 필요합니다' },
          { status: 401 }
        );
      }

      const { guides, total } = await guideRepository.list({
        authorId: authUser.userId,
        sort: 'recent',
        page: 1,
        limit: 100,
      });

      return NextResponse.json({ guides, total });
    }

    // Default: list public guides
    const sort = (url.searchParams.get('sort') as 'recent' | 'popular') || 'recent';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));

    const { guides, total } = await guideRepository.list({
      isPublic: true,
      sort,
      page,
      limit,
    });

    // Attach author nickname to each guide
    const guidesWithAuthor = await Promise.all(
      guides.map(async (guide) => {
        const author = await userRepository.findById(guide.authorId);
        return {
          ...guide,
          authorNickname: author?.nickname ?? '알 수 없음',
        };
      })
    );

    return NextResponse.json({ guides: guidesWithAuthor, total, page, limit });
  } catch (error) {
    console.error('Guide list error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // Check total JSON size < 1MB
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 1_000_000) {
      return NextResponse.json(
        { error: '요청 데이터가 너무 큽니다 (최대 1MB)' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const { title, description, steps, tierValues, commonValues, glossary, isPublic, supportedTiers } = body;

    // Validate title
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

    // Validate steps
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

    // Check JSON size after parsing
    const jsonSize = Buffer.byteLength(JSON.stringify(body), 'utf-8');
    if (jsonSize > 1_000_000) {
      return NextResponse.json(
        { error: '요청 데이터가 너무 큽니다 (최대 1MB)' },
        { status: 413 }
      );
    }

    // Check guide limits
    const isPublicGuide = Boolean(isPublic);
    const count = await guideRepository.countByAuthor(authUser.userId, isPublicGuide);
    if (count >= 5) {
      const typeLabel = isPublicGuide ? '공개' : '비공개';
      return NextResponse.json(
        { error: `${typeLabel} 가이드는 최대 5개까지 생성할 수 있습니다` },
        { status: 429 }
      );
    }

    const guide = await guideRepository.create({
      authorId: authUser.userId,
      title: title.trim(),
      description: description?.trim() || '',
      steps,
      tierValues,
      commonValues,
      glossary: glossary && typeof glossary === 'object' ? glossary : undefined,
      supportedTiers: Array.isArray(supportedTiers) ? supportedTiers : undefined,
      isPublic: isPublicGuide,
    });

    return NextResponse.json({ guide, code: guide.code }, { status: 201 });
  } catch (error) {
    console.error('Guide create error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
