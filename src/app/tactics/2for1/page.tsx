"use client";

import Link from "next/link";
import {
  GeneralChip,
  ArmyCard,
  OpBadge,
  StepArrow,
  ProsCons,
} from "@/components/tactics/Diagram";

/**
 * 2대1 육성 (2명이 1명을 육성하는 방식) 상세 가이드
 *
 * 출처: 삼국지 천하결전 정보 시트 (업주산하 시즌).
 * 원문 주석: "업주산하 시즌에선 할 필요는 없지만 알아두면 좋다" → 참고용 전술.
 */

interface Step {
  n: string;
  text: string;
}

const SIMPLE_STEPS: Step[] = [
  {
    n: "1",
    text: "아무 장수 3명을 골라 3레벨 땅을 쳐서 10레벨까지 올린 뒤, 4레벨 땅을 쳐서 12레벨까지 올린다.",
  },
  {
    n: "2",
    text: "다시 아무 장수 3명을 골라 3레벨 땅 3개를 쳐서 7레벨까지 올린다.",
  },
  {
    n: "3",
    text: "앞에서 키운 12레벨 장수 2명을 각각 좌자·장합과 교체하고, 7레벨 장수 1명을 채문희와 교체한다.",
  },
  {
    n: "4",
    text: "다음 조합으로 황보숭 수비군의 5레벨 땅 1개를 공격한다. → 12레벨 좌자 + 12레벨 장합 + 7레벨 채문희 / 전법 구성: 금성의 철벽 · 칠군수몰 · 전법없음",
  },
  {
    n: "5",
    text: "이 전투로 채문희가 10레벨이 된다. 채문희를 임의의 5레벨 장수와 먼저 교체한 뒤, 다시 앞에서 키워 둔 7레벨 장수 1명과 교체하고 채문희를 다시 출전시킨다.",
  },
  {
    n: "6",
    text: "위의 4~5단계를 반복하여 10레벨·체력 150인 장수 3명을 만든다.",
  },
  {
    n: "7",
    text: "이 장수 3명을 각각 좌자·채문희·장합과 교체한다. 이후 계속 황보숭 수비군의 5레벨 땅을 공격하여 좌자·채문희·장합을 12레벨까지 올린다.",
  },
  {
    n: "8",
    text: "마지막으로 12레벨 장수 3명을 채원동으로 교체하면 완료.",
  },
];

