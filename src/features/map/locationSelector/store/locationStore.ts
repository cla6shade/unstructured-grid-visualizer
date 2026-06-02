import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  KOREA_LOCATION,
  KOREA_ZOOM,
  LOCATIONS,
  zoomForLocation,
  type LocationDef,
  type LocationId,
} from '@/features/map/locationSelector/constants/locations';

interface LocationStore {
  /** 현재 선택된 location (기본값 = 전국). */
  location: LocationDef;
  /** 타깃 zoom = 타일 z. 전국 6, 항구 11. */
  zoom: number;
  setLocation: (id: LocationId) => void;
}

export const useLocationStore = create<LocationStore>()(
  devtools(
    (set) => ({
      location: KOREA_LOCATION,
      zoom: KOREA_ZOOM,
      // location과 zoom을 한 번의 set으로 함께 변경한다(effect로 파생 금지).
      setLocation: (id) => {
        const location = LOCATIONS.find((l) => l.id === id) ?? KOREA_LOCATION;
        set(
          { location, zoom: zoomForLocation(location.id) },
          undefined,
          `setLocation/${id}`,
        );
      },
    }),
    { name: 'LocationStore' },
  ),
);
