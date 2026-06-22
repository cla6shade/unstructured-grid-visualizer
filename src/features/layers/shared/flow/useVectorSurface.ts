import { useMemo } from 'react';
import { useTilesInView } from '@/features/layers/shared/tiles/useTilesInView';
import { useFetcherCtx } from '@/features/layers/shared/tiles/useFetcherCtx';
import { useDerivedMeshTiles } from '@/features/layers/shared/tiles/useDerivedMeshTiles';
import { useValueBufferTiles } from '@/features/layers/shared/tiles/useValueBufferTiles';
import { usePrefetchValueBuffers } from '@/features/layers/shared/tiles/usePrefetchValueBuffers';
import { usePlaybackStore } from '@/features/map/scenario/store/playbackStore';
import { useNextTimestep } from '@/features/map/scenario/hooks/useNextTimestep';
import { useLocationStore } from '@/features/map/locationSelector/store/locationStore';
import { portDetailTiles } from '@/features/map/locationSelector/constants/portTiles';
import {
  KOREA_LOCATION,
  KOREA_LOCATION_ID,
  KOREA_ZOOM,
} from '@/features/map/locationSelector/constants/locations';
import { EMPTY_VECTOR_MESH } from './emptyVectorMesh';
import { mergeVectorSurface, type DerivedVectorTile } from './mergeVectorSurface';
import type { VectorMesh, VectorTileFetcher } from './types';

/**
 * useContourSurface의 벡터판. 색상 대신 노드별 (u, v)를 담은 VectorMesh를 만든다.
 * contour와 동일하게 base(전국 z=6, viewport 기반) + detail(항구 z=11, 매니페스트) 두 슬롯으로
 * 받아오고, 베이스는 디테일이 덮는 영역에 구멍을 뚫는다(비겹침). mesh 파생물은 useDerivedMeshTiles로
 * contour와 캐시를 공유한다.
 */
export interface VectorSurfaceResult {
  /** 전국(z=6) 베이스. boundary 마스크로 항구 영역이 도려내진다. */
  base: VectorMesh;
  /** 항구(z=11) 디테일. 전국 뷰에서는 EMPTY_VECTOR_MESH. */
  detail: VectorMesh;
  /** 베이스 + (항구면) 디테일 타일이 모두 도착했는지. */
  isLoaded: boolean;
  /** 항구이고 z=11 디테일 타일이 모두 도착했는지. base를 boundary로 컷하는 시점 gating에 쓴다. */
  detailLoaded: boolean;
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

  const base = useMemo(() => {
    const pairs: DerivedVectorTile[] = [];
    for (let i = 0; i < baseTiles.length; i++) {
      const m = baseMeshes[i];
      const v = baseVectors[i];
      if (!m || !v) continue;
      pairs.push({ mesh: m, vectors: v });
    }
    if (pairs.length === 0) return EMPTY_VECTOR_MESH;
    return mergeVectorSurface(pairs);
  }, [baseTiles, baseMeshes, baseVectors]);

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

  // 재생 중이면 다음 스텝의 (u,v) 타일을 현재 뷰포트/디테일 타일에 대해 미리 받아 캐시를 워밍한다.
  const nextTimestamp = useNextTimestep();
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const prefetchEnabled = enabled && isPlaying && nextTimestamp != null;
  usePrefetchValueBuffers(
    baseTiles,
    fetcher,
    { ...baseCtx, timestamp: nextTimestamp ?? baseCtx.timestamp },
    fetcher.toVectors,
    'vectors',
    prefetchEnabled,
  );
  usePrefetchValueBuffers(
    detailTiles,
    fetcher,
    { ...detailCtx, timestamp: nextTimestamp ?? detailCtx.timestamp },
    fetcher.toVectors,
    'vectors',
    prefetchEnabled,
  );

  const detailLoaded = isPort && detailMeshLoaded && detailVectorsLoaded;
  const detailReady = !isPort || detailLoaded;
  const isLoaded = baseMeshLoaded && baseVectorsLoaded && detailReady;

  return { base, detail, isLoaded, detailLoaded };
}
