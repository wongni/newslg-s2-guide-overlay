"use client";

import Link from "next/link";
import {
  GeneralChip,
  ArmyCard,
  OpBadge,
  StepArrow,
  CompareTable,
  DataTable,
  StepTracker,
  type FlowStep,
} from "@/components/tactics/Diagram";

/**
 * 123 운용 상세 가이드 (전용 페이지)
 *
 * 개척 가이드 9단계의 "123 운용"을 자세히 설명하는 독립 페이지.
 * 개척 가이드 본문이 비대해지지 않도록 상세 내용을 이곳으로 분리했다.
 */

interface Section {
  title: string;
  intro?: string;
  tasks?: string[];
  conditions?: string[];
  warnings?: string[];
  tips?: string[];
}

const SECTIONS: Section[] = [
  {
    title: "자세히 알아보기",
    tasks: [
      "개념: '고레벨 하나(예: 36)'를 교체로 세 부대에 옮겨 다니며, 매 판 함께 편성한 2·3군 저레벨 장수를 9레벨 땅 경험치로 키우는 기법. 세 부대 레벨을 균등하게 맞추는 것이 목표.",
      "조작 ① 축 이동 = 교체(양방향 레벨 계승): 강유(36)↔유비(27)를 교체하면 유비가 36을 받고 강유는 27로 내려간다. 즉 '36 하나'가 강유→유비→제갈량으로 이동한다.",
      "조작 ② 딸림 교체 = 퇴진 후 재편성: 축과 함께 태우는 2·3군 자리는 퇴진 후 재편성으로 갈아끼운다. 각 장수가 자기 레벨을 유지한 채 들어와야 2군1/2/3, 3군1/2/3를 골고루 육성할 수 있다.",
      "왜 체력이 분산되나: 축을 든 장수가 판마다 바뀌므로 한 명이 여러 판을 뛰지 않고 세 장수가 체력을 20씩만 분담한다 → 세 부대 체력을 골고루 사용.",
    ],
    warnings: [
      "★핵심★ 축을 옮길 땐 '교체'(양방향 레벨 계승) — 넘겨준 장수는 상대의 낮은 레벨을 받는다. '36 하나'가 도는 구조임을 이해할 것.",
      "저레벨을 '레벨 유지한 채' 경험치로 키우려는 대상은 '퇴진 후 재편성'으로 넣는다 — 교체로 넣으면 그 장수가 36을 받아버려 육성이 안 된다.",
      "퇴진 시 그 장수 병력은 초보자 기간(48시간)엔 예비병으로 반환, 이후엔 80% 효율로 쌀로 전환 → 병력 손실을 감수하는 기법.",
      "종합 랭킹 TOP 10을 노리는 고숙련 유저용 — 초보는 무리하게 시도하지 말 것.",
    ],
    tips: [
      "왜 균등 육성? 1군만 고레벨이면 체력 상한 200·회복 20/시간에 묶여 10~12급지 확장이 한계 → 세 부대를 다 키우면 체력 600·회복 60/시간(약 3배)",
      "첫 판부터 축 + 2·3군 혼합으로 편성해야 이득 — '1군 단독 첫 판'은 불필요하다.",
      "'123'이라는 이름은 1·2·3군을 함께 굴린다는 의미 — 1군만 소모하는 단독 개척보다 전체 효율이 훨씬 높다",
    ],
  },
  {
    title: "따라하기 (스텝 바이 스텝)",
    intro: "예제 9명: 1군 강유·유비·제갈량(36/100), 2군 채문희·원소·동탁(27/100), 3군 서성·대교·태사자(24/100). 표기 Lv/HP. (개척 중반의 현실적 체력 100 기준. 상한은 200) 편성은 항상 강유36·유비27·제갈량24(최소레벨 24 → 70%). ★배치 방식★ 한 트리오로 체력이 0이 될 때까지 5회 연속 점령하고, 배치 경계에서만 교체 → 총 15개 점령. 아래 S0~S11로 9명 전원을 추적한다.",
    tasks: [
      "S0 · 시작 — 강유36/100·유비36/100·제갈량36/100 / 채문희27/100·원소27/100·동탁27/100 / 서성24/100·대교24/100·태사자24/100. (현재 체력 100)",
      "S1 · 1군 재구성①【이관】 — 유비(1군)·채문희(2군) 둘 다 퇴진 → 채문희를 1군에, 유비를 2군에 편성 → 그 상태에서 유비↔채문희 '교체'. 결과: 1군에 유비 27/100, 2군에 채문희 36/100. (재편성으로 소속을 맞바꾼 뒤 교체해야 36 레벨이 2군으로 넘어간다)",
      "S2 · 1군 재구성②【이관】 — 제갈량(1군)·서성(3군) 둘 다 퇴진 → 서성을 1군에, 제갈량을 3군에 편성 → 제갈량↔서성 '교체'. 결과: 1군에 제갈량 24/100, 3군에 서성 36/100. 이제 1군 편성 = 강유36·유비27·제갈량24.",
      "S3 · 배치1 (9렙땅 5회 연속 점령) — 강유36·유비27·제갈량24로 편성을 그대로 두고 5회 연속 점령(①~⑤). 최소레벨 24 → 70%, 회당 각 +98,000 → 슬롯당 누적 +490,000. 체력 각 100 → 0. ★배치 안에서는 교체 없이 점령만 반복 → 노가다 최소화.",
      "S4 · 배치1 대피(더미로) — 체력 0이 된 강유·유비·제갈량 ↔ 보라 더미(5/200) 3명 교체. 주요장수(36/27/24) 체력0 < 더미200 → 하향 통일 → 주요장수는 5/0 껍데기, 더미가 각 36/27/24·0 슬롯(+경험치)을 잠시 보관.",
      "S5 · 배치2 재구성 — 5레벨이 된 강유·유비·제갈량 ↔ 채문희(36/100)·원소(27/100)·대교(24/100) 교체. 금색 체력100 ≥ 상대0 → 슬롯 보존·장수만 스왑 → 강유36/100·유비27/100·제갈량24/100 회복. 대신 채문희·원소·대교는 5/0으로.",
      "S6 · 배치2 (9렙땅 5회 연속 점령) — 재구성된 강유36·유비27·제갈량24(각 100)로 5회 연속 점령(⑥~⑩). 슬롯당 +490,000, 체력 각 100 → 0.",
      "S7 · 배치2 대피(더미로) — 체력 0이 된 강유·유비·제갈량 ↔ 보라 더미(5/200) 교체 → 다시 5/0 껍데기, 더미가 슬롯 보관.",
      "S8 · 배치3 재구성 — 강유·유비·제갈량 ↔ 서성(36/100)·동탁(27/100)·태사자(24/100) 교체(마지막 금색 3명) → 강유36/100·유비27/100·제갈량24/100 회복. 서성·동탁·태사자는 5/0으로.",
      "S9 · 배치3 (9렙땅 5회 연속 점령) — 강유36·유비27·제갈량24로 5회 연속 점령(⑪~⑮). 슬롯당 +490,000, 체력 각 100 → 0. (9렙땅 총 15개 확보 완료)",
      "S10 · 껍데기 복원 — 5/0이 된 금색 6명(채문희·원소·동탁·서성·대교·태사자)을, S4·S7에서 레벨을 대피 보관한 '사용된 더미'와 각각 교체(슬롯 보존). → 채문희·서성 36, 원소·동탁 27, 대교·태사자 24로 복원. 체력은 0(이후 자연 회복).",
      "S11 · 최종 정렬 — 유비↔채문희, 제갈량↔서성, 동탁↔대교 교체로 2·3군 편성을 정리. 최종: 9명 전원 '자기 레벨 + 490,000 경험치' 보유, 체력 0(15판 소진).",
    ],
    warnings: [
      "★용어 정의: 이관(移管)★ = '퇴진 후 재편성 + 교체'를 묶은 복합 조작. 레벨을 다른 부대 장수에게 넘기면서 소속 부대까지 맞바꾼다. 그냥 '교체'와 반드시 구분할 것.",
      "왜 그냥 교체로 안 되나? 유비(1군)↔채문희(2군)를 바로 교체하면 36 채문희가 1군에, 27 유비가 2군에 편성될 뿐(축이 1군에 그대로 남음). 원하는 결과(1군 유비27 · 2군 채문희36)를 얻으려면 먼저 재편성으로 소속을 바꿔 넣은 뒤 교체해야 한다.",
      "이관 절차(정확히): ①유비·채문희 둘 다 퇴진 → ②채문희를 1군에, 유비를 2군에 편성 → ③유비↔채문희 교체. → 1군 유비27, 2군 채문희36.",
      "★핵심 오해 정정★ '36 하나'가 강유→유비→제갈량으로 옮겨가는 게 아니다. 축 트리오(강유36·유비27·제갈량24)는 고정이고, 매 판 소모한 체력을 회복 트릭(더미 대피 → 금색 만충 교체)으로 되살려 재편성한다.",
      "체력 싱크 규칙 — 교체 결과는 '높은 레벨 장수의 체력'이 상대보다 높은지로 갈린다. 높으면 (레벨·체력) 슬롯 보존·장수만 스왑(회복), 낮으면 둘 다 낮은 체력으로 하향 통일. 회복 트릭은 이 규칙을 이용한다.",
      "슬롯 귀속 — 레벨·체력·누적경험치가 하나의 슬롯으로 묶여 교체 시 통째 이동. 그래서 9렙 경험치를 더미에 잠시 저장했다가 금색 장수에게 되돌려 2·3군에 분배할 수 있다.",
      "회복 트릭에는 재료가 필요 — 보라 더미(대피용)와 금색 예비 장수(슬롯 저장고)가 있어야 무손실 재구성이 된다. 저장고가 떨어지면 더 이상 무손실 재구성 불가.",
      "퇴진한 장수 병력은 초보자 기간(48h)엔 예비병 반환, 이후엔 80% 효율로 쌀 전환 → 병력 손실 감수.",
    ],
    tips: [
      "한 문장 요약: \"강유36·유비27·제갈량24 트리오로 체력이 0이 될 때까지 5연속 점령하고, 배치 경계에서만 더미↔금색 슬롯 교체로 다음 트리오를 세워 15판을 채운다.\"",
      "왜 배치인가? 한 트리오는 체력 100 → 5판(각 −20). 배치 안에서는 교체 없이 점령만 반복 → 노가다 최소화. 대피·재구성 교체는 배치 경계 2회에서만.",
      "왜 70%인가? 편성 최소레벨(24)이 9렙땅 100% 기준(34)에 미달 → 일괄 70%(각 98,000). 그럼에도 하는 이유는 저레벨 2·3군을 9렙 고급 경험치로 키우기 위함.",
      "결과(S11): 9명 전원이 각 배치의 축을 한 번씩 맡아 5×98,000 = +490,000 → 1군 36.58 / 2군 28.83 / 3군 26.64. 저레벨일수록 같은 490k로 더 많이 오른다.",
    ],
  },
  {
    title: "했을 때 vs 안 했을 때",
    tasks: [
      "비교 조건 — 둘 다 9레벨 땅 3곳을 확보. 보유: 36레벨 축 하나 + 2·3군의 저레벨 장수들",
      "❌ 안 했을 때(1군 단독) — 1군 고정 3명(강유+A+B, 모두 고레벨 가정)으로 9레벨 땅 3판. 1군 세 장수만 경험치로 성장하고, 2·3군은 편성 안 돼 방치(성장 0).",
      "✅ 했을 때(123 운용) — '36 하나'를 강유→유비→제갈량으로 교체해 옮기며, 매 판 2·3군 저레벨을 함께 태워 9레벨 땅 3곳 확보. 딸려온 2·3군 장수들이 고급 경험치로 성장.",
      "결과 차이 — 확보한 땅은 3곳으로 같음. 차이는 '2·3군을 함께 키우느냐(균등 육성) vs 1군만 크느냐'.",
    ],
    conditions: [
      "안 했을 때: 1군 장수만 성장 / 2·3군 성장 0 / 병력 손실 없음",
      "했을 때: 축을 든 세 장수 + 딸려온 2·3군 장수가 성장 / 체력을 세 부대로 분산 소모 / 딸려온 장수 체력 소모(휴식 경험치 기회비용) 발생",
    ],
    tips: [
      "왜 해야 하나 ① 경험치 회수 — 축이 어차피 칠 9레벨 땅 3판의 '남는 두 자리'를 2·3군으로 채워, 버려질 고급 경험치를 회수한다.",
      "왜 해야 하나 ② 체력 병목 돌파(최대 장점) — 1군만 고레벨이면 체력 200·회복 20/시간이 한계. 2·3군까지 키우면 체력 600·회복 60/시간(약 3배)이 되어 10~12급지 확장이 빨라진다.",
      "⚖ 공짜는 아니다 — 함께 태운 2·3군 장수도 체력을 쓰므로, 체력 만충 시 받을 수 있던 '휴식 경험치'(무손실)를 포기하는 기회비용이 든다. 저레벨을 퇴진으로 교체 투입하면 병력 손실(기간 이후 쌀 80%)도 감수.",
      "그럼에도 유리한 이유 — 9레벨 고급 경험치가 휴식 경험치보다 훨씬 크고, 세 부대를 함께 키워 다음 날 개척 처리량을 늘린다. 시간이 촉박한 랭킹 유저에게 이득.",
    ],
  },
];

