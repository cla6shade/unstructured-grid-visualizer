import { useEffect, useState } from 'react';
import { useViewport } from '@/features/map/viewport/hooks/useViewport';
import { useTime } from '@/features/map/time/hooks/useTime';
import { getTileCoordsInBounds } from '@/lib/tile';
import { pickZoomThreshold } from '@/lib/zoom';
import { EMPTY_SURFACE, loadSurfaceMesh } from '../lib/surfaceMesh';
import type { ContourTileFetcher, SurfaceMesh } from '../types';

/** contour 데이터가 존재하는 타일 zoom 단계 (지도 zoom은 연속값이라 여기로 스냅) */
const CONTOUR_ZOOMS = [6, 11] as const;

/**
 * viewport(zoom/bounds)와 timeIndex에 따라 contour 표면 메시를 받아온다.
 * useCoastline과 동일한 선언적 패턴 — 상태가 바뀌면 effect가 자동 재실행된다.
 * 캐싱은 브라우저 HTTP 캐시에 위임한다.
 */
export function useContourSurface(
  fetcher: ContourTileFetcher,
  minZoom?: number,
): SurfaceMesh {
  const zoom = useViewport((s) => s.zoom);
  const bounds = useViewport((s) => s.bounds);
  const timeIndex = useTime((s) => s.timeIndex);

  const [surface, setSurface] = useState<SurfaceMesh>(EMPTY_SURFACE);

  useEffect(() => {
    const contourZoom = pickZoomThreshold(zoom, CONTOUR_ZOOMS);
    if (
      contourZoom === null ||
      (minZoom !== undefined && contourZoom < minZoom)
    ) {
      setSurface(EMPTY_SURFACE);
      return;
    }

    const tiles = getTileCoordsInBounds(contourZoom, bounds, { padding: 1 });
    if (tiles.length === 0) {
      setSurface(EMPTY_SURFACE);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function load(zoom: number) {
      const mesh = await loadSurfaceMesh(
        tiles,
        zoom,
        timeIndex,
        fetcher,
        controller.signal,
      );
      if (!cancelled) setSurface(mesh);
    }
    load(contourZoom);

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [zoom, bounds, timeIndex, fetcher, minZoom]);

  return surface;
}
