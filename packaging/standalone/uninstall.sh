#!/usr/bin/env bash
# install.sh 로 설치한 RPM 을 제거한다. (KOOS 앱은 이 폴더에 있을 뿐 시스템엔 아무것도 안 깔았다 —
# 앱을 지우려면 이 폴더를 삭제하면 끝.)
#
# 사용:  sudo ./uninstall.sh
set -euo pipefail

[[ "$(id -u)" -eq 0 ]] || { echo "root 권한이 필요합니다:  sudo ./uninstall.sh" >&2; exit 1; }

echo "==> 동봉 RPM 제거 (의존성 역순)"
for pkg in \
  google-chrome-stable \
  vulkan \
  vulkan-filesystem \
  liberation-fonts \
  liberation-narrow-fonts; do
  rpm -e "$pkg" 2>/dev/null && echo "    제거: $pkg" || echo "    건너뜀(미설치/제거 실패): $pkg"
done

# 런처가 만든 chrome 프로필 정리.
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
rm -rf "$HERE/.chrome-profile"

echo "제거 완료. (앱 폴더는 직접 삭제하세요.)"
