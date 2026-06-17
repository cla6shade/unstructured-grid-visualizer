#!/usr/bin/env bash
# KOOS standalone 설치 스크립트 (오프라인 el7 대상).
#
#   - 동봉된 vendor/*.rpm (Chrome, Vulkan) 설치
#   - 앱(dist + 런처)을 /opt/koos 에 배치
#   - 설정을 /etc/koos/koos.conf 에 설치(기존 설정은 보존)
#   - /usr/local/bin/koos 실행 래퍼 + 데스크톱 항목 등록
#
# 사용법:  sudo ./install.sh
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "root 권한이 필요합니다:  sudo ./install.sh" >&2
  exit 1
fi

SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PREFIX="${KOOS_PREFIX:-/opt/koos}"

echo "==> 동봉 RPM 설치 (Chrome, Vulkan)"
shopt -s nullglob
RPMS=("$SELF_DIR"/vendor/*.rpm)
shopt -u nullglob
if [[ ${#RPMS[@]} -eq 0 ]]; then
  echo "vendor/*.rpm 이 없습니다. 번들이 손상됐을 수 있습니다." >&2
  exit 1
fi
# 참고: Chrome RPM 의 Google 서명 검증은 빌드 시 CI(standalone.yml)에서 수행한다.
# 이 번들의 RPM 은 CI 가 정품으로 검증한 바이트다.
# yum 이 있으면 localinstall(이미 설치된 의존성 활용), 없으면 rpm 직접.
if command -v yum >/dev/null 2>&1; then
  yum localinstall -y "${RPMS[@]}"
else
  rpm -Uvh --replacepkgs "${RPMS[@]}"
fi

echo "==> 앱 배치: $PREFIX"
mkdir -p "$PREFIX"
rm -rf "$PREFIX/dist"
cp -a "$SELF_DIR/dist" "$PREFIX/dist"
cp -a "$SELF_DIR/koos-launch.sh" "$PREFIX/koos-launch.sh"
chmod +x "$PREFIX/koos-launch.sh"

echo "==> 설정: /etc/koos/koos.conf"
mkdir -p /etc/koos
if [[ -f /etc/koos/koos.conf ]]; then
  cp "$SELF_DIR/config/koos.conf" /etc/koos/koos.conf.default
  echo "    기존 설정 유지. 새 기본값은 /etc/koos/koos.conf.default 로 저장."
else
  cp "$SELF_DIR/config/koos.conf" /etc/koos/koos.conf
fi

echo "==> 실행 래퍼: /usr/local/bin/koos"
cat > /usr/local/bin/koos <<EOF
#!/usr/bin/env bash
exec env KOOS_HOME="$PREFIX" "$PREFIX/koos-launch.sh" "\$@"
EOF
chmod +x /usr/local/bin/koos

echo "==> 데스크톱 항목: /usr/share/applications/koos.desktop"
install -Dm644 "$SELF_DIR/koos.desktop" /usr/share/applications/koos.desktop

echo ""
echo "설치 완료. 'koos' 명령 또는 애플리케이션 메뉴의 KOOS 로 실행하세요."
echo "Chrome/GPU 플래그 조정: /etc/koos/koos.conf"
