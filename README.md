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

## 세부 아키텍처

### 상태 관리: 두 가지 zustand 패턴

- **Provider 스코프 인스턴스 스토어** (`createStore` + React context + `use*` 훅): `viewport`,
  `scenario`, `basemap`. 각 `*Provider`에서 한 번 생성되고 `useViewport(selector)` 식으로 읽으며,
  Provider 밖에서 쓰면 throw합니다. 상태를 서브트리에 한정하거나 props로 시드해야 할 때 사용합니다.
- **글로벌 싱글턴 스토어** (`create`): `layerStore`(레이어 토글, surge↔wave 모델 상호배타),
  `densityStore`(지역별 입자 수), `locationStore`(현재/대기 항구), `typhoonSidebarStore`. Provider
  없이 직접 import합니다.

Provider 중첩은 `ViewportProvider → LoadingStatusProvider → ScenarioProvider → BasemapProvider → <Map>`
순이며, `ScenarioProvider`는 카탈로그가 resolve될 때까지 `InitialLoadingScreen`을 띄우는 `Suspense`
안에 있습니다.

### deck.gl 오버레이 레지스트리

지도 전체에 단 하나의 `MapboxOverlay`(interleaved)만 존재하며 `DeckOverlayProvider`가 생성합니다.
레이어 컴포넌트는 deck 레이어를 직접 렌더링하지 않고 `Layer[]`를 만들어
`useRegisterLayerGroup(id, layers, zIndex)`로 등록합니다. Provider가 등록된 그룹들을 병합해 `zIndex`
순으로 정렬(낮을수록 아래)한 뒤 `overlay.setProps`를 호출합니다. 등록은 `id` 기준이고 언마운트 시
제거됩니다(StrictMode 중복 effect 흡수를 위해 `queueMicrotask`로 디바운스).

저수준 deck.gl 레이어를 추가하려면 `null`을 반환하는 컴포넌트를 만들어 `useMemo`로 `Layer[]`를
계산하고 `useRegisterLayerGroup`으로 등록한 뒤 `<DeckOverlayProvider>` 안에 마운트합니다.

### 레이어 레지스트리

렌더링 가능한 필드는 `features/layers/core/registry.ts`의 `MAP_LAYER_SPECS`에 **데이터 우선**으로
선언됩니다. 각 엔트리는 `type`(`coastline` | `contour` | `flow` | `wave`), `id`, `model`(`surge` |
`wave`), `zIndex`, 가시성, 라벨, `fetcher`를 갖습니다(`wave` spec은 파고용 `contourFetcher`와 파향용
`vectorFetcher`를 함께 가집니다). `MapLayers`가 각 spec을 얇은 컴포넌트(`CoastlineLayer` /
`ContourLayer` / `FlowLayer` / `WaveLayer`)에 매핑하고, `LAYER_DEFS`가 `LayerSelector` 토글 UI를
구동하며 `model`이 surge↔wave 상호배타를 강제합니다.

**새 contour/flow 필드 추가는 spec 엔트리 추가 + fetcher 작성으로 끝납니다.** `ContourLayer`/
`FlowLayer`는 fetcher에 대해 제네릭하므로 별도 배선 컴포넌트가 필요 없습니다(wave 같은 *복합* 필드만
`WaveLayer`류 컴포넌트가 필요합니다).

### Contour 타일 파이프라인 (핵심 데이터 흐름)

이 앱의 심장입니다. mesh 기반 스칼라 필드(자유수면, 수심)는 **fetcher 구동 다층 react-query 캐시**를
통해 흐르며, 타임스탬프를 스크럽할 때 최소한만 재계산하도록 설계되어 있습니다. 공유 타일 기계는
`features/tiles/`에 있고 contour·vector 파이프라인이 함께 재사용합니다.

1. fetcher는 공유 `TileSource` 베이스(URL/캐시키 빌더 + `valueKeys`)를 확장하고 렌더 전용 변환을
   더합니다: `ContourTileFetcher.toColors`(RGBA) 또는 `VectorTileFetcher.toVectors`.
