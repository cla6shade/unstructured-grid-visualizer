# Standalone 빌드 (Chrome RPM 번들, 오프라인 el7)

오프라인 RHEL/CentOS 7 (el7) x86_64 머신용 standalone 패키지를 만드는 방법이다. Electron 번들
Chromium 의 WebGL 셰이더 컴파일이 가상 GPU(SVGA3D) 환경에서 깨지는 문제 때문에, 검증된
**Google Chrome 125 + Vulkan 1.1.97 런타임**을 함께 동봉해 인터넷 없이 설치·실행한다.

기존 Electron 앱(`electron/main.ts`)과 동일하게 **정적 서버 없이** `dist/index.html` 을 Chrome 의
`--app` 모드로 `file://` 직접 로드한다.

## 산출물

`release/koos-standalone-<version>-x86_64.tar.gz`

```
koos-standalone-<version>/
├─ dist/                 웹 빌드 (BUILD_TARGET=electron, 상대경로 base)
├─ vendor/*.rpm          Chrome, Vulkan
├─ config/koos.conf      Chrome/GPU 플래그
├─ koos-launch.sh        chrome --app=file://.../index.html 런처
├─ install.sh / uninstall.sh
└─ README.txt
```

버전은 `package.json` 의 `version` 이 단일 소스다(AppImage 워크플로와 동일 규약).

## 빌드

```bash
pnpm build:standalone          # 웹 빌드 (dist/)
# vendor/ 에 RPM 2개 배치 (직접 두거나 test 스크립트가 다운로드)
pnpm pack:standalone           # release/*.tar.gz 생성
```

## 로컬 x86 검증 (권장)

GitHub Actions 없이 로컬에서 x86_64(el7) 설치까지 검증한다. Apple Silicon 에서는 Docker 가
`--platform linux/amd64`(qemu)로 el7 을 재현한다.

```bash
pnpm test:standalone
```

수행: 웹 빌드 → (vendor 비어 있으면) RPM 다운로드 → 번들 패키징 → amd64 `centos:7` 컨테이너에서
yum repo 를 vault 로 교체하고 `install.sh` 실행 → `google-chrome-stable --version` 확인.

환경변수:

| 변수 | 용도 |
| --- | --- |
| `CHROME_RPM_URL` / `VULKAN_RPM_URL` | RPM 다운로드 URL override |
| `EL7_IMAGE` | 컨테이너 이미지 (기본 `centos:7`) |
| `INSTALL_NODEPS=1` | 의존성 해결 없이 `rpm -Uvh --nodeps` (패키징/배치 로직만 검증) |
| `SKIP_CONTAINER=1` | 번들 생성까지만 |
| `KEEP_CONTAINER=1` | 검증 후 컨테이너 셸 진입 |

> 컨테이너에서 chrome 의존성(예: 신 glibc) 미충족으로 설치가 실패할 수 있다. 패키징/배치 로직만
> 빠르게 확인하려면 `INSTALL_NODEPS=1`, 번들 생성만 보려면 `SKIP_CONTAINER=1` 을 쓴다.

## CI

`.github/workflows/standalone.yml` (수동 `workflow_dispatch`). RPM URL 을 입력(기본값 제공)받아
`curl` 로 다운로드 → 번들 생성 → 아티팩트 업로드 + `v<version>` GitHub Release 에 첨부.

## Chrome RPM 신뢰 / 서명 검증

Google 의 `google-chrome-stable` RPM 은 Google 의 GPG 키(`Google Inc. (Linux Packages Signing
Authority)`)로 서명돼 있다.

**검증은 CI(`standalone.yml`)에서 단일 게이트로 수행한다** — 믿을 수 없는 미러에서 RPM 을
받아오는 바로 그 지점이다. CI 가 공개키를 `https://dl.google.com/linux/linux_signing_key.pub`
에서 `curl` 로 받아 `rpm --import` 한 뒤, RPM 서명을 검증(`rpm -K` → `signatures OK`)하고
실패하면 빌드를 중단한다. (공개키는 repo 에 커밋하지 않는다.) 검증을 통과한 RPM 만 번들에 들어가므로, CI 가 만들어 GitHub Release 로
배포하는 번들은 그 자체로 신뢰된 산출물이다(타깃 `install.sh` 는 재검증하지 않는다).

이 덕분에 RPM 을 **어느 미러에서 받았든**(속도 등 이유로 중국 미러를 거쳤더라도) 변조되지 않은
Google 정품 바이트임을 보장한다. 신뢰의 단위는 *미러*가 아니라 *Google 서명*이다. 따라서
"비중국 미러를 못 찾는" 문제는 본질이 아니며, 받은 파일의 서명만 통과하면 출처는 무관하다.

> 서명키는 마스터키(2016) + 연도별 서명 서브키를 모두 포함한다. Chrome 125(2024-05)는
> 2024-01-30 서브키로 서명돼 검증된다. CI 가 매 빌드마다 위 URL 에서 최신 키를 받으므로 키
> 회전에도 자동으로 따라간다.
>
> 주의: CI 를 거치지 않고 로컬 `pnpm pack:standalone` 으로 만든 번들은 서명 검증을 거치지
> 않는다. 그 경우 직접 `rpm -K` 로 확인하거나 CI 산출물을 사용한다.

## RPM 출처 / 주의

- 기본 URL: Chrome 은 `mirrors.aliyun.com/google-chrome/...`(125 구버전은 Google 공식
  채널에서 삭제돼 미러에서 받는다), Vulkan 은 `vault.centos.org`. Chrome 은 출처와 무관하게
  Google 서명으로 검증되므로(위 절 참고) 미러 신뢰 문제는 없다.
  **구버전 RPM 은 미러에서 사라질 수 있다.** `curl -fL` 가 실패하면 URL 을 직접 지정하거나
  RPM 파일을 `vendor/` 에 미리 두면 다운로드를 건너뛴다.
- vulkan RPM 이 추가 의존성(`vulkan-filesystem` 등)을 요구할 수 있다. 최소 설치 el7 에서
  `yum localinstall` 이 누락 의존성을 보고하면 해당 RPM 도 `vendor/` 에 동봉한다.

## 설정 (`koos.conf` / `/etc/koos/koos.conf`)

Chrome/GPU 플래그는 `KOOS_CHROME_FLAGS` 로 제어한다(앱 재빌드 불필요). 핵심 플래그:

| 플래그 | 역할 |
| --- | --- |
| `--allow-file-access-from-files` | `file://` 에서 ES module import/fetch 허용 (Electron 은 기본 허용) |
| `--disable-web-security` | 타일 서버 cross-origin 허용 (Electron 의 `ACAO:*` 주입과 동일 효과) |
| `--no-sandbox` `--ozone-platform=x11` `--ignore-gpu-blocklist` | `scripts/run-electron.sh` 의 검증된 GPU 플래그 |
| `--use-angle=vulkan --enable-features=Vulkan` | (선택) 동봉 Vulkan 백엔드 사용. 가상 GPU 에서 역효과 가능 → 기본 off |
