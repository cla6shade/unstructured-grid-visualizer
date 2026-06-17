# Standalone 빌드 (Chrome RPM 번들, 오프라인 el7)

오프라인 RHEL/CentOS 7 (el7) x86_64 머신용 standalone 패키지를 만드는 방법이다. 가상
GPU(SVGA3D) 환경에서 WebGL 셰이더 컴파일이 깨지는 문제 때문에, 검증된
**Google Chrome 125 + Vulkan 1.1.97 런타임**을 함께 동봉해 인터넷 없이 설치·실행한다.

**정적 서버 없이** `dist/index.html` 을 Chrome 의 `--app` 모드로 `file://` 직접 로드한다.

## 산출물

`release/koos-standalone-<version>-x86_64.tar.gz`

전부 번들 폴더 한 곳에 평평하게 들어있고, 거기서 그대로 실행한다(시스템에 설치하는 건 RPM 뿐):

```
koos-standalone-<version>/
├─ dist/                 웹 빌드 (BUILD_TARGET=standalone, 상대경로 base)
├─ vendor/*.rpm          Chrome, Vulkan, 의존성
├─ koos.conf             Chrome/GPU 플래그 (여기서 편집)
├─ koos-launch.sh        chrome --app=file://.../index.html 실행
├─ install.sh            RPM 설치만 (sudo)
├─ uninstall.sh          RPM 제거 (sudo)
└─ README.txt
```

설치/실행:

```bash
tar xzf koos-standalone-<version>-x86_64.tar.gz
cd koos-standalone-<version>
sudo ./install.sh        # Chrome/Vulkan RPM 설치 (--chrome-only 로 vulkan 제외 가능)
./koos-launch.sh         # 폴더 안에서 바로 실행
```

버전은 `package.json` 의 `version` 이 단일 소스다.

## 빌드

standalone 관련 작업은 전부 `scripts/standalone-bundle.sh` 한 스크립트에 모여 있고, pnpm 으로 호출한다:

```bash
pnpm standalone:build   # 웹 빌드 (dist/)
pnpm standalone:fetch   # Chrome/Vulkan RPM 을 vendor/ 로 다운로드 (이미 있으면 건너뜀)
pnpm standalone:pack    # release/*.tar.gz 생성
```

`fetch` 의 기본 URL/override 는 `scripts/standalone-bundle.sh` 참고 (`CHROME_RPM_URL`/`VULKAN_RPM_URL`).
RPM 을 직접 `vendor/` 에 둬도 된다.

## 로컬 x86 검증 (권장)

GitHub Actions 없이 로컬에서 x86_64(el7) 설치까지 검증한다. Apple Silicon 에서는 Docker 가
`--platform linux/amd64`(qemu)로 el7 을 재현한다.

```bash
pnpm standalone:test
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
> 주의: CI 를 거치지 않고 로컬 `pnpm standalone:pack` 으로 만든 번들은 서명 검증을 거치지
> 않는다. 그 경우 직접 `rpm -K` 로 확인하거나 CI 산출물을 사용한다.

## RPM 출처 / 주의

- 기본 URL: Chrome 은 `mirrors.aliyun.com/google-chrome/...`(125 구버전은 Google 공식
  채널에서 삭제돼 미러에서 받는다), Vulkan 은 `vault.centos.org`. Chrome 은 출처와 무관하게
  Google 서명으로 검증되므로(위 절 참고) 미러 신뢰 문제는 없다.
  **구버전 RPM 은 미러에서 사라질 수 있다.** `curl -fL` 가 실패하면 URL 을 직접 지정하거나
  RPM 파일을 `vendor/` 에 미리 두면 다운로드를 건너뛴다.
- google-chrome / vulkan 이 repo 로부터 끌어오던 el7 의존성(`vulkan-filesystem`,
  `liberation-fonts`, `liberation-narrow-fonts`)도 `vendor/` 에 함께 동봉한다 — `fetch` 가
  CentOS vault(`VAULT_BASE`)에서 자동 다운로드한다. 덕분에 repo 없는 오프라인 el7 에서도
  설치 시 네트워크를 타지 않는다.
- 그 외(`nss`, `libX*`, GTK 등)는 보통 데스크톱 el7 에 이미 있다. 최소 설치 환경에서
  `yum localinstall` 이 또 다른 누락 의존성을 보고하면 그 RPM 명을 `scripts/standalone-bundle.sh`
  의 `DEP_RPMS` 목록에 추가한다.

## 설정 (번들 폴더의 `koos.conf`)

번들 폴더 안 `koos.conf` 의 `KOOS_CHROME_FLAGS` 한 줄을 편집하고 `./koos-launch.sh` 를 다시
실행하면 반영된다(재빌드/재설치 불필요). 핵심 플래그:

| 플래그 | 역할 |
| --- | --- |
| `--allow-file-access-from-files` | `file://` 에서 ES module import/fetch 허용 |
| `--disable-web-security` | 타일 서버 cross-origin 허용 (응답에 CORS 헤더가 없어도) |
| `--test-type` | "지원되지 않는 플래그" 경고 인포바 숨김 |
| `--ozone-platform=x11` `--ignore-gpu-blocklist` | 가상 GPU(SVGA3D)/Wayland 환경용 GPU 플래그 |

창 크기는 `KOOS_WINDOW_SIZE`(기본 `1280x720`)로 조정한다 → `--window-size` 로 전달.
| `--use-angle=vulkan --enable-features=Vulkan` | (선택) 동봉 Vulkan 백엔드 사용. 가상 GPU 에서 역효과 가능 → 기본 off |
