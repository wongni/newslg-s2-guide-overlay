# 커뮤니티 가이드 공유 시스템 설계

## 개요

유저가 나만의 가이드를 만들고, 공유하고, 남의 가이드를 발견/가져올 수 있는 시스템.

## 인증

### Passwordless Email (4자리 코드)
1. 유저가 이메일 입력
2. 서버가 4자리 숫자 코드 생성 + 이메일 발송
3. 유저가 코드 입력
4. 서버가 JWT 발급 (httpOnly cookie, 영구 — 명시적 로그아웃 전까지 유지)

### 이메일 발송
- 서비스: Resend (3,000통/월 무료)
- 발신 도메인: `samgukji.top` (DNS에 Resend 인증 레코드 추가 필요)

### 임시 이메일 차단
- disposable email 도메인 블랙리스트 적용
- 소스: https://github.com/disposable-email-domains/disposable-email-domains

## 사용자 모델

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "nickname": "닉네임",       // 필수
  "server": "3서버",         // 선택
  "alliance": "동맹명",      // 선택
  "role": "user | admin",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

### 권한
- 읽기: 모두 (무인증)
- 쓰기 (게시/반응/신고): 인증 필요
- Admin: 모든 가이드 수정/삭제 가능, 유저에게 admin 역할 부여 가능
- 초기 Admin: wongni@gmail.com

## 가이드 공유 모델

```json
{
  "id": "uuid",
  "code": "A3F9K2",          // 랜덤 6자리 영숫자 (대문자)
  "authorId": "user uuid",
  "title": "가이드 제목",
  "description": "한 줄 설명",
  "steps": [...],
  "tierValues": {...},
  "commonValues": {...},
  "likes": 0,
  "dislikes": 0,
  "reports": 0,
  "isHidden": false,
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

### 제한
- localStorage (비인증): 나만의 가이드 1개
- 서버 (인증 후): 비공개 가이드 최대 5개 + 공개 게시 최대 5개
- step 최대 100개
- 총 데이터 크기 1MB 이하

## API 설계

### 인증
- `POST /api/auth/send-code` — 이메일로 4자리 코드 전송
- `POST /api/auth/verify-code` — 코드 검증 + JWT 발급 (첫 로그인 시 닉네임도 받음)
- `GET /api/auth/me` — 현재 유저 정보
- `POST /api/auth/logout` — 쿠키 삭제
- `PUT /api/auth/profile` — 닉네임/서버/동맹 수정

### 가이드 공유
- `GET /api/guides` — 목록 조회 (정렬: 최신/인기) [무인증]
- `GET /api/guides/:code` — 코드로 가이드 조회 [무인증]
- `POST /api/guides` — 가이드 게시 [인증]
- `PUT /api/guides/:code` — 가이드 수정 [인증, 본인 or admin]
- `DELETE /api/guides/:code` — 가이드 삭제 [인증, 본인 or admin]

### 반응
- `POST /api/guides/:code/react` — 좋아요/싫어요 [인증]
- `POST /api/guides/:code/report` — 신고 [인증]

### Admin
- `GET /api/admin/users` — 유저 목록
- `PUT /api/admin/users/:id/role` — 역할 변경
- `GET /api/admin/guides/reported` — 신고된 가이드 목록

## 저장소

### Phase 1: JSON 파일 기반
```
data/
  users.json          — 유저 목록
  guides/
    {code}.json       — 개별 가이드 파일
  reactions.json      — 반응 기록 (좋아요/싫어요)
  reports.json        — 신고 기록
  auth-codes.json     — 대기 중인 인증 코드 (TTL 5분)
```

### 추후 DB 이전을 위한 설계 원칙
- 모든 데이터 접근은 Repository 패턴으로 추상화
- `src/lib/repositories/` 아래 인터페이스 정의
- JSON 구현체를 기본 제공, 추후 SQLite/PostgreSQL 구현체로 교체

```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(user: CreateUserInput): Promise<User>
  update(id: string, data: Partial<User>): Promise<User>
}

interface GuideRepository {
  findByCode(code: string): Promise<SharedGuide | null>
  list(options: ListOptions): Promise<{ guides: SharedGuide[], total: number }>
  create(guide: CreateGuideInput): Promise<SharedGuide>
  update(code: string, data: Partial<SharedGuide>): Promise<SharedGuide>
  delete(code: string): Promise<void>
  countByAuthor(authorId: string): Promise<number>
}
```

## Rate Limiting

- 인증 코드 요청: 동일 이메일 1분에 1회, IP 당 1시간에 10회
- 가이드 게시: 유저당 1시간에 2건
- 반응: 유저당 가이드당 1건 (토글)
- 신고: 유저당 1시간에 3건

## 어뷰징 방어

- 임시 이메일 도메인 블랙리스트
- 인증된 유저만 쓰기 행위 가능
- 유저당 가이드 최대 5개
- 신고 5건 이상 (서로 다른 유저) → 자동 숨김
- Admin 킬스위치: 공유 기능 일시 비활성화 가능

## UI 흐름

### 나만의 가이드 인증 유도
- 나만의 가이드 생성/수정: 무인증 OK (localStorage)
- 저장 성공 후 배너: "💡 로그인하면 다른 기기에서도 사용 + 커뮤니티 공유 가능"
- 로그인 시: localStorage 가이드를 서버에 비공개로 자동 동기화
- 공유하기 버튼 클릭 시: 미로그인이면 로그인 요구

### 가이드 공유 페이지 (`/guides`)
- 가이드 카드 리스트 (제목, 작성자, 좋아요/싫어요, 날짜)
- 정렬: 최신순 / 인기순
- 클릭 → 상세 보기 (미리보기 + 가져오기 버튼)

### 내보내기 (공유하기)
- "공유하기" 버튼 → 제목/설명 입력 → 코드 발급
- 코드를 클립보드에 복사 + URL (`/guides/A3F9K2`) 표시

### 가져오기
- 코드 입력 or URL 접속 → 미리보기 → "나만의 가이드로 가져오기"
- 로그인 불필요 (localStorage에 저장)
- 미로그인 시 "다른 기기에서는 공유되지 않습니다" 안내

## Docker 볼륨

```yaml
docker run -d \
  --name s2-guide-overlay \
  -v /root/s2-data:/app/data \
  --network edge-net \
  s2-guide-overlay
```

## 환경변수

```env
ADMIN_PASSWORD=s2guide-admin-2024
ADMIN_EMAIL=wongni@gmail.com
RESEND_API_KEY=re_xxxx
JWT_SECRET=random-secret-here
```
