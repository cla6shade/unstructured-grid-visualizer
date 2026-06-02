import { useEffect } from 'react';
import { useViewport } from '@/features/map/viewport/hooks/useViewport';
import { useLocationStore } from '@/features/map/locationSelector/store/locationStore';
import { detectRegionId } from '@/features/map/locationSelector/constants/locations';

/**
 * 뷰포트(zoom + center)로 '현재 보고 있는 지역'을 감지해 locationStore에 반영한다.
 * 뷰포트가 source — 사용자 팬/줌이나 클릭(jumpTo) 후 moveend로 viewport store가 갱신되면
 * 그에 맞춰 location이 따라온다. 감지값이 현재와 다를 때만 set 한다(불필요 갱신 방지).
 *
 * 외부(maplibre 뷰포트) 상태를 store에 동기화하는 것이므로 effect 사용이 정당하다.
 */
export function useSyncLocationFromViewport(): void {
  const zoom = useViewport((s) => s.zoom);
  const center = useViewport((s) => s.center);
  const currentId = useLocationStore((s) => s.location.id);
  const pending = useLocationStore((s) => s.pending);
  const setLocation = useLocationStore((s) => s.setLocation);
  const setPending = useLocationStore((s) => s.setPending);

  const detectedId = detectRegionId(zoom, center);

  useEffect(() => {
    // 감지된 항구가 클릭으로 요청했던 목적지(pending)와 같으면 '클릭 이동', 아니면 팬/줌 진입.
    if (detectedId !== currentId) {
      const byClick = pending !== null && detectedId === pending;
      setLocation(detectedId, byClick);
    }
  }, [detectedId, currentId, pending, setLocation]);

  // 이동 요청한 목적지에 도착하면 pending을 비운다(이후엔 location 기준 로딩 표시로 전환).
  useEffect(() => {
    if (pending !== null && detectedId === pending) setPending(null);
  }, [detectedId, pending, setPending]);
}
