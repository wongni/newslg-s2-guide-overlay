// 개척 트래킹(정밀 액션 로그) 데이터 타입.
// 원본: kb/S3/개척-트래킹.md (저돌파 기준 단일 경로)

/** 부대 단위 상태. 값이 없으면(직전 값 유지) undefined. */
export interface TrackingUnitState {
  /** 소수점 레벨(경험치 기반 예상치). undefined = 변화 없음("-"). */
  lv?: number;
  /** 체력. undefined = 변화 없음("-"). */
  hp?: number;
}

/** 한 행(개척1/2/3의 단일 행동 또는 마일스톤). */
export interface TrackingRow {
  /** 챕터/구간 라벨. 예: "7장", "7장 완료", "시작". */
  chapter: string;
  /** 행동 종류. */
  action:
    | "개간"
    | "점령"
    | "소탕"
    | "둔전"
    | "완료"
    | "편성"
    | "회복"
    | "퇴진/편성"
    | "퇴진"
    | "교체"
    | "대기"
    | "한도증가"
    | "기타";
  /** 대상 토지/부대 표기. 예: "Lv5 ×9 (개척2)". */
  target?: string;
  /** 개간지 현황. 예: "Lv5×9, Lv3×1 (10/10)". */
  reclaimStatus?: string;
  /** 점령지 현황. 예: "Lv5×3, Lv3×1 (4/12)". */
  occupyStatus?: string;
  /** 개척1/2/3 순서의 부대 상태 배열(길이 3). */
  units: [TrackingUnitState, TrackingUnitState, TrackingUnitState];
  /** 닭다리 개수. 숫자 또는 "회복" 같은 특수 표기. */
  chicken?: number | string;
  /** 팁/비고. */
  tip?: string;
  /** 챕터 완료/한도 증가 등 강조 행 여부. */
  milestone?: boolean;
}

/** 규칙 안내 섹션(접이식). */
export interface TrackingRuleSection {
  heading: string;
  items: string[];
}

/** 부록 A: 레벨별 누적 경험치 기준선(5레벨=0 기준). */
export interface CumulativeExpEntry {
  level: number;
  cumulativeExp: number;
}

/** 토지 레벨별 경험치/최소 부대레벨 표. */
export interface LandExpEntry {
  /** 토지 레벨. */
  landLevel: number;
  /** 경험치 100% 받는 최소 부대 레벨. */
  fullExpMinLevel: number;
  /** 수비군 레벨. */
  guardLevel: number;
  /** 100% 획득 경험치. */
  exp: number;
}

/** 출처/참고 자료 링크. */
export interface SourceLink {
  label: string;
  url: string;
}

/** 개척 부대(덱)의 장수 1명. */
export interface PioneerDeckGeneral {
  /** 장수 이름. 예: "SP 제갈량". */
  name: string;
  /** 레벨(선택). 예: 50. */
  level?: number;
  /** 전법 목록(선택). 예: ["연전연승", "허점 공략"]. */
  tactics?: string[];
}

/** 개척 부대(덱) 하나. 예: 개척2덱. */
export interface PioneerDeck {
  /** 부대 라벨. 예: "개척2". */
  label: string;
  /** 진형(선택). 예: "기형진", "안형진". */
  formation?: string;
  /** 장수 구성(보통 3명). */
  generals: PioneerDeckGeneral[];
  /** 운영 팁(선택). 스탯 배분·전법 교체 등. */
  tips?: string[];
}

/** 저돌파/고돌파 공통 데이터(알아두기·규칙·표). tracking-common.json. */
export interface TrackingCommon {
  /** 목적/개요 설명 문단(알아두기). */
  intro: string[];
  /** 준비 과정 섹션(선택). heading별 하위 항목. */
  prep?: TrackingRuleSection[];
  /** 시작 상태 설명. */
  startState: string[];
  /** 게임 메커니즘/계산 규칙 섹션. */
  rules: TrackingRuleSection[];
  /** 토지 레벨별 경험치 표(선택). */
  landExp?: LandExpEntry[];
  /** 부록 A: 누적 경험치선(선택). */
  cumulativeExp?: CumulativeExpEntry[];
  /** 개척 부대(덱) 구성(선택). 저돌파/고돌파 공용. */
  decks?: PioneerDeck[];
  /** 출처/참고 자료(선택). */
  sources?: SourceLink[];
}

/** 돌파별 고유 데이터(제목·트래킹 행). tracking.json / tracking-high.json. */
export interface TrackingRowsFile {
  /** 문서 제목. */
  title: string;
  /** 트래킹 행 목록. */
  rows: TrackingRow[];
}

/** 트래킹 문서 전체 데이터(공통 + 고유 병합). */
export interface TrackingData {
  /** 문서 제목. */
  title: string;
  /** 목적/개요 설명 문단. */
  intro: string[];
  /** 준비 과정 섹션(선택). */
  prep?: TrackingRuleSection[];
  /** 시작 상태 설명. */
  startState: string[];
  /** 게임 메커니즘/계산 규칙 섹션. */
  rules: TrackingRuleSection[];
  /** 토지 레벨별 경험치 표(선택). */
  landExp?: LandExpEntry[];
  /** 트래킹 행 목록. */
  rows: TrackingRow[];
  /** 부록 A: 누적 경험치선(선택). */
  cumulativeExp?: CumulativeExpEntry[];
  /** 개척 부대(덱) 구성(선택). */
  decks?: PioneerDeck[];
  /** 출처/참고 자료(선택). */
  sources?: SourceLink[];
}