function ListBlock({
  label,
  items,
  color,
}: {
  label: string;
  items?: string[];
  color: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-3">
      <div className={`font-semibold mb-1 ${color}`}>{label}</div>
      <ul className="list-disc list-inside space-y-1 text-zinc-800 dark:text-zinc-300">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

/** 123 운용 핵심 흐름 도식 — '36 하나'가 축을 이동하는 3라운드 */
function FlowDiagram() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
        한눈에 보는 흐름 (9레벨 땅 1개 예시)
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        <span className="text-amber-700 dark:text-amber-300 font-semibold">노란색 = 36레벨 축</span>,{" "}
        <span className="text-green-700 dark:text-green-400 font-semibold">초록색 = 점령에 편성돼 경험치 받는 슬롯</span>.
        칩 표기 = 이름 / Lv·체력. 축은 <OpBadge type="교체" />로 옮깁니다.
      </p>

      <div className="mt-4 space-y-1">
        {/* 준비 상태 */}
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/40 p-2.5">
          <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">
            🏳️ 준비 상태 (S0) — 세 부대, 현재 체력 100 (상한 200)
          </div>
          <div className="space-y-1.5">
            <ArmyCard label="1군 (Lv.36)" accent="amber">
              <GeneralChip name="강유" level="36·100" role="axis" />
              <GeneralChip name="유비" level="36·100" role="axis" />
              <GeneralChip name="제갈량" level="36·100" role="axis" />
            </ArmyCard>
            <ArmyCard label="2군 (Lv.27)">
              <GeneralChip name="채문희" level="27·100" role="normal" />
              <GeneralChip name="원소" level="27·100" role="normal" />
              <GeneralChip name="동탁" level="27·100" role="normal" />
            </ArmyCard>
            <ArmyCard label="3군 (Lv.24)">
              <GeneralChip name="서성" level="24·100" role="normal" />
              <GeneralChip name="대교" level="24·100" role="normal" />
              <GeneralChip name="태사자" level="24·100" role="normal" />
            </ArmyCard>
          </div>
        </div>
        <StepArrow
          label={
            <>
              <OpBadge type="이관" /> 유비↔채문희, 제갈량↔서성 — 재편성으로 소속을 바꾼 뒤 교체해 1군을 36/27/24로 재구성 (유비 27, 제갈량 24로 강등)
            </>
          }
        />
        {/* 점령 */}
        <ArmyCard label="배치1 — 9렙땅 5회 연속 점령 (교체 없음), 최소레벨 24 → 70%" accent="green">
          <GeneralChip name="강유" level="36·100→0" role="grow" />
          <GeneralChip name="유비" level="27·100→0" role="grow" />
          <GeneralChip name="제갈량" level="24·100→0" role="grow" />
        </ArmyCard>
        <StepArrow
          label={
            <>
              <OpBadge type="교체" /> 배치 경계: 강유·유비·제갈량(0) → 더미(보라 5렙)로 대피 → 다음 금색 트리오로 슬롯 회복
            </>
          }
        />
        {/* 회복 후 재점령 */}
        <ArmyCard label="다음 배치 — 새 트리오를 체력 100의 36/27/24로 세워 5연속 점령" accent="amber">
          <GeneralChip name="강유" level="36·100" role="axis" />
          <GeneralChip name="유비" level="27·100" role="axis" />
          <GeneralChip name="제갈량" level="24·100" role="axis" />
        </ArmyCard>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3 text-center text-sm">
        <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800/50 p-2">
          <div className="font-bold text-amber-800 dark:text-amber-300">배치당 점령</div>
          <div className="text-zinc-700 dark:text-zinc-300">
            트리오 체력 <strong>100 → 0</strong> (5연속)
          </div>
        </div>
        <div className="rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-800/50 p-2">
          <div className="font-bold text-green-800 dark:text-green-300">경험치</div>
          <div className="text-zinc-700 dark:text-zinc-300">
            슬롯 귀속 → <strong>9명 균등</strong> 육성
          </div>
        </div>
        <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800/50 p-2">
          <div className="font-bold text-blue-800 dark:text-blue-300">체력 풀</div>
          <div className="text-zinc-700 dark:text-zinc-300">
            200 → <strong>600</strong> (회복 3배)
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        ※ 회복 트릭 = 주요장수를 더미(보라 5렙)와 교체해 껍데기로 만든 뒤, 체력이 더 높은 금색 예비 장수와 교체해
        높은 레벨·체력 슬롯을 되찾는 것. 경험치는 슬롯에 귀속돼 최종적으로 2·3군에게 분배됨.
      </p>
    </div>
  );
}