2. `useContourSurface(fetcher)`(또는 `useVectorSurface`)가 viewport + scenario를 읽어 **두 개의 독립
   해상도 슬롯**으로 공유 훅을 조합합니다:
   - `useTilesInView(z)` — **base** 슬롯: `KOREA_ZOOM`(z=6)의 전국 가시 타일.
   - 고정 **detail** manifest(`portDetailTiles()`, z=11): 활성 위치가 항구일 때만 로드. base와 detail은
     겹치지 않으며 `mergeSurface`가 detail이 덮는 영역에서 base에 구멍을 뚫습니다(centroid가 항구
     bbox에 드는 삼각형 제외).
   - `useFetcherCtx()` — 현재 `{ typhoonId, scenarioId, timestamp, location }`를 패키징.
   - `useDerivedMeshTiles` — mesh 타일을 fetch·decode해 `{positions, conn, globalNodes}` 도출. 지오메트리는
     정적이므로 `meshKey + 'derived'`로 캐시되며 타임스탬프/시나리오와 무관합니다.
   - `useValueBufferTiles` — 현재 시나리오/타임스탬프의 values 타일을 fetch해 변환(`toColors`/
     `toVectors`)을 typed-array 버퍼로 실행. `valuesKey + tag`로 캐시.
3. `mergeSurface`가 타일별 typed array를 하나의 `SurfaceMesh`(`positions`/`colors`/`indices`)로
   concat합니다 — concat + 인덱스 remap(+ detail 영역 삼각형 선택적 제외), 정점별 재계산 없음.
4. `createContourLayer`가 각 surface를 커스텀 `ContourSurface` deck.gl 레이어로 감쌉니다. detail 그룹은
   `boundaryReady && detailLoaded`일 때만 렌더링됩니다.

**vector/flow** 파이프라인(`useVectorSurface` → `useFlowLines`)은 입자 trail을 렌더링합니다.
`useFlowLines`는 자체 `requestAnimationFrame` 루프를 돌며 mesh 삼각형 내부에서 `(u,v)` 필드를
barycentric 보간으로 샘플링하고, **React 리렌더 없이** 매 프레임 `FlowSegments`를 deck 레지스트리에
바로 push합니다. 입자 age/trail 상태는 타임스탬프 스크럽에도 유지되어(필드만 교체) 애니메이션이
연속적입니다. 입자 수는 `densityStore`로 전국/항구를 분리합니다.

캐시 전략(`queryClient.ts`)은 `staleTime: Infinity` + 긴 `gcTime`입니다. 타일은 URL-불변이므로 팬·
타임스탬프 변경 간 dedupe/재사용을 극대화합니다. `apiFetch`도 같은 이유로 `cache: 'force-cache'`가
기본입니다.

`ContourSurface`는 직접 작성한 GLSL을 가진 **커스텀 `@deck.gl/core` Layer**로, positions/colors/indices를
luma.gl `Model`에 바로 업로드하고 해당 배열 참조가 바뀔 때만 모델을 재구성합니다.

### 바이너리 타일 포맷

`src/lib/binaryTile.ts`가 `subset.py`의 `.bin` 스키마를 디코드합니다. 타일은 두 종류입니다:
**mesh 타일**(노드 좌표 + 삼각형 연결), **values 타일**(`LAYER_VALUE_KEYS`로 키잉된 노드별 스칼라).
파일은 little-endian이며 빅엔디언 호스트에서만 in-place로 바이트 스왑합니다. `LAYER_VALUE_KEYS`는
`subset.py`의 `DEFAULT_LAYERS`와 순서가 일치해야 합니다.

### 컬러 매핑

