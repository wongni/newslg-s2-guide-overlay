# deploy.ps1 - Idempotent deploy of Next.js app to a fresh or existing Linux server
# Usage: .\deploy.ps1 [-Server <ip>] [-User <user>] [-Domain <subdomain.domain.tld>]
#
# Prerequisites (local): ssh, scp, tar available in PATH
# Target: Any Ubuntu/Debian Linux server with SSH access (Docker will be installed if missing)

param(
    [string]$Server = "216.45.63.224",
    [string]$User = "root",
    [string]$Domain = "cheonha.samgukji.top",
    [int]$Port = 80
)

$ErrorActionPreference = "Stop"
$REMOTE = "${User}@${Server}"
$CONTAINER = "s2-guide-overlay"
$IMAGE = "s2-guide-overlay"

# ============================================================
# 1. Create source archive
# ============================================================
Write-Host "`n[1/4] Creating source archive..." -ForegroundColor Cyan
tar -czf deploy.tar.gz --exclude=node_modules --exclude=.next --exclude=.git --exclude=deploy.tar.gz .

# ============================================================
# 2. Upload to server
# ============================================================
Write-Host "[2/4] Uploading to ${REMOTE}..." -ForegroundColor Cyan
scp deploy.tar.gz "${REMOTE}:~/"
if ($LASTEXITCODE -ne 0) { throw "Upload failed" }

scp scripts/remote-setup.sh "${REMOTE}:~/remote-setup.sh"
if ($LASTEXITCODE -ne 0) { throw "Script upload failed" }

scp scripts/edge-bootstrap.sh "${REMOTE}:~/edge-bootstrap.sh"
if ($LASTEXITCODE -ne 0) { throw "Bootstrap upload failed" }

# ============================================================
# 3. Execute remote setup
# ============================================================
Write-Host "[3/4] Setting up server and deploying..." -ForegroundColor Cyan
ssh $REMOTE "chmod +x ~/remote-setup.sh ~/edge-bootstrap.sh && bash ~/remote-setup.sh '$CONTAINER' '$IMAGE' '$Port' '$Domain' && rm -f ~/remote-setup.sh ~/edge-bootstrap.sh"
if ($LASTEXITCODE -ne 0) { throw "Remote deploy failed" }

# ============================================================
# 4. Cleanup local
# ============================================================
Write-Host "[4/4] Cleaning up..." -ForegroundColor Cyan
Remove-Item -Force deploy.tar.gz -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Deploy complete!" -ForegroundColor Green
Write-Host "  URL: https://${Domain}" -ForegroundColor Yellow
Write-Host "  Direct IP access is blocked." -ForegroundColor DarkGray