function MechanicsSection() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
        핵심 메커니즘 (실측 확정)
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        아래 세 규칙이 123 운용의 근간입니다. 게임 내 실측으로 확정된 동작입니다.
      </p>

      <div className="mt-3 font-semibold text-zinc-800 dark:text-zinc-200">
        ① 체력 싱크 (교체 시)
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
        교체 결과는 <strong>높은 레벨 장수의 체력이 상대보다 높은지</strong>로 갈립니다.
      </p>
      <div className="mt-2">
        <DataTable
          headers={["경우", "교체 전", "교체 후", "효과"]}
          rows={[
            ["높은레벨 체력 ≥ 낮은레벨", "6렙/180 ↔ 5렙/20", "주요 6렙/180, 더미 5렙/20", "회복 ✅ (슬롯 보존, 장수만 스왑)"],
            ["높은레벨 체력 < 낮은레벨", "20렙/170 ↔ 5렙/200", "둘 다 170", "하향 통일"],
          ]}
        />
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2">
        <strong>회복 트릭</strong>: 체력이 바닥난 주요장수를 <strong>자기보다 레벨↑·체력↑인 장수(또는 만충 예비)</strong>와
        교체하면 그 높은 슬롯을 가져가 회복됩니다.
      </p>

      <div className="mt-4 font-semibold text-zinc-800 dark:text-zinc-200">
        ② 슬롯 귀속 (경험치)
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
        <strong>레벨·체력·누적경험치가 하나의 슬롯으로 묶여</strong>, 교체 시 통째로 이동합니다.
        경험치는 장수 개인이 아니라 <strong>슬롯에 귀속</strong>되므로, 점령으로 얻은 경험치를
        저장했다가 원하는 장수(2·3군)에게 몰아줄 수 있습니다. 이 덕분에 2·3군 육성이 성립합니다.
      </p>

      <div className="mt-4 font-semibold text-zinc-800 dark:text-zinc-200">
        ③ 경험치 감쇠 (계단식)
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
        경험치 배율은 <strong>부대 편성 중 최소 레벨</strong> 기준. 토지 100% 기준레벨 이상이면
        100%, 미만이면 몇 레벨 낮든 <strong>일괄 70%</strong>(−30% 고정)입니다. (레벨당 비례 아님)
        예를 들어 최소 레벨 24 편성이면 <strong>7레벨 땅은 100%</strong>(기준 24 충족),
        <strong>8·9레벨 땅은 70%</strong>(기준 미달)를 받습니다.
      </p>
      <div className="mt-2">
        <DataTable
          headers={["토지", "100% 기준레벨", "100% 경험치", "최소24 편성 배율"]}
          rows={[
            ["7레벨", "24", "44,000", "100% → 44,000"],
            ["8레벨", "29", "80,000", "70% → 56,000"],
            ["9레벨", "34", "140,000", "70% → 98,000"],
          ]}
        />
      </div>
    </div>
  );
}

