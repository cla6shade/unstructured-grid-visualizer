import { Marker } from 'react-map-gl/maplibre';
import {
  PORTS,
  getMarkerCoord,
  type LocationId,
} from '@/features/map/locationSelector/constants/locations';
import { useLocationStore } from '@/features/map/locationSelector/store/locationStore';

interface LocationPinLayerProps {
  onSelect: (id: LocationId) => void;
}

/**
 * 지도 위(map inner)에 항구 마커를 표시한다. 현재 보고 있는 항구(active)는
 * 이미 그 위에 있으므로 마커를 숨긴다. 클릭하면 onSelect로 해당 항구 이동을 요청.
 * 구 koos-front LocationPinLayer 디자인 포팅.
 */
export function LocationPinLayer({ onSelect }: LocationPinLayerProps) {
  const activeId = useLocationStore((s) => s.location.id);

  return (
    <>
      {PORTS.filter((loc) => loc.id !== activeId).map((loc) => {
        const marker = getMarkerCoord(loc);
        return (
          <Marker
            key={loc.id}
            longitude={marker.lng}
            latitude={marker.lat}
            anchor="center"
          >
            <button
              onClick={() => onSelect(loc.id)}
              className="flex h-15 w-15 items-center justify-center rounded-full border-none bg-surface text-xl font-medium text-white cursor-pointer transition-all hover:bg-background-hover"
            >
              {loc.label}
            </button>
          </Marker>
        );
      })}
    </>
  );
}
