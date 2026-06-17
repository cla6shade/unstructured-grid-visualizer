#!/usr/bin/env bash
# KOOS 오프라인 standalone 번들 빌드 도구 — 단일 진입점.
#
# 보통 package.json 의 pnpm 스크립트로 호출한다:
#   pnpm standalone:build   →  build   웹 빌드 → dist/ (BUILD_TARGET=standalone, 상대경로 base)
#   pnpm standalone:fetch   →  fetch   Chrome/Vulkan RPM 을 vendor/ 로 다운로드 (이미 있으면 건너뜀)
#   pnpm standalone:pack    →  pack    dist + vendor + 템플릿 → release/koos-standalone-<ver>-x86_64.tar.gz
#   pnpm standalone:test    →  test    build+fetch+pack 후 amd64 el7 컨테이너에서 install.sh/chrome 검증
#   (내부용 all = build + fetch + pack)
#
# 환경변수:
#   CHROME_RPM_URL / VULKAN_RPM_URL   메인 RPM 다운로드 URL override
#   VAULT_BASE                        el7 의존성 RPM 의 CentOS vault 경로 override
#   EL7_IMAGE                         test 컨테이너 이미지 (기본 centos:7)
#   INSTALL_NODEPS=1                  test 시 의존성 무시하고 rpm -Uvh --nodeps
#   SKIP_CONTAINER=1                  test 시 컨테이너 단계 생략(번들 생성까지만)
#   KEEP_CONTAINER=1                  test 검증 후 컨테이너 셸 진입
#
# 참고: Chrome RPM 의 Google 서명 검증은 릴리스 CI(.github/workflows/standalone.yml)에서 수행한다.
#       packaging/standalone/ 의 install.sh 등은 번들에 담겨 타깃(el7)에서 실행되는 별개 스크립트다.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"

CHROME_RPM_URL="${CHROME_RPM_URL:-https://mirrors.aliyun.com/google-chrome/google-chrome/google-chrome-stable-125.0.6422.141-1.x86_64.rpm}"
VULKAN_RPM_URL="${VULKAN_RPM_URL:-http://vault.centos.org/7.9.2009/os/x86_64/Packages/vulkan-1.1.97.0-1.el7.x86_64.rpm}"

# google-chrome / vulkan 이 요구하는 el7 의존성 RPM. 오프라인 머신엔 repo 가 없으므로 함께 동봉한다.
# (서버 설치 로그에서 rhel-7-server-rpms 등 repo 로부터 받아오던 패키지들.)
VAULT_BASE="${VAULT_BASE:-http://vault.centos.org/7.9.2009/os/x86_64/Packages}"
DEP_RPMS=(
  "vulkan-filesystem-1.1.97.0-1.el7.noarch.rpm"      # vulkan 이 정확히 같은 버전 요구
  "liberation-fonts-1.07.2-16.el7.noarch.rpm"        # google-chrome 의존
  "liberation-narrow-fonts-1.07.2-16.el7.noarch.rpm" # liberation-fonts 의존
)

EL7_IMAGE="${EL7_IMAGE:-centos:7}"

log() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; }

cmd_build() {
  log "웹 빌드 (BUILD_TARGET=standalone)"
  BUILD_TARGET=standalone ./node_modules/.bin/tsc -b
  BUILD_TARGET=standalone ./node_modules/.bin/vite build
}

_fetch_one() {
  local url="$1" dest
  dest="vendor/$(basename "$url")"
  if [[ -f "$dest" ]]; then echo "이미 존재(건너뜀): $dest"; return; fi
  echo "다운로드: $url"
  if ! curl -fL --retry 3 -o "$dest" "$url"; then
    rm -f "$dest"
    err "다운로드 실패: $url — URL 을 직접 지정하거나 vendor/ 에 파일을 직접 두세요."
    exit 1
  fi
}