function ExpSection() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
        경험치·최종 레벨 (수치 검증)
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        예제: 1군 강유·유비·제갈량(36), 2군 채문희·원소·동탁(27), 3군 서성·대교·태사자(24), 현재 체력 100 (상한 200).
      </p>

      <div className="mt-3 font-semibold text-zinc-800 dark:text-zinc-200">
        9레벨 땅 3개 점령 (짧게 맛보기)
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
        배치 방식을 3회만 돌린 최소 예시. 슬롯 귀속으로
        총 882,000 경험치가 <strong>9명 전원에게 각 98,000씩</strong> 분배됩니다(3판을 9명에 나눠 맡길 때).
      </p>
      <div className="mt-2">
        <DataTable
          headers={["부대", "시작", "획득/장수", "최종 레벨"]}
          rows={[
            ["1군 (강유·유비·제갈량)", "36", "98,000", "36.12"],
            ["2군 (채문희·원소·동탁)", "27", "98,000", "27.39"],
            ["3군 (서성·대교·태사자)", "24", "98,000", "24.62"],
          ]}
        />
      </div>

      <div className="mt-4 font-semibold text-zinc-800 dark:text-zinc-200">
        체력 완전 소진까지 반복 (9토 15개, 배치 방식)
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
        금색 9명 체력 풀(900)을 <strong>3배치 × 5회 연속 점령</strong>으로 소진 → <strong>9토 15개</strong>.
        총 4,410,000을 9명 균등 분배(각 490,000). 이것이 위 S0~S11 추적 표와 같은 시나리오입니다.
      </p>
      <div className="mt-2">
        <DataTable
          headers={["부대", "시작", "획득/장수", "최종 레벨", "성장폭"]}
          rows={[
            ["1군", "36", "490,000", "36.58", "+0.58"],
            ["2군", "27", "490,000", "28.83", "+1.83"],
            ["3군", "24", "490,000", "26.64", "+2.64"],
          ]}
        />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
        저레벨일수록 필요 경험치가 작아 같은 490,000으로 더 많이 오릅니다(3군 +2.64 &gt; 1군 +0.58).
      </p>
    </div>
  );
}

