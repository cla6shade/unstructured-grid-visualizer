KOOS standalone 번들 (오프라인 el7 / x86_64)
============================================

이 번들은 KOOS 웹 앱을, 검증된 Google Chrome + Vulkan 런타임과 함께 묶어 인터넷 없이
RHEL/CentOS 7 (el7) x86_64 머신에 설치·실행하기 위한 패키지입니다. 앱은 정적 서버 없이
Chrome 의 --app 모드로 dist/index.html 을 file:// 로 직접 로드합니다(기존 Electron 앱과 동일).

구성
----
  dist/                 웹 빌드 (상대경로 base)
  vendor/               동봉 RPM
    google-chrome-stable-*.x86_64.rpm
    vulkan-*.el7.x86_64.rpm
  config/koos.conf      Chrome/GPU 플래그 (설치 시 /etc/koos/koos.conf 로 복사)
  koos-launch.sh        실행 런처
  install.sh            설치
  uninstall.sh          제거

설치
----
  sudo ./install.sh

  - vendor/*.rpm 설치 (yum 있으면 localinstall, 없으면 rpm -Uvh)
  - 앱을 /opt/koos 에 배치
  - 설정을 /etc/koos/koos.conf 로 설치 (기존 설정은 보존, 새 기본값은 .default 로)
  - /usr/local/bin/koos 실행 래퍼 + 애플리케이션 메뉴 항목(KOOS) 등록

Chrome RPM 신뢰
---------------
이 번들의 Chrome RPM 은 빌드(CI) 시 Google 의 GPG 서명으로 검증된 정품 바이트입니다. RPM 을
어느 미러에서 받았든(중국 미러를 거쳤더라도) 변조되지 않았음이 CI 단계에서 보장됩니다 —
신뢰의 단위는 '미러'가 아니라 'Google 서명'입니다.

실행
----
  koos
  (또는 데스크톱 메뉴의 KOOS)

설정 / 트러블슈팅
-----------------
Chrome/GPU 플래그는 /etc/koos/koos.conf 의 KOOS_CHROME_FLAGS 로 조정합니다(앱 재빌드 불필요).

  - 지도가 안 뜨거나 콘솔에 file:// CORS / module 로드 오류:
      --allow-file-access-from-files 플래그가 있는지 확인.
  - 타일이 안 불러와짐(타일 서버 CORS 차단):
      --disable-web-security 플래그 확인. (Electron 의 ACAO:* 주입과 동일 역할)
  - 화면이 깨지거나 SW 렌더로 떨어짐(가상 GPU):
      --ignore-gpu-blocklist 확인. Vulkan 백엔드를 시도하려면 koos.conf 주석의
      --use-angle=vulkan --enable-features=Vulkan 을 KOOS_CHROME_FLAGS 끝에 추가.
  - Wayland 세션에서 크래시:
      --ozone-platform=x11 확인.

의존성 참고
-----------
google-chrome-stable / vulkan RPM 이 추가 시스템 패키지(예: vulkan-filesystem, nss, libX*)를
요구할 수 있습니다. 데스크톱 el7 에는 대부분 이미 설치돼 있으나, 최소 설치 환경에서
yum localinstall 이 누락 의존성을 보고하면 해당 RPM 도 vendor/ 에 함께 동봉해 재설치하세요.

제거
----
  sudo ./uninstall.sh            # 앱만 제거 (RPM/설정 유지)
  sudo ./uninstall.sh --purge    # /etc/koos 설정도 제거
  sudo ./uninstall.sh --rpm      # Chrome/Vulkan RPM 도 제거
