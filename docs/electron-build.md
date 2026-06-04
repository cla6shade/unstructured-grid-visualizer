# Electron 데스크톱 빌드 기록

KOOS 웹 앱(vite + React)을 Electron 데스크톱 앱으로 패키징하는 방법과, 실제로 어떻게
빌드했는지에 대한 기록.

## 구성 요소

| 파일 | 역할 |
| --- | --- |
| `electron/main.ts` | Electron 메인 프로세스. 창 생성(1920x1080), prod에서 `dist/index.html`을 `file://`로 로드, 외부 데이터 백엔드용 CORS 헤더 보강 |
| `electron/preload.ts` | contextIsolation 유지한 최소 브릿지(`window.koosDesktop`) |
| `electron/tsconfig.json` | main/preload를 CommonJS로 컴파일(`dist-electron/`) |
| `scripts/build-electron-main.mjs` | main/preload 컴파일 + `dist-electron/package.json`(`type: commonjs`) 생성 |
| `scripts/dev-electron.mjs` | 개발용: vite dev 서버 + Electron 동시 기동(HMR) |
| `scripts/run-electron.sh` | 빌드된 AppImage 실행 스크립트(환경별 플래그 포함) |
| `package.json` `build` | electron-builder 설정(AppImage/nsis/dmg) |

## npm 스크립트

```bash
pnpm electron:dev     # 개발 실행 (vite dev + electron, HMR)
pnpm electron:build   # 렌더러(dist/) + main(dist-electron/) 빌드만
pnpm electron:dist    # 위 + electron-builder로 설치형 바이너리 패키징
pnpm electron:dir     # 위 + 압축 해제(unpacked) 디렉터리만 (배포 패키지 X)
```

### 빌드 시 `base` 분기

`vite.config.ts`는 `BUILD_TARGET` 환경변수로 `base`를 분기한다.

- 웹 배포: `base: '/koos'` (nginx `location /koos/`와 매칭)
- Electron: `base: './'` — `file://`에서 로드하므로 상대 경로 필요

`electron:build` 스크립트가 `BUILD_TARGET=electron`을 세팅하므로 별도 조작 불필요.

## 산출물

```
dist/                         # 렌더러 빌드 (상대경로 base './')
dist-electron/                # 컴파일된 main.js / preload.js (CommonJS)
release/KOOS-<ver>.AppImage   # 최종 리눅스 바이너리 (~151MB)
release/linux-unpacked/       # 압축 해제된 앱
```

## 실제 빌드 절차 (이번에 한 것)

1. 스캐폴딩(`electron/`, `scripts/`)은 있었으나 `package.json`에 연결돼 있지 않았다.
   `main` 필드, electron 스크립트, electron-builder `build` 설정, `electron` +
   `electron-builder` devDependency를 추가했다.
2. `vite.config.ts`의 `base`를 `BUILD_TARGET` 기준으로 분기하도록 수정.
3. `pnpm install`로 의존성 설치 → `pnpm electron:dist`로 AppImage 생성.

### 네트워크 우회 (이 환경 한정)

이 빌드 환경은 **AAAA(IPv6) DNS 질의가 타임아웃**되어 `pnpm install` /
electron 바이너리 다운로드(github)가 실패했다. Node의 `dns.lookup`을 IPv4로
강제하는 preload로 우회했다:

```js
// /tmp/dns4.cjs
const dns = require('dns')
const orig = dns.lookup
dns.lookup = (host, opts, cb) => {
  if (typeof opts === 'function') { cb = opts; opts = {} }
  return orig.call(dns, host, { ...opts, family: 4 }, cb)
}
```

```bash
NODE_OPTIONS="--require /tmp/dns4.cjs" GODEBUG=netdns=go pnpm install
NODE_OPTIONS="--require /tmp/dns4.cjs" GODEBUG=netdns=go pnpm electron:dist
```

> 일반적인 네트워크 환경에서는 `pnpm install` → `pnpm electron:dist`만으로 충분하다.

## 실행

```bash
scripts/run-electron.sh
```

### 이 환경(Wayland + 가상 GPU)에서 필요한 플래그

| 플래그 | 이유 |
| --- | --- |
| `--no-sandbox` | AppImage chrome-sandbox SUID 미설정 대응 |
| `--ozone-platform=x11` | Wayland 백엔드 세그폴트 회피 → X11(XWayland) 사용 |
| `--ignore-gpu-blocklist` | 가상 GPU(SVGA3D)를 막지 않고 하드웨어 가속 사용 |

일반 데스크톱(X11 세션 + 실 GPU)에서는 보통 플래그 없이도 실행된다.
