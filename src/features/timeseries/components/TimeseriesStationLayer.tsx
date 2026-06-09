import { Marker } from 'react-map-gl/maplibre';
import { useTimeseriesStations } from '@/features/timeseries/hooks/useTimeseriesStations';
import { useTimeseriesSelectionStore } from '@/features/timeseries/store/timeseriesSelectionStore';
import type { SelectedStation } from '@/features/timeseries/types';

interface TimeseriesStationLayerProps {
  /** station 클릭 시 추가 동작(선택 store 갱신과 별개). */
  onSelect?: (station: SelectedStation) => void;
}

/**
 * 지도 위(map inner)에 현재 location의 시계열 station을 작은 점(dot)으로 표시한다.
 * 전국(korea)이면 korea region, 항구면 해당 region(부산은 busan1+busan2)의 station.
 * dot hover 시 station id를 노출하고, 클릭하면 선택 store를 갱신한다.
 * LocationPinLayer 디자인 패턴 포팅.
 */
export function TimeseriesStationLayer({
  onSelect,
}: TimeseriesStationLayerProps) {
  const stations = useTimeseriesStations();
  const selected = useTimeseriesSelectionStore((s) => s.selected);
  const select = useTimeseriesSelectionStore((s) => s.select);

  return (
    <>
      {stations.map((station) => {
        const isSelected =
          selected?.regionKey === station.regionKey &&
          selected?.id === station.id;
        return (
          <Marker
            key={`${station.regionKey}:${station.id}`}
            longitude={station.lon}
            latitude={station.lat}
            anchor="center"
          >
            <button
              type="button"
              onClick={() => {
                select(station);
                onSelect?.(station);
              }}
              className="group relative flex items-center justify-center border-none bg-transparent p-0 cursor-pointer"
            >
              <span
                className={`block rounded-full border-2 border-white transition-all ${
                  isSelected
                    ? 'h-4 w-4 bg-primary ring-2 ring-primary'
                    : 'h-2.5 w-2.5 bg-surface group-hover:h-3.5 group-hover:w-3.5 group-hover:bg-primary'
                }`}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-surface px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                {station.id}
              </span>
            </button>
          </Marker>
        );
      })}
    </>
  );
}
