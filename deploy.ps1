# deploy.ps1 - Deploy Next.js app via Docker
# Usage: .\deploy.ps1

$ErrorActionPreference = "Stop"

# --- Config ---
$REMOTE_HOST = "216.45.63.224"
$REMOTE_USER = "root"
$APP_PORT = 3000

# --- Create Archive (source code) ---
Write-Host "[1/3] Creating source archive..." -ForegroundColor Cyan
$exclude = @("node_modules", ".next", ".git", "deploy.tar.gz")
tar -czf deploy.tar.gz --exclude=node_modules --exclude=.next --exclude=.git .

# --- Upload to Server ---
Write-Host "[2/3] Uploading to server..." -ForegroundColor Cyan
scp deploy.tar.gz "${REMOTE_USER}@${REMOTE_HOST}:~/"
if ($LASTEXITCODE -ne 0) { throw "Upload failed" }

# --- Remote Docker Build & Run ---
Write-Host "[3/3] Building and starting Docker container..." -ForegroundColor Cyan
$remoteScript = "rm -rf ~/s2-guide-overlay && mkdir -p ~/s2-guide-overlay && cd ~/s2-guide-overlay && tar -xzf ~/deploy.tar.gz && rm ~/deploy.tar.gz && docker stop s2-guide-overlay 2>/dev/null || true && docker rm s2-guide-overlay 2>/dev/null || true && docker build -t s2-guide-overlay . && docker run -d --name s2-guide-overlay --restart unless-stopped -p ${APP_PORT}:3000 s2-guide-overlay && echo 'Deploy complete!'"

ssh "${REMOTE_USER}@${REMOTE_HOST}" $remoteScript
if ($LASTEXITCODE -ne 0) { throw "Remote deploy failed" }

# --- Cleanup ---
Remove-Item -Force deploy.tar.gz -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Deploy complete!" -ForegroundColor Green
Write-Host "  http://${REMOTE_HOST}:${APP_PORT}" -ForegroundColor Yellow
