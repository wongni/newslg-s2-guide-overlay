# 배포 가이드

## 개요

`deploy.ps1` (Windows) / `deploy.sh` (macOS/Linux)는 완전히 새로운 서버에서도 한 번의 실행으로 전체 환경 설정과 배포를 완료하는 멱등(idempotent) 스크립트입니다.

## 전제 조건

### 로컬 (배포 실행 환경)
- SSH 접근 가능 (ssh, scp)
- tar 명령어 사용 가능

### 서버 (배포 대상)
- Ubuntu/Debian 기반 Linux
- root SSH 접근 가능
- 인터넷 연결 (Docker 설치용)

그 외(Docker, iptables-persistent 등)는 스크립트가 자동 설치합니다.

## 사용법

### Windows (PowerShell)

```powershell
# 기본 설정으로 배포
.\deploy.ps1

# 커스텀 서버/도메인 지정
.\deploy.ps1 -Host "1.2.3.4" -User "root" -Domain "my.example.com"
```

### macOS/Linux (Bash)

```bash
# 기본 설정으로 배포
./deploy.sh

# 커스텀 서버/도메인 지정
./deploy.sh 1.2.3.4 root my.example.com
```

### 기본값

| 파라미터 | 기본값 |
|----------|--------|
| Host | `216.45.63.224` |
| User | `root` |
| Domain | `sam.wongni.xyz` |
| Port | `80` |

## 스크립트 동작 순서

```
로컬                              서버
─────                            ─────
1. 소스 아카이브 생성 ──scp──→  
                                 2. Docker 설치 (없는 경우)
                                 3. iptables-persistent 설치 (없는 경우)
                                 4. Docker 이미지 빌드 & 컨테이너 실행
                                 5. 방화벽: Cloudflare IP만 허용
                                 6. 방화벽 규칙 영구 저장
                                 7. 컨테이너 상태 검증
```

## 멱등성

같은 스크립트를 몇 번이든 실행해도 동일한 결과를 보장합니다.

| 단계 | 처리 방식 |
|------|-----------|
| Docker 설치 | 이미 설치되어 있으면 스킵 |
| iptables-persistent | 이미 설치되어 있으면 스킵 |
| 기존 컨테이너 | stop/rm 후 새로 생성 |
| 방화벽 규칙 | DOCKER-USER chain 전체 초기화 후 재적용 |
| 규칙 영구화 | 매 배포마다 `netfilter-persistent save` |

## 네트워크 구성

```
사용자 ──HTTPS──→ Cloudflare ──HTTP(80)──→ 서버 Docker (내부 3000)
```

- 사용자 ↔ Cloudflare: HTTPS (Cloudflare 무료 인증서)
- Cloudflare ↔ 서버: HTTP (Flexible SSL 모드)
- 직접 IP 접속: **차단됨** (Cloudflare IP 대역만 허용)

### Cloudflare 설정 (수동, 최초 1회)

1. Cloudflare에 도메인 추가
2. DNS에 A 레코드 추가: `sam` → 서버 IP (Proxied)
3. SSL/TLS → **Flexible** 선택
4. 도메인 등록기(Spaceship 등)에서 네임서버를 Cloudflare로 변경

## 보안

### 방화벽 (자동 적용)

DOCKER-USER chain을 통해 [Cloudflare IPv4 대역](https://www.cloudflare.com/ips-v4/)만 포트 80(컨테이너 3000)에 접근 가능합니다. 직접 IP로 접속 시 연결이 거부됩니다.

허용 대역:
```
173.245.48.0/20, 103.21.244.0/22, 103.22.200.0/22, 103.31.4.0/22,
141.101.64.0/18, 108.162.192.0/18, 190.93.240.0/20, 188.114.96.0/20,
197.234.240.0/22, 198.41.128.0/17, 162.158.0.0/15, 104.16.0.0/13,
104.24.0.0/14, 172.64.0.0/13, 131.0.72.0/22
```

### SSH 포트

SSH(22번)는 방화벽 규칙에 영향받지 않으며 정상 접근 가능합니다.

## 트러블슈팅

### 포트 80이 이미 사용 중
```bash
ssh root@서버IP "docker ps -a --filter publish=80"
# 충돌하는 컨테이너 제거 후 재배포
```

### 컨테이너 로그 확인
```bash
ssh root@서버IP "docker logs s2-guide-overlay --tail 50"
```

### 방화벽 규칙 확인
```bash
ssh root@서버IP "iptables -L DOCKER-USER -n --line-numbers"
```

### DNS 전파 확인
```bash
nslookup sam.wongni.xyz 8.8.8.8
```
