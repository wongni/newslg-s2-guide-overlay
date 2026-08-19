import { NextRequest, NextResponse } from 'next/server';
import { isDisposableEmail } from '@/lib/disposable-emails';
import { checkRateLimit } from '@/lib/rate-limit';
import { authCodeRepository } from '@/lib/repositories';

function getClientIp(request: NextRequest): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateCode(): string {
  const code = Math.floor(Math.random() * 10000);
  return code.toString().padStart(4, '0');
}

async function sendEmail(email: string, code: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n${'='.repeat(50)}\n[DEV] 인증 코드: ${code} (${email})\n${'='.repeat(50)}\n`);
    return true;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: '삼국지 가이드 <noreply@samgukji.top>',
      to: [email],
      subject: `[삼국지 가이드] 인증 코드: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; margin-bottom: 8px;">삼국지 가이드 인증</h2>
          <p style="color: #666; margin-bottom: 24px;">아래 인증 코드를 입력해주세요.</p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111;">${code}</span>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">이 코드는 5분간 유효합니다.</p>
        </div>
      `,
    }),
  });

  return response.ok;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: '이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    if (isDisposableEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: '일회용 이메일은 사용할 수 없습니다.' },
        { status: 400 }
      );
    }

    // Rate limit: same email 1 per minute
    const emailLimit = checkRateLimit(`send-code:email:${normalizedEmail}`, 1, 60 * 1000);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: '잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    // Rate limit: same IP 10 per hour
    const ip = getClientIp(request);
    const ipLimit = checkRateLimit(`send-code:ip:${ip}`, 10, 60 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 나중에 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    const code = generateCode();

    // Store code with 5-minute TTL
    await authCodeRepository.upsert(normalizedEmail, code, 5 * 60 * 1000);

    const sent = await sendEmail(normalizedEmail, code);
    if (!sent) {
      return NextResponse.json(
        { error: '이메일 발송에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
