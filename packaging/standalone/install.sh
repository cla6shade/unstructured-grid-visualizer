#!/usr/bin/env bash
# 동봉 RPM(Chrome, Vulkan, 의존성) 설치만 한다. 이것만 시스템 레벨(root)이고,
# KOOS 앱은 이 폴더에서 그대로 실행한다 (설치 후  ./koos-launch.sh).
#
# 사용:  sudo ./install.sh [--chrome-only]
#   --chrome-only  Chrome(+폰트 의존성)만 설치하고 vulkan/vulkan-filesystem 은 건너뛴다.
set -euo pipefail

[[ "$(id -u)" -eq 0 ]] || { echo "root 권한이 필요합니다:  sudo ./install.sh" >&2; exit 1; }

CHROME_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --chrome-only) CHROME_ONLY=1 ;;
    *) echo "알 수 없는 옵션: $arg" >&2; exit 1 ;;
  esac
done

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

shopt -s nullglob
if [[ "$CHROME_ONLY" -eq 1 ]]; then
  echo "==> Chrome 만 설치 (--chrome-only): vulkan 제외"
  RPMS=("$HERE"/vendor/google-chrome*.rpm "$HERE"/vendor/liberation-*.rpm)
else
  echo "==> 동봉 RPM 설치 (Chrome, Vulkan, 의존성)"
  RPMS=("$HERE"/vendor/*.rpm)
fi
shopt -u nullglob
[[ ${#RPMS[@]} -gt 0 ]] || { echo "vendor/*.rpm 이 없습니다. 번들이 손상됐을 수 있습니다." >&2; exit 1; }

# Chrome RPM 의 Google 서명은 빌드 CI 에서 검증된다(이 번들의 RPM 은 정품).
if command -v yum >/dev/null 2>&1; then
  yum localinstall -y "${RPMS[@]}"
else
  rpm -Uvh --replacepkgs "${RPMS[@]}"
fi

# Chrome 자동 업데이트 차단 (버전 125 고정 보호 + 업데이트 알림 방지).
# chrome RPM 이 깔아두는 yum repo / 재등록 / 업데이트 cron 을 모두 끈다.
echo "==> Chrome 자동 업데이트 차단"
[[ -f /etc/yum.repos.d/google-chrome.repo ]] && sed -i 's/^enabled=1/enabled=0/' /etc/yum.repos.d/google-chrome.repo
mkdir -p /etc/default
printf 'repo_add_once=false\nrepo_reconfig=false\n' > /etc/default/google-chrome
rm -f /etc/cron.daily/google-chrome

# 더블클릭 실행용 바로가기를 이 폴더 안에 만든다(절대경로). 시스템 메뉴에 등록하는 게 아님.
echo "==> 더블클릭 실행용 바로가기: $HERE/KOOS.desktop"
cat > "$HERE/KOOS.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=KOOS
Exec=$HERE/koos-launch.sh
Path=$HERE
Terminal=false
EOF
chmod +x "$HERE/KOOS.desktop"
# 소유권을 원래 사용자에게 (sudo 로 실행되므로 root 가 되는 것 방지).
if [[ -n "${SUDO_UID:-}" ]]; then chown "$SUDO_UID:${SUDO_GID:-$SUDO_UID}" "$HERE/KOOS.desktop"; fi

echo ""
echo "설치 완료."
echo "  실행: KOOS.desktop 더블클릭  (또는  ./koos-launch.sh)"
echo "        ※ 처음엔 파일관리자에서 우클릭 → '실행 허용'이 필요할 수 있습니다."
echo "  플래그/해상도 조정: 이 폴더의 koos.conf 편집 후 다시 실행."
