import { useMemo } from 'react';
import { useTilesInView } from '@/features/tiles/hooks/useTilesInView';
import { useFetcherCtx } from '@/features/tiles/hooks/useFetcherCtx';
import { useDerivedMeshTiles } from '@/features/tiles/hooks/useDerivedMeshTiles';
import { useValueBufferTiles } from '@/features/tiles/hooks/useValueBufferTiles';
import { EMPTY_VECTOR_MESH } from '../lib/emptyVectorMesh';
import { mergeVectorSurface, type DerivedVectorTile } from '../lib/mergeVectorSurface';
import type { VectorMesh, VectorTileFetcher } from '../types';

/** contour와 동일하게 벡터 데이터도 z=6 타일로만 제공된다. */
const VECTOR_TILE_Z = 6;

/**
 * useContourSurface의 벡터판. 색상 대신 노드별 (u, v)를 담은 VectorMesh를 만든다.
 * mesh 파생물(positions/conn)은 useDerivedMeshTiles로 contour와 캐시를 공유하고,
 * (u, v)는 useValueBufferTiles로 별도 캐싱된다. indices를 유지하므로 barycentric 보간에 그대로 쓸 수 있다.
 */
export interface VectorSurfaceResult {
  mesh: VectorMesh;
  /** 현재 뷰포트의 모든 타일(mesh+vectors)이 도착했는지. 빈 타일셋이면 false. */
  isLoaded: boolean;
}

export function useVectorSurface(
  fetcher: VectorTileFetcher,
  enabled = true,
): VectorSurfaceResult {
  const tiles = useTilesInView(VECTOR_TILE_Z, { enabled });
  const ctx = useFetcherCtx();

  const { meshes, isLoaded: meshLoaded } = useDerivedMeshTiles(tiles, fetcher);
  const { buffers: vectors, isLoaded: vectorsLoaded } = useValueBufferTiles(
    tiles,
    fetcher,
    ctx,
    fetcher.toVectors,
    'vectors',
  );
  const isLoaded = meshLoaded && vectorsLoaded;

  const mesh = useMemo(() => {
    const pairs: DerivedVectorTile[] = [];
    for (let i = 0; i < tiles.length; i++) {
      const m = meshes[i];
      const v = vectors[i];
      if (!m || !v) continue;
      pairs.push({ mesh: m, vectors: v });
    }
    if (pairs.length === 0) return EMPTY_VECTOR_MESH;
    return mergeVectorSurface(pairs);
  }, [tiles, meshes, vectors]);

  return { mesh, isLoaded };
}
