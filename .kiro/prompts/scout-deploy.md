# Scout 배포 절차 (커밋 → 푸시 → 재배포 → seed 반영)

s2-guide-overlay를 프로덕션에 배포한다. 코드와 scout seed 데이터를 안전하게 반영.

## 사전 조건 / 사실

- 프로덕션: `https://cheonha.samgukji.top`, 서버 `root@216.45.63.224`
- 배포 스크립트: `deploy.ps1` (PowerShell). 작업 트리를 tar로 묶어 서버에서 Docker 빌드
- **`data/`는 gitignore** — 코드 커밋에 안 들어감. 배포 tar에는 포함되지만 **Dockerfile이 data를 복사하지 않음**(빈 디렉토리만 생성)
- scout 데이터는 **서버 볼륨 `/root/s2-data/`** 에 있음 (`-v /root/s2-data:/app/data`). 코드 배포는 이 볼륨을 건드리지 않음
- 이 환경은 Windows PowerShell. `&&` 대신 `;` 사용. 인라인 node/python은 따옴표 파싱 주의(단일 인용부호 선호)

## 절차

### 1. 빌드 검증
`npx next build` — "Compiled successfully" 확인. (`set-state-in-effect` lint 에러는 기존 패턴, 빌드 무해)

### 2. 커밋 & 푸시
- `git status --short`로 대상 확인
- `server.log`, `.env`, `data/`는 제외 (data는 gitignore 자동)
- `src/`만 스테이징 권장: `git add src/` (+ 필요한 자산 디렉토리)
- 커밋 후 `git push origin main` (사용자가 명시 요청 시에만 main 직접 푸시)

### 3. 코드 배포
- `.\deploy.ps1` 실행 → "Deploy SUCCESS" 확인
- 출력의 `System.Management.Automation.RemoteException`은 stderr 표시일 뿐 오류 아님

### 4. seed 데이터 반영 (필요 시)
로컬 `data/scout.json`을 서버에 올려야 할 때만:
1. **서버 현재 상태 확인** (덮어쓰기 위험 점검):
   `ssh root@216.45.63.224 'wc -c /root/s2-data/scout.json && grep -c createdBy /root/s2-data/scout.json'`
2. 서버에 앱으로 새로 입력된 데이터가 있으면(로컬과 diff) 먼저 병합. 없으면 진행
3. **백업**: `ssh root@216.45.63.224 'cp /root/s2-data/scout.json /root/s2-data/scout.json.bak-$(date +%Y%m%d-%H%M%S)'`
4. **업로드**: `scp data/scout.json root@216.45.63.224:/root/s2-data/scout.json` (scp는 단독 실행 — PowerShell 파싱 회피)
5. 컨테이너는 볼륨 마운트로 즉시 반영 (재시작 불필요)

### 5. 검증
- `curl.exe -s -o NUL -w "scout: %{http_code}`n" https://cheonha.samgukji.top/scout` → 200
- `ssh root@216.45.63.224 "docker logs s2-guide-overlay --tail 6"` → 오류 없음

## 주의
- `main` 직접 푸시·프로덕션 배포는 사용자 명시 확인 후에만
- 서버 볼륨 데이터는 실사용 데이터일 수 있으니 항상 백업 후 덮어쓰기
- 로컬 `data/scout.json`에 앱 입력 레코드(랜덤 UUID)가 섞여 있으면, 서버 데이터와 갈라지지 않게 병합 확인
