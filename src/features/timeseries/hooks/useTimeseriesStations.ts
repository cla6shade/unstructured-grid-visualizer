import { useMemo } from 'react';
import { useLocationStore } from '@/features/map/locationSelector/store/locationStore';
import { LOCATION_REGION_KEYS } from '@/features/timeseries/constants/regionMap';
import { useTimeseriesCatalog } from '@/features/timeseries/hooks/useTimeseriesCatalog';
import type { SelectedStation } from '@/features/timeseries/types';

/**
 * 현재 location에 해당하는 region들의 station을 모아 마커 단위(SelectedStation)로 반환한다.
 * busan은 busan1·busan2를 합치되, region_key를 키에 포함해 id 충돌을 피한다.
 * catalog 미로드 시 빈 배열.
 */
export function useTimeseriesStations(): SelectedStation[] {
  const catalog = useTimeseriesCatalog();
  const locationId = useLocationStore((s) => s.location.id);

  return useMemo<SelectedStation[]>(() => {
    if (!catalog) return [];
    const regionKeys = LOCATION_REGION_KEYS[locationId] ?? [];
    const result: SelectedStation[] = [];
    for (const region of catalog.regions) {
      if (!regionKeys.includes(region.region_key)) continue;
      for (const s of region.stations) {
        result.push({
          regionKey: region.region_key,
          id: s.id,
          lat: s.lat,
          lon: s.lon,
        });
      }
    }
    return result;
  }, [catalog, locationId]);
}
