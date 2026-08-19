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
# 0. Load SSH password from .env and ensure SSH key auth
# ============================================================
$envFile = Get-Content .env -ErrorAction SilentlyContinue | Where-Object { $_ -match "^SSH_PASSWORD=" }
$SSH_PASSWORD = if ($envFile) { ($envFile -split "=", 2)[1] } else { "" }

# Check if we can connect without password (key already installed)
$keyAuthWorks = $false
$sshTestResult = ssh -o BatchMode=yes -o ConnectTimeout=5 $REMOTE "echo ok" 2>$null
if ($sshTestResult -eq "ok") {
    $keyAuthWorks = $true
    Write-Host "SSH key auth OK" -ForegroundColor Green
} else {
    Write-Host "SSH key auth not set up. Installing SSH key..." -ForegroundColor Yellow
    if (-not $SSH_PASSWORD) {
        throw "SSH_PASSWORD not found in .env and key auth not configured"
    }
    # Use ssh-copy-id equivalent via pipe
    $pubKey = Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"
    # We need to use a tool that can pass password. Use a temporary expect-like approach.
    # On Windows, simplest is to use echo with pipe to ssh (won't work for interactive).
    # Fallback: prompt user once
    Write-Host "  Attempting to copy SSH key to server..." -ForegroundColor Yellow
    Write-Host "  Please enter the SSH password one last time:" -ForegroundColor Yellow
    $pubKey | ssh $REMOTE "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
    if ($LASTEXITCODE -ne 0) { throw "Failed to install SSH key" }
    Write-Host "  SSH key installed! Future deploys will not require password." -ForegroundColor Green
}

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

# Upload .env separately (excluded from tar by .dockerignore)
scp .env "${REMOTE}:~/s2-env-temp"
if ($LASTEXITCODE -ne 0) { throw ".env upload failed" }

scp scripts/remote-setup.sh "${REMOTE}:~/remote-setup.sh"
if ($LASTEXITCODE -ne 0) { throw "Script upload failed" }

scp scripts/edge-bootstrap.sh "${REMOTE}:~/edge-bootstrap.sh"
if ($LASTEXITCODE -ne 0) { throw "Bootstrap upload failed" }

# ============================================================
# 3. Execute remote setup
# ============================================================
Write-Host "[3/4] Setting up server and deploying..." -ForegroundColor Cyan
$ErrorActionPreference = "Continue"
ssh $REMOTE "chmod +x ~/remote-setup.sh ~/edge-bootstrap.sh && bash ~/remote-setup.sh '$CONTAINER' '$IMAGE' '$Port' '$Domain' && rm -f ~/remote-setup.sh ~/edge-bootstrap.sh" 2>&1 | ForEach-Object { Write-Host $_ }
$ErrorActionPreference = "Stop"

# ============================================================
# 4. Cleanup local
# ============================================================
Write-Host "[4/4] Cleaning up..." -ForegroundColor Cyan
Remove-Item -Force deploy.tar.gz -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Deploy complete!" -ForegroundColor Green
Write-Host "  URL: https://${Domain}" -ForegroundColor Yellow
Write-Host "  Direct IP access is blocked." -ForegroundColor DarkGray
