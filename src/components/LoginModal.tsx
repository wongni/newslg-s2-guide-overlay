"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuthContext } from "./AuthProvider";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useAuthContext();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", ""]);
  const [nickname, setNickname] = useState("");
  const [server, setServer] = useState("");
  const [alliance, setAlliance] = useState("");
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setEmail("");
      setCode(["", "", "", ""]);
      setNickname("");
      setServer("");
      setAlliance("");
      setNeedsProfile(false);
      setError("");
      setSending(false);
      setVerifying(false);
      setResendCooldown(0);
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
        cooldownRef.current = null;
      }
    }
  }, [isOpen]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (cooldownRef.current) clearInterval(cooldownRef.current);
      };
    }
  }, [resendCooldown]);

  const sendCode = useCallback(async () => {
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "인증 코드 발송에 실패했습니다.");
        return;
      }
      setStep(2);
      setResendCooldown(60);
      // Focus first code input
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSending(false);
    }
  }, [email]);

  const handleCodeInput = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus next input
    if (digit && index < 3) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      e.preventDefault();
      const newCode = pasted.split("");
      setCode(newCode);
      codeRefs.current[3]?.focus();
    }
  };

  const verifyCode = useCallback(async () => {
    // Force IME composition to commit before reading state
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // Allow state to update after blur
    await new Promise((r) => setTimeout(r, 0));

    const fullCode = code.join("");
    if (fullCode.length !== 4) {
      setError("4자리 인증 코드를 입력해주세요.");
      return;
    }
    // If the server already told us this is a new user, require a nickname
    // before re-submitting.
    if (needsProfile && !nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    setError("");
    setVerifying(true);
    try {
      const body: Record<string, string> = {
        email: email.trim(),
        code: fullCode,
      };
      if (nickname.trim()) body.nickname = nickname.trim();
      if (server.trim()) body.server = server.trim();
      if (alliance.trim()) body.alliance = alliance.trim();

      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        // New user: reveal the profile fields instead of showing an error.
        if (data.needsProfile) {
          setNeedsProfile(true);
          setError("");
          setTimeout(
            () => document.getElementById("login-nickname")?.focus(),
            50
          );
          return;
        }
        setError(data.error || "인증에 실패했습니다.");
        return;
      }
      login(data.user);
      onClose();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setVerifying(false);
    }
  }, [code, email, nickname, server, alliance, needsProfile, login, onClose]);

  const resendCode = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "재발송에 실패했습니다.");
        return;
      }
      setResendCooldown(60);
      setCode(["", "", "", ""]);
      codeRefs.current[0]?.focus();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          aria-label="닫기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          로그인
        </h2>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                이메일
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendCode()}
                placeholder="example@email.com"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                autoFocus
              />
            </div>
            <button
              onClick={sendCode}
              disabled={sending}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm transition-colors"
            >
              {sending ? "발송 중..." : "인증 코드 받기"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-900 dark:text-zinc-200">
                {email}
              </span>
              으로 인증 코드를 보냈습니다.
            </p>

            {/* Code inputs */}
            <div className="flex justify-center gap-3" onPaste={handleCodePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { codeRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeInput(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                  aria-label={`인증 코드 ${i + 1}번째 자리`}
                />
              ))}
            </div>

            {/* Profile fields for new users only (revealed after the server
                confirms this email has no account yet) */}
            {needsProfile && (
            <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                처음이신가요? 아래 정보를 입력해주세요.
              </p>
              <div>
                <label
                  htmlFor="login-nickname"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                >
                  닉네임 <span className="text-red-500">*</span>
                </label>
                <input
                  id="login-nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="게임 닉네임"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="login-server"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                  >
                    서버
                  </label>
                  <input
                    id="login-server"
                    type="text"
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                    placeholder="예: 3서버"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="login-alliance"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                  >
                    동맹
                  </label>
                  <input
                    id="login-alliance"
                    type="text"
                    value={alliance}
                    onChange={(e) => setAlliance(e.target.value)}
                    placeholder="동맹 이름"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-colors"
                  />
                </div>
              </div>
            </div>
            )}

            <button
              onClick={verifyCode}
              disabled={verifying}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm transition-colors"
            >
              {verifying ? "확인 중..." : "로그인"}
            </button>

            {/* Resend link */}
            <div className="text-center">
              <button
                onClick={resendCode}
                disabled={resendCooldown > 0 || sending}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:no-underline transition-colors"
              >
                {resendCooldown > 0
                  ? `다시 보내기 (${resendCooldown}초)`
                  : "다시 보내기"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
