import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  KOREA_LOCATION,
  LOCATIONS,
  type LocationDef,
  type LocationId,
} from '@/features/map/locationSelector/constants/locations';

interface LocationStore {
  /** 현재 보고 있는 location(기본값 = 전국). 뷰포트 감지가 갱신한다. */
  location: LocationDef;
  /**
   * 클릭으로 이동 요청된 대상(있으면). 카메라가 실제로 움직이기 전(1초 대기)부터
   * "이동 중" 오버레이를 즉시 띄우기 위한 값. 목적지에 도착하면(뷰포트 감지) 비운다.
   */
  pending: LocationId | null;
  /**
   * 현재 location 진입이 버튼/마커 클릭 이동이었는지. 팬/줌으로 들어온 항구면 false.
   * 클릭 없이 들어온 항구에는 "이동 중" 오버레이를 띄우지 않기 위해 쓴다.
   */
  byClick: boolean;
  setLocation: (id: LocationId, byClick: boolean) => void;
  setPending: (id: LocationId | null) => void;
  /**
   * 클릭 이동 도착·데이터 로드가 끝나면 byClick을 내려, 이후 타임스탬프 스크럽 같은
   * 비-이동 갱신에서는 "이동 중" 오버레이가 다시 뜨지 않게 한다.
   */
  clearByClick: () => void;
}

export const useLocationStore = create<LocationStore>()(
  devtools(
    (set, get) => ({
      location: KOREA_LOCATION,
      pending: null,
      byClick: false,
      // 뷰포트가 source. 카메라 이동은 클릭(useFlyToLocation)이 담당하고,
      // 여기서는 감지된 location만 갱신한다(jump 없음).
      setLocation: (id, byClick) => {
        const location = LOCATIONS.find((l) => l.id === id) ?? KOREA_LOCATION;
        set({ location, byClick }, undefined, `setLocation/${id}`);
      },
      setPending: (id) => set({ pending: id }, undefined, `setPending/${id}`),
      clearByClick: () => {
        if (!get().byClick) return;
        // 렌더 단계(LoadingOverlay)에서 호출되므로 set은 microtask로 미룬다.
        queueMicrotask(() => {
          if (!get().byClick) return;
          set({ byClick: false }, undefined, 'clearByClick');
        });
      },
    }),
    { name: 'LocationStore' },
  ),
);