function ScenarioCompareSection() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
        운영 방식 비교 (같은 체력·같은 토지 수)
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        A. 123 회복반복(전부 9토 15개) vs B. 부대별 독립(1군 9토·2군 8토·3군 7토 각 5개).
        둘 다 총 15개 토지, 체력 900 소모.
      </p>
      <div className="mt-3">
        <DataTable
          headers={["항목", "A. 123 반복", "B. 부대별 독립"]}
          rows={[
            ["9토 / 8토 / 7토", "15 / 0 / 0", "5 / 5 / 5"],
            ["총 경험치 (9명)", "4,410,000", "3,600,000"],
            ["1군 최종", "36.58", "36.83"],
            ["2군 최종", "28.83", "28.10"],
            ["3군 최종", "26.64", "25.32"],
          ]}
        />
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2">
        시나리오 9(123 반복)의 핵심 가치는 세 가지입니다. ① <strong>1군 성장을 조금 손해</strong>보고(9토를 70%로 치므로 36.58 &lt; 10의 36.83),
        ② <strong>2·3군 성장을 앞당기며</strong>(저레벨을 9토 고급 경험치에 태워 2군 +0.73·3군 +1.32 우위),
        ③ <strong>같은 체력으로 더 많은 고레벨(9토) 토지를 확보</strong>합니다(9토 15개 vs 부대별 독립 5개).
        저레벨을 낮은 토지에 보내는 것보다 9토에 태우는 편이 경험치 효율·영지 등급 모두 우위입니다.
      </p>
    </div>
  );
}

