# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

KOOS front-end renewal: a maplibre + deck.gl web map that visualizes ocean/storm-surge simulation
data (free surface height, water depth, currents, waves) over Korea, driven by typhoon scenarios at
selectable timestamps. Data comes from a tile server as **binary mesh + values tiles** (`subset.py`
output), decoded client-side and rendered as colored triangle meshes and particle flow lines.

## Commands

```bash
pnpm dev              # vite dev server (HMR)
pnpm build            # tsc -b (typecheck) + vite build
pnpm lint             # eslint .
pnpm preview          # serve the production build
pnpm standalone:build # web build with BUILD_TARGET=standalone (relative base, for file:// loading)
pnpm standalone:fetch # download the vendored Chrome + Vulkan RPMs into vendor/
pnpm standalone:pack  # assemble the offline standalone bundle (release/*.tar.gz)
pnpm standalone:test  # local x86 verify of the bundle in a Docker amd64 el7 container
```

The app ships as a web build (deployed under `/koos`) and an **offline standalone bundle** for el7:
the web `dist/` packaged with a vendored Google Chrome + Vulkan RPM, launched via
`chrome --app=file://.../index.html`. `BUILD_TARGET=standalone` switches the vite base path from
`/koos` to `./` (relative) so it loads over `file://`. See `docs/standalone-build.md`.

There is no test runner configured. `pnpm build` is the typecheck gate — run it to verify changes
compile (strict TS: `noUnusedLocals`/`noUnusedParameters`/`verbatimModuleSyntax` are on).

`@/*` is aliased to `src/*` (vite + tsconfig). Use it for imports; prefer it over deep relative paths.

### Environment

The **tile/data server URL and API key are both entered by the user in the setup screen**
(`AuthBoundary` → `ApiKeyPage`), stored in `localStorage` under `koos-tile-server-url` and `x-api-key`,
and attached to every request via `apiFetch` and maplibre's `transformRequest`. The server URL is read
at use time via `getTileServerUrl()` (`src/lib/network/tileServer.ts`), not from a build-time env var —
so a standalone bundle works against any server without a rebuild. `.env` only holds
`VITE_VWORLD_API_KEY` (satellite basemap), which is **currently commented out** — only the default
basemap ships; the VWORLD/satellite path is preserved in comments for later restore.

## Architecture

### Feature folders

Code lives under `src/features/<feature>/` with a consistent internal shape:
`components/`, `hooks/`, `lib/`, `store/`, `constants/`, `types.ts`. `src/lib/` holds cross-feature
primitives (tile math, binary decode, color maps, network wrappers). Comments are in Korean — match
that when editing existing files.

The main features: `map/` (the maplibre shell + its sub-features: `viewport`, `scenario`, `basemap`,
`deck`, `loading`, `layerSelector`, `density`, `locationSelector`); `tiles/` (shared
tile-fetch/decode hooks); `contour/` and `vector/` (per-field merge + custom deck.gl layers); `mesh/`
(mesh-tile fetch); and `layers/`, which holds the declarative layer registry (`layers/core/`) plus one
folder per renderable field (`coastline`, `boundary`, `freeSurface`, `waterDepth`, `current`, `wave`),
each contributing a fetcher and scale constants.

### State: two store patterns (both zustand)

- **Provider-scoped instance stores** (`createStore` + React context + a `use*` hook): `viewport`,
  `scenario`, `basemap`. Created once in a `*Provider`, read via `useViewport(selector)` etc. The
  hook throws if used outside its provider. Use this when state must be scoped to a subtree or seeded
  with props.
- **Global singleton stores** (`create`): `layerStore` (layer visibility toggles, with surge↔wave
  model mutual-exclusion in `toggle`), `densityStore` (per-region particle counts), `locationStore`
  (current/pending port), `typhoonSidebarStore` (sidebar open state). Imported
  directly, no provider.

All stores use the `devtools` middleware. Provider nesting (see `MapRoot`):
`ViewportProvider → LoadingStatusProvider → ScenarioProvider → BasemapProvider → <Map>`. The
`ScenarioProvider` lives inside a `Suspense` that shows `InitialLoadingScreen` while the catalog
resolves.

### The deck.gl overlay registry

There is **one** `MapboxOverlay` (interleaved) for the whole map, created by `DeckOverlayProvider`.
Layer feature-components do **not** render deck layers directly — they build a `Layer[]` and call
`useRegisterLayerGroup(id, layers, zIndex)`. The provider merges all registered groups, sorts by
`zIndex` (lower = drawn first/below), and calls `overlay.setProps`. Registration is keyed by `id`;
unmount removes the group (debounced via `queueMicrotask` to absorb StrictMode double-effects).

