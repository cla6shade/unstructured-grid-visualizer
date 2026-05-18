import { useCallback, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { useViewport } from '@/features/map/viewport/hooks/useViewport';

/**
 * 지도 인스턴스의 현재 center/zoom/bounds를 뷰포트 스토어에 반영하는
 * 콜백을 반환한다. 지도의 onLoad / onMoveEnd 핸들러로 사용한다.
 */
export function useSyncView(mapRef: RefObject<MapRef | null>): () => void {
  const setView = useViewport((s) => s._setView);

  return useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const center = map.getCenter();
    const bounds = map.getBounds();
    setView({
      center: { lat: center.lat, lng: center.lng },
      zoom: Math.round(map.getZoom()),
      bounds: {
        sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
        ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
      },
    });
  }, [mapRef, setView]);
}