cmd_fetch() {
  log "vendor/ RPM 다운로드"
  mkdir -p vendor
  _fetch_one "$CHROME_RPM_URL"
  _fetch_one "$VULKAN_RPM_URL"
  local dep
  for dep in "${DEP_RPMS[@]}"; do
    _fetch_one "$VAULT_BASE/$dep"
  done
  ls -l vendor/*.rpm
}

cmd_pack() {
  [[ -f dist/index.html ]] || { err "dist/ 가 없습니다. 먼저 'standalone build'."; exit 1; }
  shopt -s nullglob; local rpms=(vendor/*.rpm); shopt -u nullglob
  [[ ${#rpms[@]} -gt 0 ]] || { err "vendor/*.rpm 이 없습니다. 먼저 'standalone fetch'."; exit 1; }

  local ver name stage tar
  ver="$(node -p "require('./package.json').version")"
  name="koos-standalone-$ver"
  stage="release/$name"
  log "패키징: $stage"
  rm -rf "$stage"; mkdir -p "$stage"
  cp -a dist "$stage/dist"
  cp -a vendor "$stage/vendor"
  # 전부 번들 루트에 평평하게 둔다 (koos.conf 도 여기서 바로 편집).
  cp packaging/standalone/koos.conf packaging/standalone/install.sh \
     packaging/standalone/uninstall.sh packaging/standalone/koos-launch.sh \
     packaging/standalone/README.txt "$stage/"
  chmod +x "$stage/install.sh" "$stage/uninstall.sh" "$stage/koos-launch.sh"

  tar="release/$name-x86_64.tar.gz"; rm -f "$tar"
  tar -C release -czf "$tar" "$name"
  log "✓ $tar"
}

cmd_all() { cmd_build; cmd_fetch; cmd_pack; }

cmd_test() {
  cmd_all
  local tarball
  tarball="$(ls -t release/koos-standalone-*-x86_64.tar.gz | head -1)"
  echo "    번들 내용:"; tar tzf "$tarball" | sed 's/^/      /'

  if [[ "${SKIP_CONTAINER:-0}" == "1" ]]; then
    log "SKIP_CONTAINER=1 → 컨테이너 검증 생략. 번들 생성 완료: $tarball"
    return 0
  fi
  if ! command -v docker >/dev/null 2>&1; then
    err "docker 가 필요합니다(컨테이너 검증). 번들은 생성됐습니다: $tarball"
    err "패키징까지만 확인하려면 SKIP_CONTAINER=1 로 재실행하세요."
    exit 1
  fi

  log "amd64 el7 컨테이너에서 install.sh 검증 (image=$EL7_IMAGE)"
  local nodeps="${INSTALL_NODEPS:-0}"

  # 컨테이너 내부 스크립트. CentOS 7 은 EOL 이라 yum repo 를 vault 로 교체한다.
  local container_script
  read -r -d '' container_script <<'EOS' || true
set -e
echo "[container] $(uname -m) / $(cat /etc/redhat-release 2>/dev/null || echo unknown)"
if ls /etc/yum.repos.d/CentOS-*.repo >/dev/null 2>&1; then
  sed -i \
    -e 's/^mirrorlist=/#mirrorlist=/' \
    -e 's|^#\?baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|' \
    /etc/yum.repos.d/CentOS-*.repo
fi
mkdir -p /tmp/koos
tar xzf /work/release/koos-standalone-*-x86_64.tar.gz -C /tmp/koos --strip-components=1
cd /tmp/koos
echo "[container] install.sh 실행 (RPM 설치)"
if [ "$INSTALL_NODEPS" = "1" ]; then
  rpm -Uvh --replacepkgs --nodeps vendor/*.rpm
else
  ./install.sh
fi
echo "[container] google-chrome-stable 설치/실행 확인"
command -v google-chrome-stable
google-chrome-stable --version || { echo "[container] chrome --version 실패"; exit 1; }
rpm -q vulkan || echo "[container] (vulkan 패키지명이 다를 수 있음)"
# 앱은 번들 폴더에서 바로 돈다 (시스템 배치 없음).
test -f /tmp/koos/dist/index.html && echo "  dist/index.html OK"
test -f /tmp/koos/koos.conf && echo "  koos.conf OK"
test -x /tmp/koos/koos-launch.sh && echo "  koos-launch.sh OK"
echo "[container] ✔ 검증 통과"
EOS

  local args=(--platform linux/amd64 -v "$ROOT:/work" -e "INSTALL_NODEPS=$nodeps" -w /work)
  if [[ "${KEEP_CONTAINER:-0}" == "1" ]]; then
    log "KEEP_CONTAINER=1 → 검증 후 컨테이너 셸 진입"
    docker run --rm -it "${args[@]}" "$EL7_IMAGE" \
      bash -c "$container_script"$'\n'"echo; echo '[container] 셸 진입 (exit 로 종료)'; exec bash"
  else
    docker run --rm "${args[@]}" "$EL7_IMAGE" bash -c "$container_script"
  fi
  log "완료. 번들: $tarball"
}

case "${1:-}" in
  build) cmd_build ;;
  fetch) cmd_fetch ;;
  pack)  cmd_pack ;;
  all)   cmd_all ;;
  test)  cmd_test ;;
  *) echo "usage: $(basename "$0") {build|fetch|pack|all|test}" >&2; exit 1 ;;
esac
