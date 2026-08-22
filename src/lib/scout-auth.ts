import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// 정찰 기능 패스코드 게이트.
//  - .env 의 SCOUT_PASSCODE 와 비교
//  - 성공 시 서명된 쿠키를 발급해 이후 요청에서 재검증 없이 통과
//
// 로그인(JWT)과 독립적으로 동작한다: 패스코드만 알면 접근 가능.

const COOKIE_NAME = 'scout_pass';
const SECRET = process.env.JWT_SECRET || 'dev-secret';

function expectedToken(): string | null {
  const passcode = process.env.SCOUT_PASSCODE;
  if (!passcode) return null;
  // 패스코드 자체를 쿠키에 넣지 않고, HMAC 서명값을 넣는다.
  return createHmac('sha256', SECRET).update(passcode).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// 패스코드 문자열이 올바른지 검증
export function verifyPasscode(input: string): boolean {
  const passcode = process.env.SCOUT_PASSCODE;
  if (!passcode) return false;
  return safeEqual(input.trim(), passcode);
}

// 인증 성공 쿠키를 응답에 설정
export function setScoutCookie(response: NextResponse): void {
  const token = expectedToken();
  if (!token) return;
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30일
  });
}

// 요청에 유효한 정찰 쿠키가 있는지 확인
export function hasScoutAccess(request: NextRequest): boolean {
  const expected = expectedToken();
  if (!expected) return false;
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return false;
  return safeEqual(cookie, expected);
}
