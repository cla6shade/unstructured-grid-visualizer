import { useMemo } from 'react';
import { useTilesInView } from '@/features/tiles/hooks/useTilesInView';
import { useFetcherCtx } from '@/features/tiles/hooks/useFetcherCtx';
import { useDerivedMeshTiles } from '@/features/tiles/hooks/useDerivedMeshTiles';
import { useValueBufferTiles } from '@/features/tiles/hooks/useValueBufferTiles';
import { useLocationStore } from '@/features/map/locationSelector/store/locationStore';
import { portDetailTiles } from '@/features/map/locationSelector/constants/portTiles';
import {
  KOREA_LOCATION,
  KOREA_LOCATION_ID,
  KOREA_ZOOM,
} from '@/features/map/locationSelector/constants/locations';
import { tileLngLatBounds, type LngLatRect } from '@/lib/tile';
import { EMPTY_VECTOR_MESH } from '../lib/emptyVectorMesh';
import { mergeVectorSurface, type DerivedVectorTile } from '../lib/mergeVectorSurface';
import type { VectorMesh, VectorTileFetcher } from '../types';

/**
 * useContourSurface의 벡터판. 색상 대신 노드별 (u, v)를 담은 VectorMesh를 만든다.
 * contour와 동일하게 base(전국 z=6, viewport 기반) + detail(항구 z=11, 매니페스트) 두 슬롯으로
 * 받아오고, 베이스는 디테일이 덮는 영역에 구멍을 뚫는다(비겹침). mesh 파생물은 useDerivedMeshTiles로
 * contour와 캐시를 공유한다.
 */
export interface VectorSurfaceResult {
  /** 전국(z=6) 베이스. 항구면 디테일 영역이 도려내진다. */
  base: VectorMesh;
  /** 항구(z=11) 디테일. 전국 뷰에서는 EMPTY_VECTOR_MESH. */
  detail: VectorMesh;
  /** 베이스 + (항구면) 디테일 타일이 모두 도착했는지. */
  isLoaded: boolean;
}

export function useVectorSurface(
  fetcher: VectorTileFetcher,
  enabled = true,
): VectorSurfaceResult {
  const location = useLocationStore((s) => s.location);
  const isPort = location.id !== KOREA_LOCATION_ID;

  // 베이스: 전국 z=6, viewport 기반. 항상 활성.
  const baseCtx = useFetcherCtx(KOREA_LOCATION.urlKey);
  const baseTiles = useTilesInView(KOREA_ZOOM, { enabled });
  const { meshes: baseMeshes, isLoaded: baseMeshLoaded } = useDerivedMeshTiles(
    baseTiles,
    fetcher,
    baseCtx,
  );
  const { buffers: baseVectors, isLoaded: baseVectorsLoaded } =
    useValueBufferTiles(
      baseTiles,
      fetcher,
      baseCtx,
      fetcher.toVectors,
      'vectors',
    );

  // 디테일: 항구 z=11. 타일은 매니페스트 고정 목록(viewport 무관).
  const detailCtx = useFetcherCtx(location.urlKey);
  const detailTiles = useMemo(
    () => (enabled && isPort ? portDetailTiles(location.urlKey) : []),
    [enabled, isPort, location.urlKey],
  );
  const { meshes: detailMeshes, isLoaded: detailMeshLoaded } =
    useDerivedMeshTiles(detailTiles, fetcher, detailCtx);
  const { buffers: detailVectors, isLoaded: detailVectorsLoaded } =
    useValueBufferTiles(
      detailTiles,
      fetcher,
      detailCtx,
      fetcher.toVectors,
      'vectors',
    );

  const holes = useMemo<LngLatRect[]>(() => {
    if (!isPort) return [];
    const rects: LngLatRect[] = [];
    for (let i = 0; i < detailTiles.length; i++) {
      if (detailMeshes[i] && detailVectors[i]) {
        rects.push(tileLngLatBounds(detailTiles[i]));
      }
    }
    return rects;
  }, [isPort, detailTiles, detailMeshes, detailVectors]);

  const base = useMemo(() => {
    const pairs: DerivedVectorTile[] = [];
    for (let i = 0; i < baseTiles.length; i++) {
      const m = baseMeshes[i];
      const v = baseVectors[i];
      if (!m || !v) continue;
      pairs.push({ mesh: m, vectors: v });
    }
    if (pairs.length === 0) return EMPTY_VECTOR_MESH;
    return mergeVectorSurface(pairs, holes);
  }, [baseTiles, baseMeshes, baseVectors, holes]);

  const detail = useMemo(() => {
    const pairs: DerivedVectorTile[] = [];
    for (let i = 0; i < detailTiles.length; i++) {
      const m = detailMeshes[i];
      const v = detailVectors[i];
      if (!m || !v) continue;
      pairs.push({ mesh: m, vectors: v });
    }
    if (pairs.length === 0) return EMPTY_VECTOR_MESH;
    return mergeVectorSurface(pairs);
  }, [detailTiles, detailMeshes, detailVectors]);

  const detailReady = !isPort || (detailMeshLoaded && detailVectorsLoaded);
  const isLoaded = baseMeshLoaded && baseVectorsLoaded && detailReady;

  return { base, detail, isLoaded };
}
