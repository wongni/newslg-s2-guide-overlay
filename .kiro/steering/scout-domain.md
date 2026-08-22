---
inclusion: manual
---

# 적 정찰(Scout) 도메인 규칙

삼국지 전략게임 정찰 기능의 데이터·상성 규칙. scout 관련 작업 시 참고.

## 데이터 구조

- 저장 파일: `data/scout.json` (gitignore 대상 — 코드 커밋에 포함 안 됨, 배포 tar에는 포함)
- 서버 볼륨: `/root/s2-data/scout.json` (Docker `-v /root/s2-data:/app/data`)
- 타입: `src/lib/repositories/types.ts`의 `EnemyDeck`, `EnemyPlayer`, `EnemyArmy`, `ScoutData`
- 덱 dedup 로직: `src/data/enemy-decks.ts`의 `deckCanonicalKey` / `isSameDeckCanonical` (순서·별칭·표기 흔들림 흡수)
- 최대 군 수: `ARMY_COUNT = 5` (`src/data/enemy-decks.ts`) — 적/내 부대 공통

### EnemyPlayer
- `id`, `name`(게임상 이름), `alliance`(동맹/군단), `armies: EnemyArmy[]`(길이 ARMY_COUNT=5), `note?`
- 같은 `name` + 같은 덱 조합 = 같은 군(부대). 같은 `name` + 다른 조합 = 같은 플레이어의 다른 군.

### EnemyArmy
- `deckId`(EnemyDeck 참조, null=미확인), `troops`(무장 3명 병종, null 허용), `reinforcement`(강화 단계)

### EnemyDeck
- `id`, `name`(덱 이름), `generals`(무장 3명), `isStandard`(표준 9덱 여부), `manualVerdict?`

## 표준 덱 9종 (matchup.ts TEAMS)
조감초, 여진악, 악순주, 태황유, 태원마, 쌍황육(별칭 조손육), 손노육, 조순사, 유관장
- 무장 매핑: `src/data/generals.ts`의 `TEAM_GENERALS`
- 별칭 테이블: `enemy-decks.ts`의 `RAW_ALIASES` (표기 흔들림 흡수)

## 강화 단계 (reinforcement)
- 값: 명함 | 저돌파 | 중돌파 | 고돌파
- **깃발 수 → 강화 매핑** (무장 3명 깃발 수의 평균):
  - 평균 ≤ 1.5 → 명함
  - ≤ 2.5 → 저돌파
  - ≤ 3.5 → 중돌파
  - > 3.5 → 고돌파

## 병종 (troops) — 표시/추측 전용, 덱 상성 판정엔 미반영
- 값: 방패병 | 창병 | 궁병 | 기병
- 인게임 아이콘: 방패=🛡️, 창(삼지창)=🔱, 활=🏹, 말=🐎
- 순환 상성: 방패▶궁▶창▶기▶방패

## 커스텀 덱 명명 컨벤션
- 표준 9덱에 없는 조합은 커스텀 덱 (`isStandard: false`)
- 이름: 무장 이름 첫 글자 조합 (예: 주유/주태/황개 → "주주황", 마초/원소/손권 → "손원마")
- dedup은 무장 구성 기준(순서 무관)이므로 이름이 달라도 같은 무장이면 같은 덱

## 상성 판정 (judgeMatchup)
- 내 덱(공격) vs 적 덱(방어). 카운터=유리, 미러=동일, 비등=호각, 회피=불리
- 둘 다 표준 → MATCHUP_MATRIX 자동 판정
- 적이 커스텀 → manualVerdict(수동 지정) 사용
