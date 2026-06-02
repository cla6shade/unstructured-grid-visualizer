import { useMemo } from 'react';
import { useTilesInView } from '@/features/tiles/hooks/useTilesInView';
import { useFetcherCtx } from '@/features/tiles/hooks/useFetcherCtx';
import { useDerivedMeshTiles } from '@/features/tiles/hooks/useDerivedMeshTiles';
import { useValueBufferTiles } from '@/features/tiles/hooks/useValueBufferTiles';
import { useLocationStore } from '@/features/map/locationSelector/store/locationStore';
import { EMPTY_SURFACE } from '../lib/emptySurface';
import { mergeSurface, type DerivedTile } from '../lib/mergeSurface';
import type { ContourTileFetcher, SurfaceMesh } from '../types';

/**
 * viewport(zoom/bounds)와 scenario(typhoon/scenario/timestamp)에 따라
 * contour 표면 메시를 받아온다. 타일별 파생물(mesh positions+conn, colors)은
 * react-query 캐시에 분리 저장되어:
 * - timestamp 변경 시 connectivity·positions는 재사용, 새 colors만 계산
 * - pan으로 tile-set만 바뀔 때 변하지 않은 타일의 파생물은 그대로 재사용
 *
 * mergeSurface는 캐시된 typed array들을 concat·remap만 수행.
 */
export interface ContourSurfaceResult {
  surface: SurfaceMesh;
  /** 현재 뷰포트의 모든 타일(mesh+colors)이 도착했는지. 빈 타일셋이면 false. */
  isLoaded: boolean;
}

export function useContourSurface(
  fetcher: ContourTileFetcher,
  enabled = true,
): ContourSurfaceResult {
  // contour 데이터는 location별 고정 z 타일로 제공된다(전국 6, 항구 11).
  // 타일 z는 locationStore의 zoom을 그대로 사용한다.
  const tileZ = useLocationStore((s) => s.zoom);
  const tiles = useTilesInView(tileZ, { enabled });
  const ctx = useFetcherCtx();

  const { meshes, isLoaded: meshLoaded } = useDerivedMeshTiles(
    tiles,
    fetcher,
    ctx,
  );
  const { buffers: colors, isLoaded: colorsLoaded } = useValueBufferTiles(
    tiles,
    fetcher,
    ctx,
    fetcher.toColors,
    'colors',
  );
  const isLoaded = meshLoaded && colorsLoaded;

  const surface = useMemo(() => {
    const pairs: DerivedTile[] = [];
    for (let i = 0; i < tiles.length; i++) {
      const m = meshes[i];
      const c = colors[i];
      if (!m || !c) continue;
      pairs.push({ mesh: m, colors: c });
    }
    if (pairs.length === 0) return EMPTY_SURFACE;
    return mergeSurface(pairs);
  }, [tiles, meshes, colors]);

  return { surface, isLoaded };
}
