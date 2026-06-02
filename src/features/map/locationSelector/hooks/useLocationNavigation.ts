import { useEffect, useRef, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { useLocationStore } from '@/features/map/locationSelector/store/locationStore';

/**
 * location 스토어 변경을 maplibre 지도에 동기화한다. location/zoom이 바뀌면
 * `jumpTo`로 즉시 이동(애니메이션 없음). jumpTo는 moveend를 발생시키므로
 * 기존 useSyncView(onMoveEnd)가 viewport 스토어를 갱신 → 타일이 재계산된다.
 *
 * 지도 초기 뷰가 이미 전국(korea)과 일치하므로 마운트 첫 실행은 건너뛴다.
 */
export function useLocationNavigation(mapRef: RefObject<MapRef | null>): void {
  const location = useLocationStore((s) => s.location);
  const zoom = useLocationStore((s) => s.zoom);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const map = mapRef.current;
    if (!map) return;
    map.jumpTo({ center: [location.lng, location.lat], zoom });
  }, [mapRef, location, zoom]);
}
