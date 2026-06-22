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
import { EMPTY_SURFACE } from './emptySurface';
import { mergeSurface, type DerivedTile } from './mergeSurface';
import type { ContourTileFetcher, SurfaceMesh } from './types';

/**
 * contour 표면을 **두 해상도 슬롯**으로 받아온다:
 * - base: 전국(z=6) — viewport 기반, 항상. 항구 선택 시 z=11 디테일이 덮는 영역은 구멍이 뚫린다.
 * - detail: 항구(z=11) — `tiles_by_port.json` 고정 타일 목록(viewport 무관), 항구일 때만.
 *
 * base/detail은 globalNodes 충돌을 피해 **각각 따로** merge한다. 디테일이 베이스의 구멍에
 * 정확히 들어가 두 레이어가 겹치지 않으므로 반투명 색 중첩/z-fighting이 없다.
 * 타일별 파생물(mesh positions+conn, colors)은 react-query 캐시에 분리 저장되어 재사용된다.
 */
export interface ContourSurfaceResult {
  /** 전국(z=6) 베이스. boundary 마스크로 항구 영역이 도려내진다. */
  base: SurfaceMesh;
  /** 항구(z=11) 디테일. 전국 뷰에서는 EMPTY_SURFACE. */
  detail: SurfaceMesh;
  /** 베이스 + (항구면) 디테일 타일이 모두 도착했는지. */
  isLoaded: boolean;
  /** 항구이고 z=11 디테일 타일이 모두 도착했는지. base를 boundary로 컷하는 시점 gating에 쓴다. */
  detailLoaded: boolean;
}

export function useContourSurface(
  fetcher: ContourTileFetcher,
  enabled = true,
): ContourSurfaceResult {
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
  const { buffers: baseColors, isLoaded: baseColorsLoaded } =
    useValueBufferTiles(baseTiles, fetcher, baseCtx, fetcher.toColors, 'colors');

  // 디테일: 항구 z=11. 타일은 매니페스트 고정 목록(viewport 무관).
  const detailCtx = useFetcherCtx(location.urlKey);
  const detailTiles = useMemo(
    () => (enabled && isPort ? portDetailTiles(location.urlKey) : []),
    [enabled, isPort, location.urlKey],
  );
  const { meshes: detailMeshes, isLoaded: detailMeshLoaded } =
    useDerivedMeshTiles(detailTiles, fetcher, detailCtx);
  const { buffers: detailColors, isLoaded: detailColorsLoaded } =
    useValueBufferTiles(
      detailTiles,
      fetcher,
      detailCtx,
      fetcher.toColors,
      'colors',
    );

  const base = useMemo(() => {
    const pairs: DerivedTile[] = [];
    for (let i = 0; i < baseTiles.length; i++) {
      const m = baseMeshes[i];
      const c = baseColors[i];
      if (!m || !c) continue;
      pairs.push({ mesh: m, colors: c });
    }
    if (pairs.length === 0) return EMPTY_SURFACE;
    return mergeSurface(pairs);
  }, [baseTiles, baseMeshes, baseColors]);

  const detail = useMemo(() => {
    const pairs: DerivedTile[] = [];
    for (let i = 0; i < detailTiles.length; i++) {
      const m = detailMeshes[i];
      const c = detailColors[i];
      if (!m || !c) continue;
      pairs.push({ mesh: m, colors: c });
    }
    if (pairs.length === 0) return EMPTY_SURFACE;
    return mergeSurface(pairs);
  }, [detailTiles, detailMeshes, detailColors]);

  // 재생 중이면 다음 스텝의 값 타일을 현재 뷰포트/디테일 타일에 대해 미리 받아 캐시를 워밍한다.
  // mesh는 timestamp 무관(이미 캐시)이므로 값 타일만 프리페치하면 된다.
  const nextTimestamp = useNextTimestep();
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const prefetchEnabled = enabled && isPlaying && nextTimestamp != null;
  usePrefetchValueBuffers(
    baseTiles,
    fetcher,
    { ...baseCtx, timestamp: nextTimestamp ?? baseCtx.timestamp },
    fetcher.toColors,
    'colors',
    prefetchEnabled,
  );
  usePrefetchValueBuffers(
    detailTiles,
    fetcher,
    { ...detailCtx, timestamp: nextTimestamp ?? detailCtx.timestamp },
    fetcher.toColors,
    'colors',
    prefetchEnabled,
  );

  const detailLoaded = isPort && detailMeshLoaded && detailColorsLoaded;
  const detailReady = !isPort || detailLoaded;
  const isLoaded = baseMeshLoaded && baseColorsLoaded && detailReady;

  return { base, detail, isLoaded, detailLoaded };
}