const FULL_STEPS: Step[] = [
  {
    n: "1",
    text: "초선·원소·동탁 조합으로 시작한다. 전법은 허점공략·천하평론·연전연승을 사용한다. 3레벨 땅 8개를 쳐서 10레벨까지 올린 뒤, 4레벨 땅 3개를 쳐서 12레벨까지 올린다.",
  },
  {
    n: "2",
    text: "초선을 임의의 5레벨 장수와 교체한 뒤, X 장수(등애 / 유비 / 황월영 / 전풍 중 하나)를 올린다. 조합: 12레벨 원소 + 12레벨 동탁 + 5레벨 X / 전법은 절충어모·연전연승, X는 전법 없이 사용. 이 조합으로 유엽 수비군의 5레벨 땅을 공격한다.",
  },
  {
    n: "3",
    text: "(원문에는 3번 단계가 생략되어 있음)",
  },
  {
    n: "4",
    text: "유엽을 2번 공격하면 X(등애 / 유비 / 황월영 / 전풍)가 10레벨이 된다. X를 부대에서 내리고, 동시에 전법 포인트를 초기화한다.",
  },
  {
    n: "5",
    text: "13레벨이 된 원소와 동탁을 각각 임의의 5레벨 장수와 교체한다. 그다음 아무 장수 3명을 출전시켜 3레벨 땅 8개를 소탕하여 10레벨까지 올린다.",
  },
  {
    n: "6",
    text: "방금 키운 10레벨 장수 3명을 각각 초선·동탁·원소와 교체한다. 그 후 다시 1단계와 동일하게 진행하여 12레벨까지 올린다.",
  },
  {
    n: "7",
    text: "12레벨 초선을 부대에서 내린다. 원소·동탁을 각각 좌자·장합과 교체하고, 5레벨 채문희를 편성한다. 조합: 12레벨 좌자 + 12레벨 장합 + 5레벨 채문희 / 전법은 금성의 철벽·칠군수몰, 채문희는 전법 없이. 전부 보라색 등급인 황보숭 수비군의 5레벨 땅을 공격하여 채문희를 10레벨까지 올린다.",
  },
  {
    n: "8",
    text: "채문희를 부대에서 내린 뒤, 원소와 동탁을 먼저 5레벨 장수와 교체한다. 그다음 앞에서 키워 둔 12레벨 장수 2명으로 원소·동탁과 다시 교체. 조합: 12레벨 원소 + 12레벨 동탁 + X / 전법은 절충어모·연전연승, X는 전법 없이. 유엽 수비군의 전부 보라색 5레벨 땅을 공격해 X를 10레벨까지 올린다.",
  },
  {
    n: "9",
    text: "마지막으로 원소·동탁·채문희를 모두 먼저 5레벨 장수와 한 번 교체한다. 그 후 방금 육성한 10레벨·체력 160인 장수 3명과 다시 교체한다. 여기까지 하면 2대1 육성 작업 완료.",
  },
  {
    n: "10",
    text: "완전판 2대1 육성에 실패하더라도 언제든지 간략판 방식으로 전환 가능하다. (원문 주석) 진행이 꼬이면 육성 대상을 정리하고 처음부터 다시 시작할 수 있다.",
  },
];

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="mt-3 space-y-3">
      {steps.map((s) => (
        <li key={s.n} className="flex gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 font-bold text-sm flex items-center justify-center">
            {s.n}
          </span>
          <p className="text-zinc-800 dark:text-zinc-300 leading-relaxed">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

export default function Tactics2for1Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-4 flex gap-3 text-sm">
        <Link href="/tactics" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← 전술 목록
        </Link>
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          개척 가이드
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        2대1 육성 (2명이 1명을 육성하는 방식)
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        고레벨 장수 2명이 저레벨 장수 1명을 빠르게 끌어올리는 육성 전술입니다.
        간략판과 완전판(원소·동탁 3돌 이상)이 있습니다.
      </p>

      {/* 안내 배너 */}
      <div className="mt-5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-500/10 p-4">
        <div className="font-bold text-amber-800 dark:text-amber-300">ℹ️ 참고</div>
        <p className="mt-1 text-amber-900 dark:text-amber-100">
          원문 주석에 따르면 이 방식은 <strong>업주산하(시즌3)에서는 굳이 할 필요는 없지만</strong>,
          알아두면 좋은 개념이라 자료에 포함되어 있습니다. 이번 시즌에는 필수가
          아니니 <strong>‘이런 방법이 있다’ 정도로 참고</strong>하세요.
        </p>
      </div>

      {/* 타이밍 경고 배너 */}
      <div className="mt-4 rounded-xl border border-red-300 dark:border-red-700/60 bg-red-50 dark:bg-red-500/10 p-4">
        <div className="font-bold text-red-800 dark:text-red-300">
          ⏰ 반드시 초보자 기간(시즌 시작 48시간) 안에!
        </div>
        <p className="mt-1 text-red-900 dark:text-red-100">
          이 방식은 퇴진·재편성을 여러 번 반복합니다. 초보자 기간에는 퇴진 병력이
          <strong> 즉시 예비병으로 손실 없이 반환</strong>되지만, 기간이 끝나면
          <strong> 80% 효율로 쌀로 전환(20% 손실)</strong>되고 쌀→예비병 전환에도 시간이
          걸립니다. 기간 이후에는 반복할수록 병력 손실이 누적되므로{" "}
          <strong>48시간 안에 끝내는 것이 원칙</strong>입니다.
        </p>
      </div>

      {/* 개념 */}
      <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">핵심 개념</h2>
        <ul className="mt-2 list-disc list-inside space-y-1 text-zinc-800 dark:text-zinc-300">
          <li>
            강한 장수 2명(예: 좌자·장합, 원소·동탁)을 고정 축으로 두고, 세 번째 자리에
            키우려는 저레벨 장수를 넣어 쉬운 수비군(황보숭·유엽 5레벨 등)을 반복 공략
          </li>
          <li>
            편성된 저레벨 장수는 전투 기여와 무관하게 <strong>경험치</strong>를 받아
            빠르게 성장한다 (예: 채문희 7 → 10레벨)
          </li>
          <li>
            <strong>‘교체’ = 레벨 계승</strong> — 새로 들어오는 장수가 기존 장수의 레벨을
            물려받는다. 이 기법은 이 특성을 적극 활용해, 쉬운 땅에서 키운 고레벨을
            실제 쓸 장수(좌자·장합·채원동 등)에게 넘긴다. (초보자 기간엔 더 높은 레벨
            장수의 체력까지 계승, 이후엔 둘 중 낮은 체력)
          </li>
          <li>
            <strong>‘퇴진 후 재편성’ = 레벨 유지</strong> — 저레벨을 그 레벨 그대로 넣어
            경험치로 키우고 싶을 땐 이 방식을 쓴다. 퇴진 장수의 병력은 초보자 기간엔
            예비병으로 반환, 이후엔 80% 효율로 쌀로 전환된다.
          </li>
        </ul>
      </div>

      {/* 부대 구성 도식 */}
      <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          한눈에 보는 구성
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="text-amber-700 dark:text-amber-300 font-semibold">노란색 = 축(고레벨 2명)</span>,{" "}
          <span className="text-green-700 dark:text-green-400 font-semibold">초록색 = 키우는 대상</span>.
          쉬운 수비군을 반복해 대상에게 경험치를 몰아준다.
        </p>
        <div className="mt-4">
          <ArmyCard label="공격 부대 (황보숭 5레벨 반복 공략)" accent="green">
            <GeneralChip name="좌자" level={12} role="axis" />
            <GeneralChip name="장합" level={12} role="axis" />
            <GeneralChip name="채문희" level="7→10" role="grow" />
          </ArmyCard>
          <StepArrow label={<>전투 승리 → 채문희 경험치 획득 <OpBadge type="전투" /></>} />
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 p-2.5 text-sm text-zinc-700 dark:text-zinc-300">
            10레벨이 된 대상은 <OpBadge type="퇴진" /> 후 다음 육성 대상으로 교체 →
            반복해서 여러 장수를 10레벨로. 마지막에 완성된 레벨을 <OpBadge type="교체" />로
            실제 쓸 장수(채원동)에게 넘긴다.
          </div>
        </div>
      </div>

      {/* 간략판 */}
      <section className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">간략판</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          축: 좌자·장합·채문희 / 대상: 황보숭 수비군 5레벨 땅
        </p>
        <StepList steps={SIMPLE_STEPS} />
      </section>

      {/* 간략판 손익 분석 */}
      <section className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          간략판 손익 분석
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          핵심 메커니즘: 황보숭 5레벨 수비군은 전부 보라(저강도) 고정 → 12렙 축 2명이
          캐리하므로 7렙 저레벨이 껴도 거의 확정 승리. 이 안전한 전투에 육성 대상을
          태워 경험치를 몰아준다.
        </p>

        <div className="mt-4">
          <ProsCons
            pros={{
              title: "이득 (얻는 것)",
              items: [
                "전복 위험 거의 0 — 축 2명(좌자·장합 12렙)이 캐리해 7렙이 껴도 확정 승리",
                "저레벨 초고속 렙업 — 축이 전투를 끝내주니 대상은 무임승차로 7→10→12렙",
                "병력 손실 최소화 — 압도적 전력차라 아군 병력 손실 거의 없음",
                "즉시 활용 — 채원동 3명을 12렙·체력 확보 상태로 완성해 바로 투입",
              ],
            }}
            cons={{
              title: "손실 (잃는 것 · 비용)",
              items: [
                "막대한 체력 소모 — 축이 반복 참여. 본대 개척·휴식 경험치에 쓸 체력의 기회비용",
                "선행 준비 오버헤드 — 12렙 2세트 + 7렙 세트를 미리 만드는 데도 체력·시간",
                "조작 노가다 — 교체(레벨 계승)/퇴진(레벨 유지)을 정확히 구분해 수십 번 반복",
                "축 장수 기회비용 — 좌자·장합이 본대 개척에 못 나가 진도 지연 가능",
              ],
            }}
          />
        </div>

        <div className="mt-4 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-500/10 p-3">
          <div className="font-bold text-amber-800 dark:text-amber-300">⚖ 종합 판단</div>
          <p className="mt-1 text-amber-900 dark:text-amber-100 leading-relaxed">
            간략판은 <strong>“안전하지만 체력·시간 비용이 큰 육성법”</strong>입니다. 123
            운용이 ‘전복 위험을 감수하고 고급 땅 경험치로 빠르게 균등 육성(효율↑·리스크↑)’이라면,
            간략판은 ‘전복 위험 없이 확정적으로 육성(안전↑·체력비용↑, 5레벨 저급 경험치라 효율은 낮음)’입니다.
          </p>
          <p className="mt-2 text-amber-900 dark:text-amber-100 leading-relaxed">
            그래서 <strong>닭다리 추가 지급·개척 속도가 빠른 업주산하(시즌3)에서는 이 체력을
            본대 개척에 쓰는 편이 대체로 더 이득</strong>입니다(원문도 “할 필요 없다”고 명시).
            반대로 <strong>축은 확보됐는데 육성 대상이 크게 뒤처졌거나, 전복이 부담스러운
            저숙련·저돌파 유저</strong>에게는 안정적인 대안이 됩니다.
          </p>
        </div>
      </section>

      {/* 완전판 */}
      <section className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">완전판</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          전제: 원소·동탁 3돌 이상 / 축: 원소·동탁(→좌자·장합) / 대상: 유엽·황보숭 5레벨 땅
        </p>
        <StepList steps={FULL_STEPS} />
      </section>

      <div className="mt-8 flex gap-3 text-sm">
        <Link href="/tactics" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← 전술 목록
        </Link>
      </div>
    </div>
  );
}
