#!/usr/bin/env bash
# KOOS Electron 앱(AppImage) 실행 스크립트.
#
# 이 환경(Wayland 세션 + VMware 가상 GPU)에 맞춘 플래그를 붙여 실행한다.
#   --no-sandbox          : AppImage의 chrome-sandbox가 SUID 설정이 안 돼 있어 필요
#   --ozone-platform=x11  : Wayland 백엔드가 세그폴트 나므로 X11(XWayland)로 강제
#   --ignore-gpu-blocklist: 가상 GPU(SVGA3D)가 blocklist에 걸려 소프트웨어 렌더링으로
#                           떨어지지 않도록 하드웨어 가속 강제
#
# 사용법:
#   scripts/run-electron.sh                 # release/ 의 AppImage 자동 탐색
#   scripts/run-electron.sh path/to.AppImage
set -euo pipefail

cd "$(dirname "$0")/.."

APP="${1:-}"
if [[ -z "$APP" ]]; then
  # release/ 에서 가장 최근 AppImage 선택
  APP="$(ls -t release/*.AppImage 2>/dev/null | head -1 || true)"
fi

if [[ -z "$APP" || ! -f "$APP" ]]; then
  echo "AppImage를 찾지 못했습니다. 먼저 'pnpm electron:dist'로 빌드하세요." >&2
  exit 1
fi

chmod +x "$APP"

exec "$APP" \
  --no-sandbox \
  --ozone-platform=x11 \
  --ignore-gpu-blocklist \
  "${@:2}"