/** S0~S11 전체 흐름 — 9명 레벨/체력 단계별 추적 (kb/S3/123운용_정리.md 기반) */
const FLOW_STEPS: FlowStep[] = [
  // 순서: [강유, 유비, 제갈량, 채문희, 원소, 동탁, 서성, 대교, 태사자]
  {
    id: "S0",
    phase: "start",
    title: "시작 — 9명 전원 현재 체력 100",
    states: ["36/100", "36/100", "36/100", "27/100", "27/100", "27/100", "24/100", "24/100", "24/100"],
  },
  {
    id: "S1",
    phase: "reconfig",
    title: "1군 재구성① — 이관: 유비↔채문희 (유비 27로, 채문희 36으로)",
    states: ["36/100", "*27/100", "36/100", "*36/100", "27/100", "27/100", "24/100", "24/100", "24/100"],
  },
  {
    id: "S2",
    phase: "reconfig",
    title: "1군 재구성② — 이관: 제갈량↔서성 (제갈량 24로, 서성 36으로)",
    states: ["36/100", "27/100", "*24/100", "36/100", "27/100", "27/100", "*36/100", "24/100", "24/100"],
  },
  {
    id: "S3",
    phase: "capture",
    title: "배치1 — 9렙땅 5회 연속 점령 (①~⑤, 교체 없음) 각 슬롯 +490k",
    states: ["*36/0", "*27/0", "*24/0", "36/100", "27/100", "27/100", "36/100", "24/100", "24/100"],
  },
  {
    id: "S4",
    phase: "evac",
    title: "배치1 대피 — 축 3명(0) → 보라 더미로 (5/0 껍데기)",
    states: ["*5/0", "*5/0", "*5/0", "36/100", "27/100", "27/100", "36/100", "24/100", "24/100"],
  },
  {
    id: "S5",
    phase: "recover",
    title: "배치2 재구성 — 채문희·원소·대교 슬롯으로 체력 100 회복",
    states: ["*36/100", "*27/100", "*24/100", "*5/0", "*5/0", "27/100", "36/100", "*5/0", "24/100"],
  },
  {
    id: "S6",
    phase: "capture",
    title: "배치2 — 9렙땅 5회 연속 점령 (⑥~⑩) 각 슬롯 +490k",
    states: ["*36/0", "*27/0", "*24/0", "5/0", "5/0", "27/100", "36/100", "5/0", "24/100"],
  },
  {
    id: "S7",
    phase: "evac",
    title: "배치2 대피 — 축 3명(0) → 보라 더미로",
    states: ["*5/0", "*5/0", "*5/0", "5/0", "5/0", "27/100", "36/100", "5/0", "24/100"],
  },
  {
    id: "S8",
    phase: "recover",
    title: "배치3 재구성 — 서성·동탁·태사자 슬롯으로 체력 100 회복",
    states: ["*36/100", "*27/100", "*24/100", "5/0", "5/0", "*5/0", "*5/0", "5/0", "*5/0"],
  },
  {
    id: "S9",
    phase: "capture",
    title: "배치3 — 9렙땅 5회 연속 점령 (⑪~⑮) — 총 15개 완료",
    states: ["*36/0", "*27/0", "*24/0", "5/0", "5/0", "5/0", "5/0", "5/0", "5/0"],
  },
  {
    id: "S10",
    phase: "restore",
    title: "껍데기 복원 — 사용된 더미로 금색 6명 레벨 복구",
    states: ["36/0", "27/0", "24/0", "*36/0", "27/0", "*24/0", "*36/0", "*27/0", "24/0"],
  },
  {
    id: "S11",
    phase: "restore",
    title: "최종 정렬 — 9명 전원 자기 레벨 + 490k, 체력 0 (소진)",
    states: ["36/0", "*36/0", "*36/0", "*27/0", "27/0", "*27/0", "*24/0", "*24/0", "24/0"],
  },
];

