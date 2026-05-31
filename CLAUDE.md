# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

KOOS front-end renewal: a maplibre + deck.gl web map that visualizes ocean/storm-surge simulation
data (free surface height, water depth, currents, waves) over Korea, driven by typhoon scenarios at
selectable timestamps. Data comes from a tile server as **binary mesh + values tiles** (`subset.py`
output), decoded client-side and rendered as colored triangle meshes and particle flow lines.

## Commands

```bash
pnpm dev        # vite dev server (HMR)
pnpm build      # tsc -b (typecheck) + vite build
pnpm lint       # eslint .
pnpm preview    # serve the production build
```

There is no test runner configured. `pnpm build` is the typecheck gate — run it to verify changes
compile (strict TS: `noUnusedLocals`/`noUnusedParameters`/`verbatimModuleSyntax` are on).

`@/*` is aliased to `src/*` (vite + tsconfig). Use it for imports; prefer it over deep relative paths.

### Environment

`.env` holds `VITE_TILE_SERVER_URL` (data/tile backend) and `VITE_VWORLD_API_KEY` (basemap). The app
gates on an **API key the user pastes in** (`AuthBoundary`), stored in `localStorage` under
`x-api-key` and attached to every request via `apiFetch` and maplibre's `transformRequest`.

## Architecture

### Feature folders

Code lives under `src/features/<feature>/` with a consistent internal shape:
`components/`, `hooks/`, `lib/`, `store/`, `constants/`, `types.ts`. `src/lib/` holds cross-feature
primitives (tile math, binary decode, color maps, network wrappers). Comments are in Korean — match
that when editing existing files.

### State: two store patterns (both zustand)

- **Provider-scoped instance stores** (`createStore` + React context + a `use*` hook): `viewport`,
  `scenario`, `basemap`. Created once in a `*Provider`, read via `useViewport(selector)` etc. The
  hook throws if used outside its provider. Use this when state must be scoped to a subtree or seeded
  with props.
- **Global singleton stores** (`create`): `layerStore` (layer visibility toggles), `debugStatsStore`.
  Imported directly, no provider.

All stores use the `devtools` middleware. Provider nesting (see `MapRoot`):
`ViewportProvider → ScenarioProvider → BasemapProvider → <Map>`.

### The deck.gl overlay registry

There is **one** `MapboxOverlay` (interleaved) for the whole map, created by `DeckOverlayProvider`.
Layer feature-components do **not** render deck layers directly — they build a `Layer[]` and call
`useRegisterLayerGroup(id, layers, zIndex)`. The provider merges all registered groups, sorts by
`zIndex` (lower = drawn first/below), and calls `overlay.setProps`. Registration is keyed by `id`;
unmount removes the group (debounced via `queueMicrotask` to absorb StrictMode double-effects).

To add a deck.gl layer: write a component that returns `null`, computes its `Layer[]` with `useMemo`,
and registers them. Mount it inside `<DeckOverlayProvider>` in `MapRoot`.

### The contour tile pipeline (core data flow)

This is the heart of the app. Mesh-based scalar fields (free surface, water depth) flow through a
**fetcher-driven, multi-layer react-query cache** designed so that scrubbing the timestamp recomputes
as little as possible:

1. A layer defines a `ContourTileFetcher` (`features/contour/types.ts`) — URL builders, cache-key
   builders, value-key list, and a `toColors` function. See `freeSurfaceFetcher.ts` for the template.
2. `useContourSurface(fetcher)` reads viewport + scenario, computes the visible z=6 tiles
   (`getTileCoordsInBounds`), then composes:
   - `useDerivedMeshTiles` — fetches+decodes the mesh tile, derives `{positions, conn, globalNodes}`.
     Cached under `meshKey + 'derived'`, **independent of timestamp/scenario** (geometry is static).
   - `useColoredTiles` — fetches the values tile for the current scenario/timestamp, runs `toColors`
     into an RGBA buffer. Cached under `valuesKey + 'colors'`.
3. `mergeSurface` concatenates the per-tile typed arrays into one `SurfaceMesh`
   (`positions`/`colors`/`indices`) — concat + index remap only, no per-vertex recompute.
4. `createContourLayer` wraps it in the custom `ContourSurface` deck.gl layer.

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
maps a value array through it. To invert the high→low color direction, swap `min`/`max` (see
`freeSurfaceFetcher`).

### Coastline masking

`CoastlineLayer` renders the coastline twice: a visible maplibre native `line` layer, and an invisible
deck.gl mask layer registered under `COASTLINE_MASK_ID`. Other deck.gl layers clip themselves to it via
`extensions: MASK_EXTENSIONS` + `maskId`/`maskInverted` (e.g. contours render inside the coast).

### Scenario model

`scenario` state is `{ typhoonId, scenarioId, timestamp }`, seeded from a catalog fetched once
(`fetchCatalog`, suspended via a promise in `MapRoot`). Changing any of these re-keys the values-tile
queries, which re-colors the contour surface without refetching geometry. Note the two timestamp
conventions documented in `scenario/types.ts`: catalog `first_time`/`last_time` are bare KST strings,
while store `timestamp` carries the `+09:00` offset.
