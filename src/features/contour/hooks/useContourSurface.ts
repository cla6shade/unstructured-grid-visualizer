import { useMemo } from 'react';
import { useViewport } from '@/features/map/viewport/hooks/useViewport';
import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import { getTileCoordsInBounds, type TileCoord } from '@/lib/tile';
import { EMPTY_SURFACE } from '../lib/emptySurface';
import { mergeSurface, type DerivedTile } from '../lib/mergeSurface';
import { useDerivedMeshTiles } from './useDerivedMeshTiles';
import { useColoredTiles } from './useColoredTiles';
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
 * contour 표면 메시를 받아온다. 타일별 파생물(mesh positions+conn, colors)은
 * react-query 캐시에 분리 저장되어:
 * - timestamp 변경 시 connectivity·positions는 재사용, 새 colors만 계산
 * - pan으로 tile-set만 바뀔 때 변하지 않은 타일의 파생물은 그대로 재사용
 *
 * mergeSurface는 캐시된 typed array들을 concat·remap만 수행.
 */
export function useContourSurface(fetcher: ContourTileFetcher): SurfaceMesh {
  const tiles = useTilesInView();
  const ctx = useFetcherCtx();

  const derived = useDerivedMeshTiles(tiles, fetcher);
  const colors = useColoredTiles(tiles, fetcher, ctx);

  return useMemo(() => {
    const pairs: DerivedTile[] = [];
    for (let i = 0; i < tiles.length; i++) {
      const m = derived[i];
      const c = colors[i];
      if (!m || !c) continue;
      pairs.push({ mesh: m, colors: c });
    }
    if (pairs.length === 0) return EMPTY_SURFACE;
    return mergeSurface(pairs);
  }, [tiles, derived, colors]);
}
