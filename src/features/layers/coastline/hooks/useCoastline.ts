import { useEffect, useState } from 'react';
import { useViewport } from '@/features/map/viewport/hooks/useViewport';
import { getTileCoordsInBounds } from '@/lib/tile';
import { pickZoomThreshold } from '@/lib/zoom';
import { COASTLINE_ZOOMS } from '../constants';
import { fetchCoastlineTile } from '../lib/fetchCoastline';

function pickCoastlineZoom(mapZoom: number): number {
  return pickZoomThreshold(mapZoom, COASTLINE_ZOOMS) ?? COASTLINE_ZOOMS[0];
}

/**
 * 현재 viewport(zoom/bounds)에 해당하는 coastline 타일을 받아온다.
 * viewport state가 바뀌면 effect가 자동으로 재실행된다.
 * 캐싱은 브라우저 HTTP 캐시에 위임한다.
 */
export function useCoastline(): GeoJSON.FeatureCollection | null {
  const zoom = useViewport((s) => s.zoom);
  const bounds = useViewport((s) => s.bounds);

  const [featureCollection, setFeatureCollection] =
    useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    const coastlineZoom = pickCoastlineZoom(zoom);
    const tiles = getTileCoordsInBounds(coastlineZoom, bounds);

    let cancelled = false;

    Promise.all(tiles.map((tile) => fetchCoastlineTile(tile))).then(
      (resolved) => {
        // viewport가 다시 바뀌어 effect가 정리됐으면 stale 결과 폐기
        if (cancelled) return;
        setFeatureCollection({
          type: 'FeatureCollection',
          features: resolved.flatMap((fc) => fc.features),
        });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [zoom, bounds]);

  return featureCollection;
}
