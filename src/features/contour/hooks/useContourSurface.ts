import { useMemo } from 'react';
import { useViewport } from '@/features/map/viewport/hooks/useViewport';
import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import { getTileCoordsInBounds, type TileCoord } from '@/lib/tile';
import type { MeshValuesPair } from '@/features/mesh/types';
import { unifyMesh } from '@/features/mesh/lib/unifyMesh';
import { useMeshTiles } from '@/features/mesh/hooks/useMeshTiles';
import { EMPTY_SURFACE } from '../lib/emptySurface';
import { useValuesTiles } from './useValuesTiles';
import type { ContourTileFetcher, FetcherCtx, SurfaceMesh } from '../types';

/** contour 데이터는 z=6 타일로만 제공된다. zoom ≥ 6에서 z=6 타일을 그대로 표시. */
const CONTOUR_TILE_Z = 6;

function useTilesInView(): TileCoord[] {
  const zoom = useViewport((s) => s.zoom);
  const bounds = useViewport((s) => s.bounds);
  return useMemo(() => {
    if (zoom < CONTOUR_TILE_Z) return [];
    return getTileCoordsInBounds(CONTOUR_TILE_Z, bounds, { padding: 1 });
  }, [zoom, bounds]);
}

function useFetcherCtx(): FetcherCtx {
  const typhoonId = useScenario((s) => s.typhoonId);
  const scenarioId = useScenario((s) => s.scenarioId);
  const timestamp = useScenario((s) => s.timestamp);
  return useMemo(
    () => ({ typhoonId, scenarioId, timestamp }),
    [typhoonId, scenarioId, timestamp],
  );
}

/**
 * viewport(zoom/bounds)와 scenario(typhoon/scenario/timestamp)에 따라
 * contour 표면 메시를 받아온다. 캐시·dedupe는 react-query, 통합은 unifyMesh,
 * 색상 변환은 fetcher.toColors — 각 책임이 분리되어 있다.
 *
 * 반환된 SurfaceMesh는 그대로 ContourSurface(GPU)에 props로 올라간다.
 */
export function useContourSurface(fetcher: ContourTileFetcher): SurfaceMesh {
  const tiles = useTilesInView();
  const ctx = useFetcherCtx();

  const meshSource = useMemo(
    () => ({ url: fetcher.meshUrl, key: fetcher.meshKey }),
    [fetcher],
  );
  const meshes = useMeshTiles(tiles, meshSource);
  const values = useValuesTiles(tiles, fetcher, ctx);

  return useMemo(() => {
    const pairs: MeshValuesPair[] = [];
    for (let i = 0; i < tiles.length; i++) {
      const m = meshes[i];
      const v = values[i];
      if (!m || !v) continue;
      pairs.push({ mesh: m, values: v });
    }
    if (pairs.length === 0) return EMPTY_SURFACE;
    const unified = unifyMesh(pairs, fetcher.valueKeys);
    const colors = fetcher.toColors(unified.valuesByKey);
    return {
      positions: unified.positions,
      colors,
      indices: unified.indices,
    };
  }, [tiles, meshes, values, fetcher]);
}
