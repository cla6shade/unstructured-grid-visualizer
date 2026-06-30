# KOOS Front Renew

태풍 시나리오 기반 해양 수치모델 산출물을 웹 지도 위에 **interactive하게** 시각화하는
프론트엔드입니다. maplibre-gl + deck.gl(vis.gl) 기반으로, 우리나라 해역의 자유수면고,
수심(침수영역), 해류, 파랑을 시간대별로 조회할 수 있습니다.

해군·한국해양과학기술원과 연계한 프로젝트의 프론트엔드 파트로, 폐쇄망(오프라인 el7) 환경에서의
구동을 전제로 합니다.

## 무엇을 하는가

- **데이터**: TELEMAC 수치모델이 산출한 `.slf`(2D 시계열) 자료. 약 24만 개 노드의 비정형 격자에
  시간 인덱스별 물리량이 담겨 있고, 파일 하나가 5~12GB에 달합니다.
- **문제**: 이 자료를 파이썬(xarray-selafin)으로 열면 헤더 파싱에만 수십 초, 전 영역
  렌더링에 또 십수 초가 걸립니다.
- **접근**: 정적인 격자 지오메트리(mesh)와 시계열 값(values)을 분리하고, 위경도 기준으로 미리
  **타일링(Slippy Map)** 해 둡니다. 클라이언트는 현재 화면에 필요한 타일만 받아 GPU에 직접
  올려 그립니다.

전체 파이프라인은 `수치모델 산출 → 자료 서브세팅 → 파이썬(FastAPI) 타일 서빙 → 클라이언트 시각화`
순서이며, 이 저장소는 마지막 **클라이언트 시각화** 단계를 담당합니다.

> 비정형 격자를 정형 격자로 변환하지 않고, deck.gl의 커스텀 레이어를 통해 삼각 격자(triangle
> mesh)를 WebGL로 직접 렌더링합니다. 변환에 따른 오버헤드와 정밀도 손실 없이 원본 격자를
> 그대로 그리는 것이 이 프로젝트의 핵심입니다.

## 기술 스택

- **시각화**: maplibre-gl(지도), deck.gl / luma.gl(GPU 렌더링 커스텀 레이어)
- **앱**: React 19, TypeScript, Vite, Tailwind CSS
- **상태/데이터**: zustand(스토어), @tanstack/react-query(타일 캐시)
- **백엔드(별도 저장소)**: Python, FastAPI — `.slf` 파싱·서브세팅 및 바이너리 타일 서빙

## 시작하기

```bash
pnpm install
pnpm dev          # vite 개발 서버 (HMR)
pnpm build        # tsc -b (타입체크) + vite 빌드
pnpm lint         # eslint
pnpm preview      # 프로덕션 빌드 미리보기
```

테스트 러너는 없으며, `pnpm build`(strict TS)가 타입체크 게이트입니다.

### 타일 서버 설정

타일/데이터 서버 URL과 API 키는 **빌드 시점 env가 아니라 실행 중 설정 화면에서 입력**합니다
(`AuthBoundary` → `ApiKeyPage`). `localStorage`(`koos-tile-server-url`, `x-api-key`)에 저장되어
모든 요청에 붙으므로, 같은 standalone 번들을 재빌드 없이 임의의 서버에 연결할 수 있습니다.

`.env`에는 위성 basemap용 `VITE_VWORLD_API_KEY`만 있으며 현재는 주석 처리되어
기본 basemap만 탑재됩니다.

## 빌드 타깃

| 타깃 | 용도 | base 경로 |
| --- | --- | --- |
| 웹 (기본) | `/koos` 하위 경로로 배포 (nginx) | `/koos` |
| standalone | 오프라인 el7에서 `chrome --app=file://`로 직접 로드 | `./` (상대) |

`BUILD_TARGET=standalone`이 vite base 경로를 상대 경로로 전환합니다. 오프라인 standalone 번들
(Chrome + Vulkan RPM 동봉)을 만드는 방법은 [docs/standalone-build.md](docs/standalone-build.md)를
참고하세요.

```bash
pnpm standalone:build   # 웹 빌드 (dist/)
pnpm standalone:fetch   # Chrome/Vulkan RPM 다운로드 → vendor/
pnpm standalone:pack    # release/*.tar.gz 번들 생성
pnpm standalone:test    # amd64 el7 컨테이너에서 설치 검증
```

## 구조

코드는 `src/features/<feature>/` 아래에 `components/` · `hooks/` · `lib/` · `store/` ·
`constants/` · `types.ts`의 일관된 형태로 배치됩니다. `src/lib/`에는 타일 수학·바이너리 디코드·
컬러맵·네트워크 래퍼 등 기능 횡단 프리미티브가 있습니다. 주석은 한국어로 작성합니다.

주요 feature:

- `map/` — maplibre 셸과 하위 기능: `viewport`, `scenario`, `basemap`, `deck`, `loading`,
  `layerSelector`, `density`, `locationSelector`, `subset`
- `layers/` — 렌더링 필드별 폴더(`coastline`, `boundary`, `freeSurface`, `waterDepth`,
  `current`, `wave`) + 선언적 레이어 레지스트리(`layers/core`)
- `tiles/` — 공유 타일 fetch/decode 훅
- `contour/` · `vector/` — 필드별 머지 로직과 deck.gl 커스텀 레이어
- `auth/` — 서버 URL/API 키 입력 화면
- `timeseries/` — 특정 지점의 시계열 차트

세부 아키텍처(타일 파이프라인, deck 오버레이 레지스트리, 컬러 매핑, 바이너리 타일 포맷,
육지 마스킹 등)는 [CLAUDE.md](CLAUDE.md)에 정리되어 있습니다.
