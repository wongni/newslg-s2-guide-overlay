import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { guideRepository, reactionRepository } from '@/lib/repositories';

export async function POST(
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

    const body = await request.json();
    const { type } = body;

    if (type !== 'like' && type !== 'dislike') {
      return NextResponse.json(
        { error: '유효하지 않은 반응 타입입니다' },
        { status: 400 }
      );
    }

    const existing = await reactionRepository.find(guide.id, authUser.userId);

    let newLikes = guide.likes;
    let newDislikes = guide.dislikes;
    let userReaction: 'like' | 'dislike' | null = null;

    if (existing) {
      if (existing.type === type) {
        // Same type: remove the reaction (toggle off)
        await reactionRepository.remove(guide.id, authUser.userId);
        if (type === 'like') newLikes--;
        else newDislikes--;
        userReaction = null;
      } else {
        // Different type: switch
        await reactionRepository.upsert(guide.id, authUser.userId, type);
        if (type === 'like') {
          newLikes++;
          newDislikes--;
        } else {
          newDislikes++;
          newLikes--;
        }
        userReaction = type;
      }
    } else {
      // No existing reaction: add new
      await reactionRepository.upsert(guide.id, authUser.userId, type);
      if (type === 'like') newLikes++;
      else newDislikes++;
      userReaction = type;
    }

    // Update guide counts
    await guideRepository.update(code, { likes: newLikes, dislikes: newDislikes });

    return NextResponse.json({ likes: newLikes, dislikes: newDislikes, userReaction });
  } catch (error) {
    console.error('Guide reaction error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