To add a low-level deck.gl layer: write a component that returns `null`, computes its `Layer[]` with
`useMemo`, and registers them via `useRegisterLayerGroup`. Mount it inside `<DeckOverlayProvider>`.

### The layer registry

Renderable fields are declared **data-first** in `features/layers/core/registry.ts` as
`MAP_LAYER_SPECS` — one entry per layer with `type` (`coastline` | `contour` | `flow` | `wave`), `id`,
`model` (`surge` | `wave`), `zIndex`, visibility, label, and a `fetcher` (the `wave` spec carries both
a `contourFetcher` for wave height and a `vectorFetcher` for wave direction). `MapLayers` maps each
spec to a thin component (`CoastlineLayer` / `ContourLayer` / `FlowLayer` / `WaveLayer`) that runs the
surface hook and registers the deck group. `LAYER_DEFS` (derived from the selectable specs) drives the
`LayerSelector` toggle UI, where `model` enforces surge↔wave mutual exclusion.

**To add a new contour/flow field: add a spec entry + write its fetcher.** No new wiring component is
needed — `ContourLayer`/`FlowLayer` are generic over the fetcher. (A new *combined* field like wave
would need its own `WaveLayer`-style component.)

### The contour tile pipeline (core data flow)

This is the heart of the app. Mesh-based scalar fields (free surface, water depth) flow through a
**fetcher-driven, multi-layer react-query cache** designed so that scrubbing the timestamp recomputes
as little as possible. The shared tile machinery lives in `features/tiles/` and is reused by both
contour and vector pipelines:

1. A fetcher extends the shared `TileSource` base (`features/tiles/types.ts` — URL/cache-key builders
   + `valueKeys`) and adds a render-specific transform: `ContourTileFetcher.toColors` (RGBA) or
   `VectorTileFetcher.toVectors`. See `freeSurfaceFetcher.ts` / `currentFetcher.ts` for templates.
2. `useContourSurface(fetcher)` (or `useVectorSurface`) reads viewport + scenario and composes the
   shared hooks **for two independent resolution slots**:
   - `useTilesInView(z)` — the **base** slot: visible nationwide tiles at `KOREA_ZOOM` (z=6).
   - a fixed **detail** manifest (`portDetailTiles()`, z=11) loaded only when the active location is a
     port. Base and detail do **not** overlap — `mergeSurface` cuts holes in the base where detail
     covers (triangles whose centroid falls in the port bounds are excluded).
   - `useFetcherCtx()` — packages the current `{ typhoonId, scenarioId, timestamp, location }`.
   - `useDerivedMeshTiles` — fetches+decodes the mesh tile, derives `{positions, conn, globalNodes}`.
     Cached under `meshKey + 'derived'`, **independent of timestamp/scenario** (geometry is static).
   - `useValueBufferTiles` — fetches the values tile for the current scenario/timestamp and runs the
     transform (`toColors`/`toVectors`) into a typed-array buffer. Cached under `valuesKey + tag`.
3. `mergeSurface` concatenates the per-tile typed arrays into one `SurfaceMesh`
   (`positions`/`colors`/`indices`) — concat + index remap (+ optional exclusion of triangles in the
   detail bounds), no per-vertex recompute. The hook returns `{ base, detail, isLoaded, detailLoaded }`.
4. `createContourLayer` wraps each surface in the custom `ContourSurface` deck.gl layer; the detail
   group renders only once `boundaryReady && detailLoaded`. `isLoaded` (all tiles for the current
   viewport+timestamp arrived) is reported to the loading store.

The **vector/flow** pipeline (`useVectorSurface` → `useFlowLines`) is similar but renders particle
trails: `useFlowLines` runs its own `requestAnimationFrame` loop, samples the `(u,v)` field via
barycentric interpolation inside mesh triangles, and pushes `FlowSegments` straight into the deck
registry each frame **without a React re-render**. Particle age/trail state persists across timestamp
scrubs (only the field is swapped), so the animation stays continuous. Particle counts are split
nationwide-vs-port via `densityStore`. `WaveLayer` combines a contour channel (WH) and a vector
channel (THETAW direction icons), each gated on its own detail-ready flag since they can load at
different timestamps.

