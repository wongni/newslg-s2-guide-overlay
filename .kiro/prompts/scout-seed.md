# Scout 스크린샷 → 프로덕션 백엔드 저장

게임 정찰(전투 기록) 스크린샷을 읽어 **이미 배포된 프로덕션 서버의 백엔드**에 적 플레이어/덱 데이터를 직접 반영한다.
로컬 `data/scout.json` 을 수정하거나 scp/재배포하지 않는다 — 프로덕션 scout API로 저장하면 서버 볼륨에 **즉시 반영**된다.

먼저 도메인 규칙을 로드: `.kiro/steering/scout-domain.md`를 참고(없으면 `/context add .kiro/steering/scout-domain.md`).

입력: 사용자가 `/paste` (Kiro 클립보드 이미지 읽기)로 붙여넣거나 경로로 제공한 스크린샷/이미지. 여러 장이면 최근 순으로 제공됨.

## 판독 절차

각 부대(군)마다 다음을 읽는다:
1. **무장 3명 이름** — 카드 하단 텍스트
2. **무장별 레벨** — 카드 좌상단 숫자
3. **무장별 병종 아이콘** — 카드 좌상단 아이콘 (방패🛡️/창🔱/활🏹/말🐎)
4. **무장별 깃발 수** — 무장 이름 위 깃발(🚩) 개수 (0~5)
5. **플레이어 이름** — 부대 우측 빨간 글씨
6. **동맹** — 이름 아래 (보통 "군단")

## 판정/변환 규칙

- **강화**: 무장 3명 깃발 수의 평균으로 계산 (≤1.5 명함 / ≤2.5 저돌파 / ≤3.5 중돌파 / >3.5 고돌파)
- **덱 식별**: 무장 3명 구성으로 표준 9덱 매칭. 없으면 커스텀 덱(이름은 무장 첫 글자 조합, 사용자 확인)
- **레벨 필터**: 무장 3명 **평균 레벨 < 46**이면 그 부대는 제외 (레벨은 저장 안 함, 필터 판단용)
- **dedup / 군 병합**: 같은 플레이어 이름 + 같은 덱 조합 = 같은 군. 같은 이름 + 다른 조합 = 같은 플레이어의 다른 군(빈 슬롯에 추가, 순서 무관). 이 병합은 `tools/scout-push.mjs` 가 서버 현재 상태 기준으로 자동 수행
- **최신 우선**: 스크린샷은 최근 순으로 제공됨. 같은 군이 재등장하면 더 최신 값 유지. 병종이 기존에 비어있으면 새 판독값으로 보강 (스크립트가 처리)
- 병종 판독이 불확실하면 사용자에게 확인. 깃발 판독 불가 시 0으로 간주(사용자 지시 시)

## 작업 방식

1. 스크린샷을 읽어 위 항목을 **표로 정리해 사용자에게 제시**
2. 불확실한 병종/이름/커스텀 덱 이름/커스텀 상성은 **사용자에게 확인**
3. 확정 후 판독 결과를 **payload JSON** 으로 만들어 프로덕션 API에 반영:
   - payload를 임시 파일(예: `tools/_scout-payload.json`)로 쓰거나 stdin으로 전달
   - **먼저 dry-run으로 계획 확인**: `node tools/scout-push.mjs --dry-run tools/_scout-payload.json`
   - 계획이 맞으면 실제 반영: `node tools/scout-push.mjs tools/_scout-payload.json`
   - 반영 후 임시 payload 파일 삭제
4. 스크립트 출력의 `summary` / `verify` 확인: `verify.badRefs` 가 0인지, players/decks 개수 확인
5. 결과 요약 (생성/갱신/재사용/스킵 항목)

## payload JSON 형식

`tools/scout-push.mjs` 가 받는 형식. 확인된 군만 넣는다(미확인 군은 생략).

```json
{
  "players": [
    {
      "name": "적이름",
      "alliance": "군단",
      "note": "메모(선택)",
      "armies": [
        {
          "deck": {
            "name": "조감초",
            "generals": ["감부인", "조운", "초선"],
            "manualVerdict": "카운터"
          },
          "troops": ["방패병", null, "궁병"],
          "reinforcement": "저돌파"
        }
      ]
    }
  ]
}
```

- `deck.manualVerdict` 는 **커스텀 덱**일 때만 의미 있음(표준 덱은 서버가 매트릭스로 자동 판정). 값: 카운터|미러|비등|회피
- `troops` 는 무장 3명 각각의 병종(미상 `null`). `reinforcement`: 명함|저돌파|중돌파|고돌파
- 덱이 미확인인 군은 army 자체를 생략(빈 슬롯으로 채워짐)

## 스크립트 동작 (`tools/scout-push.mjs`)

- 인증: `.env` 의 `SCOUT_PASSCODE` + `JWT_SECRET` 으로 `scout_pass` 쿠키(HMAC-SHA256)를 계산 (서버 `src/lib/scout-auth.ts` 와 동일 규칙)
- `SCOUT_BASE_URL` 환경변수로 대상 URL 지정 가능(기본 `https://cheonha.samgukji.top`)
- 절차: `GET /api/scout/data`(현재 상태) → 덱 dedup(구성 기준, 있으면 id 재사용, 없으면 `POST /api/scout/decks`) → 플레이어 병합(같은 이름 있으면 `PATCH`, 없으면 `POST`) → 재조회로 `badRefs` 검증
- `--dry-run` 은 쓰기(POST/PATCH) 없이 계획만 출력. `--stdin` 으로 payload를 표준입력 전달 가능

## 주의

- **프로덕션 데이터에 직접 쓴다.** 실제 반영 전 반드시 `--dry-run` 으로 계획을 확인하고, 애매하면 사용자 승인 후 실행
- 로컬 seed(`data/scout.json`)와 별개다. 이 워크플로우는 서버 볼륨(`/root/s2-data/scout.json`)에 바로 저장 → 재배포/scp 불필요
- 표준 덱을 새로 만들 필요는 거의 없다(서버에 이미 있으면 dedup됨). 커스텀 덱만 신규 생성됨
- `SCOUT_PASSCODE`/`JWT_SECRET` 은 비밀값 — 로그/출력에 노출하지 말 것
