"use client";

import Link from "next/link";

/**
 * 전술 허브 — 심화 개척/육성 전술 모음.
 */

interface TacticCard {
  href: string;
  emoji: string;
  title: string;
  desc: string;
  tag?: string;
}

const TACTICS: TacticCard[] = [
  {
    href: "/tactics/123",
    emoji: "🚀",
    title: "123 운용 완전 정복",
    desc: "1·2·3군 체력을 골고루 써서 세 부대를 균등 육성 → 체력 병목(200→600, 회복 3배)을 돌파하는 랭킹용 개척 기법. 개념·실전 예제·스텝 바이 스텝·비교까지.",
    tag: "랭킹 · 고숙련 · 초보자 기간(48h) 내",
  },
  {
    href: "/tactics/2for1",
    emoji: "🤝",
    title: "2대1 육성",
    desc: "고레벨 2명이 저레벨 1명을 쉬운 수비군에 끼워 빠르게 끌어올리는 육성 전술. 간략판 / 완전판(원소·동탁 3돌↑). ※ 업주산하 시즌엔 참고용.",
    tag: "참고 · 육성 · 초보자 기간(48h) 내",
  },
];

export default function TacticsHubPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← 개척 가이드로 돌아가기
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">전술</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        개척 가이드 본문에 담기엔 긴, 심화 개척·육성 전술을 따로 정리했습니다.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {TACTICS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 hover:border-blue-400 dark:hover:border-blue-500/60 hover:bg-blue-50/40 dark:hover:bg-blue-500/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{t.emoji}</span>
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                {t.title}
              </h2>
            </div>
            {t.tag && (
              <span className="mt-2 inline-block text-xs font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {t.tag}
              </span>
            )}
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
