import { NextRequest, NextResponse } from 'next/server';
import { createToken, setAuthCookie } from '@/lib/auth';
import { authCodeRepository, userRepository } from '@/lib/repositories';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, nickname, server, alliance } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: '이메일과 인증 코드를 입력해주세요.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const stored = await authCodeRepository.find(normalizedEmail);

    if (!stored) {
      return NextResponse.json(
        { error: '인증 코드를 먼저 요청해주세요.' },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date() > new Date(stored.expiresAt)) {
      await authCodeRepository.delete(normalizedEmail);
      return NextResponse.json(
        { error: '인증 코드가 만료되었습니다. 다시 요청해주세요.' },
        { status: 400 }
      );
    }

    // Check attempts (max 3)
    if (stored.attempts >= 3) {
      await authCodeRepository.delete(normalizedEmail);
      return NextResponse.json(
        { error: '시도 횟수를 초과했습니다. 다시 요청해주세요.' },
        { status: 400 }
      );
    }

    // Verify code
    if (stored.code !== code.trim()) {
      await authCodeRepository.incrementAttempts(normalizedEmail);
      return NextResponse.json(
        { error: '인증 코드가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    // Code is valid - delete it
    await authCodeRepository.delete(normalizedEmail);

    // Find or create user
    let user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      // New user - nickname is required. Signal the client to collect a
      // profile instead of surfacing this as a generic error, so existing
      // users are never prompted for nickname/server/alliance.
      if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
        return NextResponse.json(
          { error: '닉네임을 입력해주세요.', needsProfile: true },
          { status: 400 }
        );
      }

      const role = normalizedEmail === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';

      user = await userRepository.create({
        email: normalizedEmail,
        nickname: nickname.trim(),
        server: server?.trim() || null,
        alliance: alliance?.trim() || null,
        role,
      });
    } else {
      // Existing user - check if should be admin
      if (normalizedEmail === ADMIN_EMAIL.toLowerCase() && user.role !== 'admin') {
        user = await userRepository.update(user.id, { role: 'admin' });
      }
    }

    // Generate JWT
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({ user });
    setAuthCookie(response, token);
    return response;
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
