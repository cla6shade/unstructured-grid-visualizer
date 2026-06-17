#!/usr/bin/env bash
# KOOS 실행. 번들 폴더 안에서 그대로 돌린다:  ./koos-launch.sh
#
# 설정은 같은 폴더의 koos.conf 를 편집한다. dist/index.html 을 chrome --app 으로 file:// 로드.
# 시스템에 설치되는 건 chrome/vulkan RPM 뿐(sudo ./install.sh). 나머지는 전부 이 폴더 안.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 같은 폴더의 koos.conf 로드 (있으면).
[[ -f "$HERE/koos.conf" ]] && source "$HERE/koos.conf"

CHROME_BIN="${KOOS_CHROME_BIN:-google-chrome-stable}"
INDEX="$HERE/dist/index.html"
PROFILE_DIR="${KOOS_PROFILE_DIR:-$HERE/.chrome-profile}"
CHROME_FLAGS="${KOOS_CHROME_FLAGS:---allow-file-access-from-files --disable-web-security --test-type --disable-background-networking --check-for-update-interval=31536000 --ozone-platform=x11 --ignore-gpu-blocklist}"
WINDOW_SIZE="${KOOS_WINDOW_SIZE:-1280x720}"

command -v "$CHROME_BIN" >/dev/null 2>&1 || {
  echo "'$CHROME_BIN' 가 없습니다. 먼저  sudo ./install.sh  로 Chrome RPM 을 설치하세요." >&2
  exit 1
}
[[ -f "$INDEX" ]] || { echo "dist/index.html 이 없습니다: $INDEX" >&2; exit 1; }

mkdir -p "$PROFILE_DIR"
echo "[koos] flags: $CHROME_FLAGS" >&2

# shellcheck disable=SC2086
exec "$CHROME_BIN" \
  --app="file://$INDEX" \
  --user-data-dir="$PROFILE_DIR" \
  --window-size="${WINDOW_SIZE/x/,}" \
  $CHROME_FLAGS \
  "$@"
