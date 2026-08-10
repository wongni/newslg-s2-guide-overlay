#!/bin/bash

# deploy.sh — Next.js 앱을 원격 서버에 배포하는 스크립트
# 사용법: ./deploy.sh

set -e

# ─── 설정 ───────────────────────────────────────────────
REMOTE_HOST="216.45.63.224"
REMOTE_USER="root"
REMOTE_DIR="/home/${REMOTE_USER}/s2-guide-overlay"
APP_PORT=3000

# ─── 로컬 빌드 ──────────────────────────────────────────
echo "📦 프로덕션 빌드 중..."
npm run build

# ─── 전송할 파일 준비 ────────────────────────────────────
echo "📁 배포 아카이브 생성 중..."
tar -czf deploy.tar.gz \
  .next \
  public \
  package.json \
  package-lock.json \
  next.config.ts \
  --ignore-failed-read 2>/dev/null || true

# ─── 서버에 전송 ─────────────────────────────────────────
echo "🚀 서버에 파일 전송 중..."
scp deploy.tar.gz "${REMOTE_USER}@${REMOTE_HOST}:~/"

# ─── 서버에서 배포 실행 ──────────────────────────────────
echo "⚙️  서버에서 배포 설정 중..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" << 'EOF'
  set -e

  # 디렉토리 생성
  mkdir -p ~/s2-guide-overlay
  cd ~/s2-guide-overlay

  # 기존 파일 정리 및 압축 해제
  tar -xzf ~/deploy.tar.gz
  rm ~/deploy.tar.gz

  # 의존성 설치 (프로덕션만)
  npm install --production

  # 기존 프로세스 종료
  pkill -f "next start" || true
  sleep 2

  # 앱 시작 (백그라운드)
  nohup npx next start -p 3000 > app.log 2>&1 &

  echo "✅ 배포 완료! http://$(hostname -I | awk '{print $1}'):3000"
EOF

# ─── 로컬 정리 ───────────────────────────────────────────
rm -f deploy.tar.gz

echo ""
echo "✅ 배포가 완료되었습니다!"
echo "   → http://${REMOTE_HOST}:${APP_PORT}"
