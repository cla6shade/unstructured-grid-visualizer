import { useMemo } from 'react';
import { useViewport } from '@/features/map/viewport/hooks/useViewport';
import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import { getTileCoordsInBounds, type TileCoord } from '@/lib/tile';
import { useDerivedMeshTiles } from '@/features/contour/hooks/useDerivedMeshTiles';
import { EMPTY_VECTOR_MESH } from '../lib/emptyVectorMesh';
import { mergeVectorSurface, type DerivedVectorTile } from '../lib/mergeVectorSurface';
import { useVectorTiles } from './useVectorTiles';
import type { FetcherCtx, VectorMesh, VectorTileFetcher } from '../types';

/** contour와 동일하게 벡터 데이터도 z=6 타일로만 제공된다. */
const VECTOR_TILE_Z = 6;

function useTilesInView(): TileCoord[] {
  const zoom = useViewport((s) => s.zoom);
  const bounds = useViewport((s) => s.bounds);
  return useMemo(() => {
    if (zoom < VECTOR_TILE_Z) return [];
    return getTileCoordsInBounds(VECTOR_TILE_Z, bounds, { padding: 1 });
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
 * useContourSurface의 벡터판. 색상 대신 노드별 (u, v)를 담은 VectorMesh를 만든다.
 * mesh 파생물(positions/conn)은 useDerivedMeshTiles로 contour와 캐시를 공유하고,
 * (u, v)는 useVectorTiles로 별도 캐싱된다. indices를 유지하므로 barycentric 보간에 그대로 쓸 수 있다.
 */
export function useVectorSurface(fetcher: VectorTileFetcher): VectorMesh {
  const tiles = useTilesInView();
  const ctx = useFetcherCtx();

  const derived = useDerivedMeshTiles(tiles, fetcher);
  const vectors = useVectorTiles(tiles, fetcher, ctx);

  return useMemo(() => {
    const pairs: DerivedVectorTile[] = [];
    for (let i = 0; i < tiles.length; i++) {
      const m = derived[i];
      const v = vectors[i];
      if (!m || !v) continue;
      pairs.push({ mesh: m, vectors: v });
    }
    if (pairs.length === 0) return EMPTY_VECTOR_MESH;
    return mergeVectorSurface(pairs);
  }, [tiles, derived, vectors]);
}