/** S0~S11 흐름 추적 도식 섹션 */
function FlowTrackerSection() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
        전체 흐름 추적 (S0~S11, 9명 레벨·체력)
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        축 트리오(<strong>강유36·유비27·제갈량24</strong>)로 체력이 0이 될 때까지 <strong>5회 연속 점령</strong>하고,
        배치 경계에서만 대피·재구성 교체를 합니다(노가다 최소화). 3배치 × 5회 = <strong>9렙땅 15개</strong>.
        표에서 <span className="text-green-700 dark:text-green-400 font-semibold">초록 줄 = 배치(5연속 점령)</span>,
        노란 셀 = 그 단계에서 바뀐 값입니다.
      </p>
      <div className="mt-3">
        <StepTracker steps={FLOW_STEPS} />
      </div>

      {/* 조작 용어 주석 */}
      <div className="mt-3 space-y-2 text-sm">
        {/* 이관 */}
        <div className="rounded-lg border border-fuchsia-300 dark:border-fuchsia-700/60 bg-fuchsia-50 dark:bg-fuchsia-500/10 p-3">
          <div className="font-bold text-fuchsia-800 dark:text-fuchsia-300">
            <OpBadge type="이관" /> 이관(移管) — 재구성(S1·S2)에 쓰는 복합 조작
          </div>
          <p className="mt-1.5 text-zinc-700 dark:text-zinc-300">
            <strong>이관 = 퇴진 후 재편성 + 교체</strong>. 레벨을 다른 부대 장수에게 넘기면서
            <strong> 소속 부대까지 맞바꾸는</strong> 조작으로, 단순 <OpBadge type="교체" />와 구분됩니다.
          </p>
          <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-zinc-700 dark:text-zinc-300">
            <li>
              <strong>그냥 교체하면?</strong> 유비(1군)↔채문희(2군)를 바로 교체 →
              1군에 채문희 36, 2군에 유비 27 (축이 1군에 그대로 남아 원하는 결과 아님).
            </li>
            <li>
              <strong>이관 절차:</strong> ① 유비·채문희 <em>둘 다 퇴진</em> → ② 채문희를 1군에,
              유비를 2군에 <em>재편성</em> → ③ 유비↔채문희 <em>교체</em> → <strong>1군 유비 27 / 2군 채문희 36</strong>.
            </li>
          </ul>
        </div>

        {/* 대피 */}
        <div className="rounded-lg border border-orange-300 dark:border-orange-700/60 bg-orange-50 dark:bg-orange-500/10 p-3">
          <div className="font-bold text-orange-800 dark:text-orange-300">
            📦 대피 — 배치가 끝난 축 트리오를 더미에 잠시 옮기는 단계 (S4·S7)
          </div>
          <p className="mt-1.5 text-zinc-700 dark:text-zinc-300">
            5연속 점령으로 <strong>체력 0</strong>이 된 강유·유비·제갈량을 <strong>보라 더미(5레벨·고체력)와 교체</strong>합니다.
            축이 더 높은 레벨(36/27/24)이지만 체력이 0이라 <strong>하향 통일</strong>되어, 축은 5레벨 껍데기가 되고
            <strong> 더미가 36/27/24 슬롯(레벨+누적경험치)을 잠시 보관</strong>합니다.
          </p>
          <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-zinc-700 dark:text-zinc-300">
            <li><strong>왜?</strong> 방금 키운 슬롯(경험치)을 안전한 그릇(더미)에 잠깐 맡겨두고, 축 자리를 비워 다음 트리오를 세우기 위함.</li>
            <li><strong>슬롯 귀속</strong> 덕분에 경험치는 더미로 통째 이동 → S10 복원 때 원래 장수에게 되돌립니다.</li>
          </ul>
        </div>

        {/* 회복 */}
        <div className="rounded-lg border border-rose-300 dark:border-rose-700/60 bg-rose-50 dark:bg-rose-500/10 p-3">
          <div className="font-bold text-rose-800 dark:text-rose-300">
            ❤️ 회복 — 다음 배치의 만충 트리오를 세우는 단계 (S5·S8)
          </div>
          <p className="mt-1.5 text-zinc-700 dark:text-zinc-300">
            껍데기(5/0)가 된 축을 <strong>체력 100인 금색 예비 장수(채문희·원소·대교 / 서성·동탁·태사자)와 교체</strong>합니다.
            금색이 더 높은 레벨이고 <strong>체력(100) ≥ 껍데기(0)</strong>이므로 <strong>슬롯 보존·장수만 스왑</strong> →
            축이 금색의 <strong>36/100·27/100·24/100 슬롯을 가져가 체력 100으로 되살아납니다</strong>.
          </p>
          <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-zinc-700 dark:text-zinc-300">
            <li><strong>핵심 조건</strong> — 넘겨줄 장수의 레벨↑·체력↑. 그래서 만충(100) 금색 예비가 필요합니다.</li>
            <li>대신 그 금색 장수는 껍데기(5/0)를 받아 내려가고, 다음 배치의 점령 대상이 됩니다.</li>
          </ul>
        </div>

        {/* 복원 */}
        <div className="rounded-lg border border-sky-300 dark:border-sky-700/60 bg-sky-50 dark:bg-sky-500/10 p-3">
          <div className="font-bold text-sky-800 dark:text-sky-300">
            🔁 복원 — 껍데기가 된 금색 장수를 원래 레벨로 되돌리는 마무리 (S10·S11)
          </div>
          <p className="mt-1.5 text-zinc-700 dark:text-zinc-300">
            회복 과정에서 5레벨로 내려간 금색 6명을, <strong>대피 때 레벨을 보관해 둔 '사용된 더미'와 다시 교체</strong>해
            원래 레벨(36/27/24)로 되돌립니다. 더미가 보관하던 슬롯이 통째로 돌아오는 원리입니다.
          </p>
          <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-zinc-700 dark:text-zinc-300">
            <li>S11에서 유비↔채문희 등 마지막 정렬 교체로 2·3군 편성을 원위치 → <strong>9명 전원이 '자기 레벨 + 490k'</strong> 보유.</li>
            <li>체력은 15판으로 소진돼 0. 이후 시간당 회복으로 다시 채웁니다.</li>
          </ul>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3 text-center text-sm">
        <div className="rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-800/50 p-2">
          <div className="font-bold text-green-800 dark:text-green-300">점령 15회</div>
          <div className="text-zinc-700 dark:text-zinc-300">
            3배치 × 5회 → 9렙땅 <strong>15개</strong>
          </div>
        </div>
        <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800/50 p-2">
          <div className="font-bold text-amber-800 dark:text-amber-300">교체 조작</div>
          <div className="text-zinc-700 dark:text-zinc-300">
            배치 경계 <strong>2회만</strong> (노가다↓)
          </div>
        </div>
        <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800/50 p-2">
          <div className="font-bold text-blue-800 dark:text-blue-300">경험치</div>
          <div className="text-zinc-700 dark:text-zinc-300">
            9명 각 <strong>+490,000</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Tactics123Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Back link */}
      <div className="mb-4 flex gap-3 text-sm">
        <Link href="/tactics" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← 전술 목록
        </Link>
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          개척 가이드
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        123 운용 완전 정복
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        개척 9단계에서 쓰는 <strong>123 운용</strong>을 개념부터 실전·비교까지
        자세히 정리했습니다. (종합 랭킹을 노리는 고숙련 유저용)
      </p>

      {/* 핵심 요약 배너 */}
      <div className="mt-5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-500/10 p-4">
        <div className="font-bold text-amber-800 dark:text-amber-300">
          ⭐ 한 줄 정의
        </div>
        <p className="mt-1 text-amber-900 dark:text-amber-100">
          123은 <strong>전복 위험 + 병력 손실</strong>을 감수하고 1·2·3군 체력을
          골고루 써서 <strong>세 부대 레벨을 균등하게 맞추는 육성법</strong>입니다.
        </p>
        <div className="mt-3 font-bold text-amber-800 dark:text-amber-300">
          🚀 최대 장점 — 체력 병목 돌파
        </div>
        <p className="mt-1 text-amber-900 dark:text-amber-100">
          1군만 고레벨이면 <strong>체력 상한 200 · 회복 20/시간</strong>에 묶여
          10~12급지 확장이 한계에 부딪힙니다. 2·3군까지 고급 토지를 칠 수 있게
          키우면 <strong>체력 상한 600 · 회복 60/시간(약 3배)</strong>이 되어 하루에
          칠 수 있는 고급 토지 수가 크게 늘어납니다.
        </p>
      </div>

      {/* 타이밍 경고 배너 */}
      <div className="mt-4 rounded-xl border border-red-300 dark:border-red-700/60 bg-red-50 dark:bg-red-500/10 p-4">
        <div className="font-bold text-red-800 dark:text-red-300">
          ⏰ 반드시 초보자 기간(시즌 시작 48시간) 안에!
        </div>
        <p className="mt-1 text-red-900 dark:text-red-100">
          이 운용은 딸림 자리를 <strong>퇴진 후 재편성</strong>으로 계속 갈아끼웁니다.
          초보자 기간에는 퇴진 병력이 <strong>즉시 예비병으로 손실 없이 반환</strong>되지만,
          기간이 끝나면 <strong>80% 효율로 쌀로 전환(20% 손실)</strong>되고 쌀을 다시
          예비병으로 만드는 데 시간도 걸립니다. 기간 이후에는 반복할수록 병력 손실이
          누적되므로 <strong>48시간 안에 끝내는 것이 원칙</strong>입니다.
        </p>
      </div>

      {/* 핵심 흐름 도식 */}
      <div className="mt-6">
        <FlowDiagram />
      </div>

      {/* S0~S11 전체 흐름 추적 도식 */}
      <div className="mt-6">
        <FlowTrackerSection />
      </div>

      {/* 확정 메커니즘·경험치·비교 */}
      <div className="mt-6 space-y-6">
        <MechanicsSection />
        <ExpSection />
        <ScenarioCompareSection />
      </div>

      {/* 섹션들 */}
      <div className="mt-6 space-y-6">
        {SECTIONS.map((sec, i) => (
          <section
            key={i}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4"
          >
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {i + 1}. {sec.title}
            </h2>
            {sec.intro && (
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">{sec.intro}</p>
            )}
            <ListBlock
              label="할 일 / 흐름"
              items={sec.tasks}
              color="text-zinc-800 dark:text-zinc-300"
            />
            <ListBlock
              label="조건"
              items={sec.conditions}
              color="text-blue-700 dark:text-blue-400"
            />
            <ListBlock
              label="⚠ 주의"
              items={sec.warnings}
              color="text-red-700 dark:text-red-400"
            />
            <ListBlock
              label="💡 팁"
              items={sec.tips}
              color="text-sky-700 dark:text-sky-400"
            />
            {sec.title === "했을 때 vs 안 했을 때" && (
              <div className="mt-3">
                <CompareTable
                  headers={["항목", "❌ 안 했을 때(1군 단독)", "✅ 했을 때(123)"]}
                  rows={[
                    ["확보한 9레벨 땅", "3곳", "3곳 (동일)"],
                    ["1군 딜러 성장", "○ (1군만)", "○ (축 3명)"],
                    ["2·3군 성장", "✕ 방치", "○ 골고루 육성"],
                    ["다음 날 가동 부대", "1개", "3개 (개척 3배)"],
                    ["체력 소모", "1군만", "세 부대 분산"],
                    ["비용", "없음", "휴식 경험치·퇴진 병력 손실"],
                  ]}
                />
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="mt-8">
        <Link
          href="/tactics"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← 전술 목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
