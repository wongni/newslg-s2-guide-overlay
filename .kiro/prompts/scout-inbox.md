# Scout 인박스 일괄 판독 → 프로덕션 반영

`tools/scout-inbox/`에 ShareX(F8, 활성 창 캡처)로 쌓아둔 정찰 스크린샷을 **한 번에** 판독해
프로덕션 서버에 반영한다. 처리 후 이미지는 `tools/scout-inbox/done/`으로 옮긴다.

도메인 규칙과 판독/변환 규칙은 다음을 따른다(없으면 context add):
- `.kiro/steering/scout-domain.md` — 데이터 구조·상성·강화·병종 규칙
- `.kiro/prompts/scout-deploy.md` 는 코드/seed 배포용. 여기서는 **판독→push**만 한다.

## 절차

1. **인박스 이미지 수집**
   - `tools/scout-inbox/` (하위 `done/` 제외) 의 이미지 파일 목록을 파일명(타임스탬프) 순으로 정렬.
   - 최신 우선 병합을 위해 **오래된 것 → 최신** 순으로 판독하되, 같은 군 재등장 시 최신 값 유지.
   - 이미지가 없으면 사용자에게 알리고 종료.

2. **판독** (각 부대/군마다)
   - 무장 3명 이름 / 무장별 레벨 / 병종 아이콘(🛡️창🔱활🏹말🐎) / 깃발 수(0~5) / 플레이어 이름(우측 빨간 글씨) / 동맹.
   - **강화**: 무장 3명 깃발 평균 → ≤1.5 명함 / ≤2.5 저돌파 / ≤3.5 중돌파 / >3.5 고돌파.
   - **레벨 필터**: 무장 3명 평균 레벨 < 46 인 부대는 제외(레벨은 저장 안 함).
   - **덱 식별**: 무장 3명 구성으로 표준 9덱 매칭. 없으면 커스텀(이름=무장 첫 글자 조합, 사용자 확인).

3. **표로 정리해 사용자에게 제시** — 플레이어/덱/병종/강화/(판독한 레벨). 불확실한 병종·이름·커스텀 덱 이름·커스텀 상성은 **확인 요청**.

4. **payload 생성 → 반영** (`tools/scout-push.mjs` 사용)
   - 확정 후 `tools/_scout-payload.json` 작성 (형식은 scout-push.mjs 주석/ scout-deploy.md 참고).
   - **dry-run 먼저**: `node tools/scout-push.mjs --dry-run tools/_scout-payload.json`
   - 계획 확인 후 실제 반영: `node tools/scout-push.mjs tools/_scout-payload.json`
   - 출력의 `verify.badRefs == 0`, players/decks 개수 확인.
   - 임시 payload 파일 삭제.

5. **처리한 이미지 이동**: 판독 완료된 인박스 이미지를 `tools/scout-inbox/done/`으로 이동
   (PowerShell: `Move-Item tools/scout-inbox/*.png tools/scout-inbox/done/`).
   - 판독 실패/보류 이미지는 인박스에 남겨두고 사용자에게 알림.

6. **결과 요약** — 생성/갱신/재사용/스킵(레벨 미달 등), 이동한 이미지 수.

## 주의
- **프로덕션 데이터에 직접 쓴다.** 실제 반영 전 반드시 dry-run 확인, 애매하면 사용자 승인 후 실행.
- `SCOUT_PASSCODE`/`JWT_SECRET` 은 비밀값 — 로그/출력 노출 금지.
- 병종 판독 불확실 시 `null`, 깃발 판독 불가 시 사용자 지시에 따름.
