import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import {
  LOCATIONS,
  KOREA_LOCATION,
  zoomForLocation,
  type LocationId,
} from '@/features/map/locationSelector/constants/locations';
import { useLocationStore } from '@/features/map/locationSelector/store/locationStore';

/**
 * 클릭 후 실제 카메라 이동까지의 지연(ms). setTimeout(0)이라 즉시 점프하되,
 * pending이 먼저 paint되어 "이동 중" 오버레이가 카메라 점프 직전에 뜬다.
 */
const MOVE_DELAY_MS = 0;

/**
 * location 선택을 지도 카메라 이동으로 처리하는 콜백을 반환한다(버튼/마커 클릭용).
 * 클릭 즉시 store.pending을 세팅해 "이동 중" 오버레이를 바로 띄우고, 다음 tick에 `jumpTo`로
 * 카메라를 옮긴다. moveend 후 useSyncLocationFromViewport가 뷰포트에서 현재 location을
 * 파생하고(단방향, 루프 없음) 도착 시 pending을 비운다. 대기 중 다시 클릭하면 이전 예약은 취소.
 */
export function useFlyToLocation(
  mapRef: RefObject<MapRef | null>,
): (id: LocationId) => void {
  const setPending = useLocationStore((s) => s.setPending);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return useCallback(
    (id: LocationId) => {
      const loc = LOCATIONS.find((l) => l.id === id) ?? KOREA_LOCATION;
      setPending(id); // 즉시 "이동 중" 표시
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        mapRef.current?.jumpTo({
          center: [loc.lng, loc.lat],
          zoom: zoomForLocation(id),
        });
      }, MOVE_DELAY_MS);
    },
    [mapRef, setPending],
  );
}
