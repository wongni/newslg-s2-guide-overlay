import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { guideRepository, reportRepository } from '@/lib/repositories';
import { checkRateLimit } from '@/lib/rate-limit';

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
    const { reason } = body;

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: '신고 사유를 입력해주세요' },
        { status: 400 }
      );
    }

    // Rate limit: 3 reports per user per hour
    const rateLimitKey = `report:${authUser.userId}`;
    const { allowed } = checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: '신고 횟수를 초과했습니다. 잠시 후 다시 시도해주세요' },
        { status: 429 }
      );
    }

    // Check duplicate: user can only report a guide once
    const existingReport = await reportRepository.find(guide.id, authUser.userId);
    if (existingReport) {
      return NextResponse.json(
        { error: '이미 신고한 가이드입니다' },
        { status: 409 }
      );
    }

    // Create the report
    await reportRepository.create(guide.id, authUser.userId, reason.trim());

    // Increment guide reports count
    const newReports = guide.reports + 1;
    const updateData: { reports: number; isHidden?: boolean } = { reports: newReports };

    // Auto-hide if reports >= 5 unique users
    if (newReports >= 5) {
      updateData.isHidden = true;
    }

    await guideRepository.update(code, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Guide report error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
