# Track 1 — 전법 반자동 추출 사용법

게임에서 전법을 하나씩 열면서 읽기 전용 스냅샷을 떠, 새로 나타난 설명을 그 전법에 매칭해
`kb/{무장}-{전법}.md` 를 자동 생성한다. 코드 주입/쓰기/후킹 없음(PROCESS_VM_READ만).

## 도구
- `tools/track1_snap.py`  : 현재 메모리의 전법 설명(giver.skillLv 포함)·이름 후보를 스냅샷 저장 (관리자 필요)
- `tools/track1_match.py` : 스냅샷 diff + KB 파일 생성 (관리자 불필요)

## 절차 (전법 1개당)

1) (선택) 기준 스냅샷: 아무 전법도 안 연 상태에서 1회 스냅샷.
   ```powershell
   Start-Process python -ArgumentList 'C:\src\s2-guide-overlay\tools\track1_snap.py' -Verb RunAs -Wait
   ```
   → `extracted/track1/snap_<ts>.json` 저장, `_latest.txt` 갱신.

2) 게임에서 대상 전법 상세 화면을 연다(이름+설명이 화면에 보이도록).

3) 새 스냅샷:
   ```powershell
   Start-Process python -ArgumentList 'C:\src\s2-guide-overlay\tools\track1_snap.py' -Verb RunAs -Wait
   ```

4) diff 로 '새로 나타난 설명' 확인:
   ```powershell
   python C:\src\s2-guide-overlay\tools\track1_match.py diff <이전 snap 경로> <새 snap 경로>
   ```
   출력된 `[n] 설명...` 중 대상 전법의 설명 인덱스를 확인.

5) KB 생성 (설명 인덱스로):
   ```powershell
   python C:\src\s2-guide-overlay\tools\track1_match.py gen --general "무장이름" --name "전법이름" --old <이전 snap> --desc-index <n> --type "패시브"
   ```
   → `kb/무장이름-전법이름.md` 생성 (만렙 수치 계산 + 마크업 제거 + #N# 치환 + 수치표 + 원본).

## 더 간단한 방법 (설명 직접 지정)
설명 문자열을 알고 있으면 diff 없이 바로 생성:
```powershell
python C:\src\s2-guide-overlay\tools\track1_match.py genraw --general "유비" --name "백성과 함께" --desc "<원본 설명 그대로>"
```
(PowerShell에서 `$` 는 백틱으로 이스케이프: `` `$ ``)

## 팁
- 여러 전법을 연속으로 열며 매번 스냅샷을 뜨면, 직전 스냅샷을 `--old` 로 주어 매번 '신규 설명'만 좁혀서 고를 수 있다.
- 이름이 확실치 않으면 스냅샷의 `names` 목록과 화면을 대조.
- `giver.skillClass` 등 계산 불가 변수는 원본 표기가 유지된다(만렙 표에 안 나옴).
- 상태 `#N#` 매핑은 `track1_match.py` 의 STATE_MAP 참조(미확정은 원본 유지).
