#!/usr/bin/env bash
# KOOS standalone 런처.
#
# 현재 Electron 앱(electron/main.ts)과 동일하게 정적 서버 없이 dist/index.html 을 file:// 로
# 직접 로드한다. Electron 이 session.onHeadersReceived 로 ACAO:* 를 주입해 처리하던 타일 서버
# cross-origin 문제는, plain Chrome 에서는 koos.conf 의 Chrome 플래그(--disable-web-security 등)로
# 대체한다.
#
# 설정은 /etc/koos/koos.conf → 번들 내 config/koos.conf 순으로 찾는다.
set -euo pipefail

SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 설치되면 /usr/local/bin/koos 래퍼가 KOOS_HOME=/opt/koos 를 주입한다.
APP_HOME="${KOOS_HOME:-$SELF_DIR}"

# 설정 로드: 설치본 우선, 없으면 번들 내 기본값.
CONF=""
for c in /etc/koos/koos.conf "$APP_HOME/config/koos.conf"; do
  if [[ -f "$c" ]]; then CONF="$c"; break; fi
done
if [[ -n "$CONF" ]]; then
  # shellcheck disable=SC1090
  source "$CONF"
fi

CHROME_BIN="${KOOS_CHROME_BIN:-google-chrome-stable}"
INDEX="${KOOS_INDEX:-$APP_HOME/dist/index.html}"
PROFILE_DIR="${KOOS_PROFILE_DIR:-$HOME/.config/koos/chrome-profile}"
CHROME_FLAGS="${KOOS_CHROME_FLAGS:---allow-file-access-from-files --disable-web-security --no-sandbox --ozone-platform=x11 --ignore-gpu-blocklist}"

if ! command -v "$CHROME_BIN" >/dev/null 2>&1; then
  echo "'$CHROME_BIN' 를 찾을 수 없습니다. install.sh 로 Chrome RPM 을 먼저 설치하세요." >&2
  exit 1
fi
if [[ ! -f "$INDEX" ]]; then
  echo "index.html 을 찾을 수 없습니다: $INDEX" >&2
  exit 1
fi

mkdir -p "$PROFILE_DIR"

# file:// URL 로 변환 (절대경로 보장).
INDEX_ABS="$(cd "$(dirname "$INDEX")" && pwd)/$(basename "$INDEX")"

# 단일 프로세스 포그라운드 실행. $CHROME_FLAGS 는 의도적으로 word-split 한다.
# shellcheck disable=SC2086
exec "$CHROME_BIN" \
  --app="file://$INDEX_ABS" \
  --user-data-dir="$PROFILE_DIR" \
  $CHROME_FLAGS \
  "$@"
