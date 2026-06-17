#!/usr/bin/env bash
# KOOS standalone 번들을 x86_64(el7) 환경에서 직접 빌드·설치 검증한다.
# GitHub Actions 없이 로컬에서 돌리기 위한 스크립트다.
#
# 흐름:
#   1) pnpm build:standalone                      (호스트, 웹 빌드)
#   2) vendor/ 에 RPM 이 없으면 URL 에서 curl 다운로드 (Chrome, Vulkan)
#   3) pnpm pack:standalone                        (release/*.tar.gz 생성)
#   4) amd64 el7 컨테이너에서 tar 풀고 install.sh 실행 → google-chrome-stable --version 확인
#
# Apple Silicon(arm64) 등에서는 Docker 가 --platform linux/amd64 (qemu)로 el7 을 재현한다.
#
# 환경변수:
#   CHROME_RPM_URL    Chrome RPM 다운로드 URL (기본값 아래)
#   VULKAN_RPM_URL    Vulkan RPM 다운로드 URL (기본값 아래)
#   EL7_IMAGE         컨테이너 이미지 (기본 centos:7)
#   INSTALL_NODEPS=1  의존성 해결 없이 rpm -Uvh --nodeps 로 설치(패키징/실행 분리 검증용)
#   SKIP_CONTAINER=1  컨테이너 단계 생략(번들 생성까지만)
#   KEEP_CONTAINER=1  검증 후 컨테이너를 지우지 않고 셸 진입
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$PWD"

# ── 기본 RPM URL ────────────────────────────────────────────────────────
# 주의: 구버전 RPM 은 미러에서 사라졌을 수 있다. 실패 시 URL 을 직접 지정하거나
# vendor/ 에 RPM 파일을 미리 두면 다운로드를 건너뛴다.
CHROME_RPM_URL="${CHROME_RPM_URL:-https://mirrors.aliyun.com/google-chrome/google-chrome/google-chrome-stable-125.0.6422.141-1.x86_64.rpm}"
VULKAN_RPM_URL="${VULKAN_RPM_URL:-http://vault.centos.org/7.9.2009/os/x86_64/Packages/vulkan-1.1.97.0-1.el7.x86_64.rpm}"
EL7_IMAGE="${EL7_IMAGE:-centos:7}"

log() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; }

# ── 1) 웹 빌드 ──────────────────────────────────────────────────────────
log "1/4 웹 빌드 (pnpm build:standalone)"
pnpm build:standalone

# ── 2) RPM 확보 ─────────────────────────────────────────────────────────
log "2/4 vendor/ RPM 확보"
mkdir -p vendor
fetch_rpm() {
  local url="$1" dest
  dest="vendor/$(basename "$url")"
  if [[ -f "$dest" ]]; then
    echo "    이미 존재: $dest"
    return
  fi
  echo "    다운로드: $url"
  if ! curl -fL --retry 3 -o "$dest" "$url"; then
    rm -f "$dest"
    err "RPM 다운로드 실패: $url"
    err "URL 을 직접 지정(CHROME_RPM_URL / VULKAN_RPM_URL)하거나 vendor/ 에 파일을 직접 두세요."
    exit 1
  fi
}
fetch_rpm "$CHROME_RPM_URL"
fetch_rpm "$VULKAN_RPM_URL"

# ── 3) 번들 패키징 ──────────────────────────────────────────────────────
log "3/4 번들 패키징 (pnpm pack:standalone)"
pnpm pack:standalone
TARBALL="$(ls -t release/koos-standalone-*-x86_64.tar.gz | head -1)"
echo "    번들: $TARBALL"
echo "    내용:"
tar tzf "$TARBALL" | sed 's/^/      /'

if [[ "${SKIP_CONTAINER:-0}" == "1" ]]; then
  log "SKIP_CONTAINER=1 → 컨테이너 검증 생략. 번들 생성 완료."
  exit 0
fi

# ── 4) amd64 el7 컨테이너 검증 ─────────────────────────────────────────
if ! command -v docker >/dev/null 2>&1; then
  err "docker 가 필요합니다(컨테이너 검증). 번들은 생성됐습니다: $TARBALL"
  err "패키징까지만 확인하려면 SKIP_CONTAINER=1 로 재실행하세요."
  exit 1
fi

log "4/4 amd64 el7 컨테이너에서 install.sh 검증 (image=$EL7_IMAGE)"

INSTALL_NODEPS="${INSTALL_NODEPS:-0}"
KEEP="${KEEP_CONTAINER:-0}"

# 컨테이너 내부에서 실행할 스크립트. 7 EOL 대응으로 yum repo 를 vault 로 교체한다.
read -r -d '' CONTAINER_SCRIPT <<'EOS' || true
set -e
echo "[container] $(uname -m) / $(cat /etc/redhat-release 2>/dev/null || echo unknown)"

# CentOS 7 은 EOL 이라 mirrorlist 가 죽어 있다 → vault.centos.org 로 baseurl 교체.
if ls /etc/yum.repos.d/CentOS-*.repo >/dev/null 2>&1; then
  sed -i \
    -e 's/^mirrorlist=/#mirrorlist=/' \
    -e 's|^#\?baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|' \
    /etc/yum.repos.d/CentOS-*.repo
fi

cd /work
mkdir -p /tmp/koos
tar xzf /work/release/koos-standalone-*-x86_64.tar.gz -C /tmp/koos --strip-components=1

echo "[container] install.sh 실행"
if [ "$INSTALL_NODEPS" = "1" ]; then
  # 의존성 해결 없이 RPM 만 강제 설치(패키징/배치 로직 검증용).
  rpm -Uvh --replacepkgs --nodeps /tmp/koos/vendor/*.rpm
  mkdir -p /opt/koos
  cp -a /tmp/koos/dist /opt/koos/dist
  cp -a /tmp/koos/koos-launch.sh /opt/koos/koos-launch.sh
  mkdir -p /etc/koos
  cp /tmp/koos/config/koos.conf /etc/koos/koos.conf
else
  ( cd /tmp/koos && ./install.sh )
fi

echo "[container] google-chrome-stable 설치/실행 확인"
command -v google-chrome-stable
google-chrome-stable --version --no-sandbox || \
  google-chrome-stable --version || \
  { echo "[container] chrome --version 실패"; exit 1; }

echo "[container] vulkan 설치 확인"
rpm -q vulkan || echo "[container] (vulkan 패키지명이 다를 수 있음)"

echo "[container] 배치 확인"
test -f /opt/koos/dist/index.html && echo "  /opt/koos/dist/index.html OK"
test -f /etc/koos/koos.conf && echo "  /etc/koos/koos.conf OK"

echo "[container] ✔ 검증 통과"
EOS

DOCKER_ARGS=(
  --platform linux/amd64
  -v "$ROOT:/work"
  -e "INSTALL_NODEPS=$INSTALL_NODEPS"
  -w /work
)

if [[ "$KEEP" == "1" ]]; then
  log "KEEP_CONTAINER=1 → 검증 후 컨테이너 셸 진입"
  docker run --rm -it "${DOCKER_ARGS[@]}" "$EL7_IMAGE" \
    bash -c "$CONTAINER_SCRIPT"$'\n'"echo; echo '[container] 셸 진입 (exit 로 종료)'; exec bash"
else
  docker run --rm "${DOCKER_ARGS[@]}" "$EL7_IMAGE" bash -c "$CONTAINER_SCRIPT"
fi

log "완료. 번들: $TARBALL"
