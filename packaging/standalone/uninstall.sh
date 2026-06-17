#!/usr/bin/env bash
# KOOS standalone 제거 스크립트.
#
# 앱/런처/데스크톱 항목을 제거한다. 동봉 RPM(Chrome, Vulkan)과 /etc/koos 설정은
# 다른 용도로 쓰일 수 있어 기본적으로 남긴다.
#   --purge      /etc/koos 설정도 함께 제거
#   --rpm        google-chrome-stable, vulkan RPM 도 함께 제거
#
# 사용법:  sudo ./uninstall.sh [--purge] [--rpm]
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "root 권한이 필요합니다:  sudo ./uninstall.sh" >&2
  exit 1
fi

PREFIX="${KOOS_PREFIX:-/opt/koos}"
PURGE=0
RPM=0
for arg in "$@"; do
  case "$arg" in
    --purge) PURGE=1 ;;
    --rpm)   RPM=1 ;;
    *) echo "알 수 없는 옵션: $arg" >&2; exit 1 ;;
  esac
done

echo "==> 앱/런처/데스크톱 제거"
rm -rf "$PREFIX"
rm -f /usr/local/bin/koos
rm -f /usr/share/applications/koos.desktop

if [[ "$PURGE" -eq 1 ]]; then
  echo "==> 설정 제거: /etc/koos"
  rm -rf /etc/koos
else
  echo "    설정(/etc/koos)은 유지. 함께 지우려면 --purge."
fi

if [[ "$RPM" -eq 1 ]]; then
  echo "==> RPM 제거: google-chrome-stable, vulkan"
  rpm -e google-chrome-stable 2>/dev/null || echo "    google-chrome-stable 미설치 또는 제거 실패."
  rpm -e vulkan 2>/dev/null || echo "    vulkan 미설치 또는 제거 실패."
else
  echo "    Chrome/Vulkan RPM 은 유지. 함께 지우려면 --rpm."
fi

echo "제거 완료."