Cache strategy (`queryClient.ts`): `staleTime: Infinity`, long `gcTime` — tiles are URL-immutable, so
this maximizes dedupe/reuse across pans and timestamp changes. `apiFetch` defaults to
`cache: 'force-cache'` for the same reason.

`ContourSurface` (`features/contour/lib/ContourSurface.ts`) is a **custom `@deck.gl/core` Layer** with
hand-written GLSL — it uploads positions/colors/indices straight to a luma.gl `Model` and rebuilds the
model only when those array references change.

### Binary tile format

`src/lib/binaryTile.ts` decodes the `.bin` schema from `subset.py`. Two tile kinds: **mesh tiles**
(node coords + triangle connectivity) and **values tiles** (per-node scalar values keyed by
`LAYER_VALUE_KEYS`). Files are little-endian; the decoder byte-swaps in place only on big-endian hosts.
`LAYER_VALUE_KEYS` must stay in sync with `subset.py`'s `DEFAULT_LAYERS` — it defines the value-key
order used to slice the buffer.

### Color mapping

`src/lib/colorMap.ts` does perceptual color interpolation in **OKLCH/OKLab** (full sRGB↔linear↔OKLab
conversion). `buildColorLut(colorMap, min, max)` precomputes a lookup table; `valuesToRgbaFloat32`
maps a value array through it (nodes equal to `transparentValue`, default `0`, are left alpha-0). To
invert the high→low color direction, swap `min`/`max` (see `freeSurfaceFetcher`).

A color map carries a `ColorScale` (`{ type: 'linear' }` or `{ type: 'asinh'; scale }`). The ramp is
always sampled **uniformly**; the value→position nonlinearity is applied at lookup time by
`normalizeValue`, so asinh compresses low values across a wider color range (used by `depthColorMap`
for the large shallow-to-deep dynamic range). `normalizeValue` is exported so colorbar tick positions
(`features/layers/core/colorBar.ts` + `ColorBar`) use the exact same mapping as the rendered mesh.

### Coastline & boundary masking (land is removed at three levels)

`CoastlineLayer` renders the coastline twice: a visible maplibre native `line` layer, and an invisible
deck.gl mask layer registered under `COASTLINE_MASK_ID`. Other deck.gl layers clip themselves to it via
`extensions: MASK_EXTENSIONS` + `maskId`/`maskInverted` (e.g. contours render inside the coast).

For port detail (z≥11), land is removed at **three** levels, so check all three when a field bleeds
onto land: (1) **mesh** — the `boundaryNode` array in the binary tile flags land nodes; (2) **buffer**
— `maskBoundaryZeroAlpha` sets alpha-0 on land nodes whose value is ≥ 0 (epsilon-tolerant: `>= -1e-6`) during `toColors`; (3) **deck
mask** — `useBoundaryMask` (`features/layers/boundary/`) fetches the port boundary GeoJSON and registers
a deck mask layer that the detail surface clips against. The detail group waits for `boundaryReady`
before rendering to avoid a flash of unmasked land.

### Location / port navigation

`locationStore` (global) holds the active region — nationwide (`korea`) plus a handful of ports, each
with a precomputed bbox. `useSyncLocationFromViewport` derives the location from the viewport (z≥11 +
inside a port bbox ⇒ that port), and `pending`/`byClick` drive the "moving to …" overlay during a
click-initiated fly-to. Location is part of the fetcher ctx, so it re-keys both mesh and value tiles.

### Scenario model

`scenario` state is `{ typhoonId, scenarioId, timestamp }`, seeded from a catalog fetched once
(`fetchCatalog`, suspended via a promise in `MapRoot`). Changing any of these re-keys the values-tile
queries, which re-colors the contour surface without refetching geometry. Note the two timestamp
conventions documented in `scenario/types.ts`: catalog `first_time`/`last_time` are bare KST strings,
while store `timestamp` carries the `+09:00` offset.

### Loading status

The `loading/` feature tracks first-load progress keyed by `loadViewKey(location, timestamp)` →
`layerId`. Layer hooks call `markIsInitialLoaded(layerId, location, ts)` (via `useReportInitialLoad`)
once their tiles for that location+timestamp have arrived; the call is idempotent and deferred with
`queueMicrotask` because it fires during render. A separate `hasInitialLoaded` flag (set by
`markInitialLoaded`) gates the one-time initial UI. `InitialLoadingScreen` is the catalog-suspense
fallback; `LoadingOverlay` shows per-timestamp layer progress while scrubbing, and the "moving to a
port" overlay during location changes.