`src/lib/colorMap.ts`는 **OKLCH/OKLab**에서 지각적 색 보간을 수행합니다(sRGB↔linear↔OKLab 변환).
`buildColorLut(colorMap, min, max)`가 룩업 테이블을 미리 계산하고 `valuesToRgbaFloat32`가 값 배열을
통과시킵니다(`transparentValue`, 기본 `0`인 노드는 alpha-0). 고→저 색 방향을 뒤집으려면 `min`/`max`를
바꿉니다.

컬러맵은 `ColorScale`(`{ type: 'linear' }` 또는 `{ type: 'asinh'; scale }`)을 갖습니다. 램프는 항상
**균등** 샘플링되고, 값→위치 비선형성은 룩업 시 `normalizeValue`가 적용합니다. asinh는 낮은 값을 더
넓은 색 범위로 압축합니다(수심의 큰 동적 범위에 사용). `normalizeValue`는 export되어 colorbar 눈금
위치가 렌더된 mesh와 정확히 같은 매핑을 쓰게 합니다.

### 해안선·경계 마스킹 (육지 3단계 제거)

`CoastlineLayer`는 해안선을 두 번 렌더링합니다: 보이는 maplibre 네이티브 `line` 레이어, 그리고
`COASTLINE_MASK_ID`로 등록되는 보이지 않는 deck.gl 마스크 레이어. 다른 deck.gl 레이어는
`extensions: MASK_EXTENSIONS` + `maskId`/`maskInverted`로 여기에 클리핑됩니다(예: contour는 해안 안쪽에
렌더링).

항구 detail(z≥11)에서 육지는 **세 단계**로 제거되므로 필드가 육지로 번지면 셋 다 확인합니다:
(1) **mesh** — 바이너리 타일의 `boundaryNode` 배열이 육지 노드를 플래그, (2) **buffer** —
`maskBoundaryZeroAlpha`가 `toColors` 중 값이 0 이상인 육지 노드에 alpha-0 설정(epsilon 허용:
`>= -1e-6`), (3) **deck mask** — `useBoundaryMask`가 항구 경계 GeoJSON을 fetch해 detail surface가
클리핑할 deck 마스크 레이어를 등록. detail 그룹은 육지가 마스킹 안 된 채 깜빡이는 것을 피하려
`boundaryReady`를 기다립니다.

### 위치 / 항구 내비게이션

`locationStore`(글로벌)가 활성 지역을 보유합니다 — 전국(`korea`)과 각각 precompute된 bbox를 가진 몇몇
항구. `useSyncLocationFromViewport`가 viewport로부터 위치를 도출하고(z≥11 + 항구 bbox 내부 ⇒ 해당
항구), `pending`/`byClick`이 클릭 fly-to 동안 "이동 중…" 오버레이를 구동합니다. 위치는 fetcher ctx의
일부라 mesh·value 타일을 모두 re-key합니다.

### 시나리오 모델

`scenario` 상태는 `{ typhoonId, scenarioId, timestamp }`로, 한 번 fetch한 카탈로그(`fetchCatalog`,
`MapRoot`에서 promise로 suspend)에서 시드됩니다. 이 중 하나를 바꾸면 values 타일 쿼리가 re-key되어
지오메트리 재fetch 없이 contour surface가 다시 색칠됩니다. 두 타임스탬프 규약에 주의: 카탈로그
`first_time`/`last_time`은 KST bare 문자열, 스토어 `timestamp`는 `+09:00` 오프셋을 포함합니다.

### 로딩 상태

`loading/` feature가 `loadViewKey(location, timestamp)` → `layerId`로 키잉된 최초 로드 진행을
추적합니다. 레이어 훅은 해당 location+timestamp 타일이 도착하면 `markIsInitialLoaded`를 호출합니다
(idempotent, 렌더 중 호출이라 `queueMicrotask`로 지연). 별도의 `hasInitialLoaded` 플래그가 1회성 초기
UI를 게이팅합니다. `InitialLoadingScreen`은 카탈로그 suspense fallback이고, `LoadingOverlay`는 스크럽 중
타임스탬프별 레이어 진행과 항구 이동 오버레이를 보여줍니다.
