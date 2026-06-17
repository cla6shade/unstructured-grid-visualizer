KOOS standalone (오프라인 el7 / x86_64)
=======================================

압축을 풀면 이 폴더 하나에 전부 들어있습니다. 시스템 여기저기에 안 흩뿌립니다 —
설치되는 건 Chrome/Vulkan RPM 뿐이고(rpm 특성상 불가피), KOOS 앱은 이 폴더에서 그대로 돕니다.

쓰는 법
-------
  tar xzf koos-standalone-<버전>-x86_64.tar.gz
  cd koos-standalone-<버전>
  sudo ./install.sh        # Chrome/Vulkan RPM 설치 (이것만 root/시스템 레벨)
  ./koos-launch.sh         # 여기서 바로 실행

  # Chrome 만 설치 (vulkan 빼고):  sudo ./install.sh --chrome-only

설정
----
이 폴더의 koos.conf 의 KOOS_CHROME_FLAGS 한 줄을 편집하고 ./koos-launch.sh 다시 실행.
(vulkan 쓰려면 끝에  --use-angle=vulkan --enable-features=Vulkan  추가)

구성
----
  dist/            웹 앱
  vendor/*.rpm     Chrome, Vulkan, 의존성(vulkan-filesystem, liberation-fonts/narrow)
  koos.conf        실행 플래그 (여기서 편집)
  koos-launch.sh   실행
  install.sh       RPM 설치 (sudo)
  uninstall.sh     RPM 제거 (sudo). 앱은 이 폴더 지우면 끝.

제거
----
  sudo ./uninstall.sh      # 설치한 RPM 제거
  rm -rf <이 폴더>          # 앱 제거

문제 해결
---------
지도/타일이 안 뜨면 koos.conf 의 --allow-file-access-from-files / --disable-web-security 확인.
("지원되지 않는 플래그" 경고 바는 --test-type 으로 숨김.)
화면이 깨지면 --ignore-gpu-blocklist 확인, Wayland 크래시면 --ozone-platform=x11 확인.
chrome 의존성(nss, libX* 등)이 최소설치 환경에서 빠졌다고 나오면 그 RPM 도 vendor/ 에 넣으세요.
