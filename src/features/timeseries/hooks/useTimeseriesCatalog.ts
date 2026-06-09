import { useQuery } from '@tanstack/react-query';
import { fetchTimeseriesCatalog } from '@/features/timeseries/lib/fetchTimeseriesCatalog';
import type { TimeseriesCatalog } from '@/features/timeseries/types';

/**
 * `/api/timeseries/catalog`를 한 번 받아와 캐시한다. station 목록은 시나리오와 무관하므로
 * scenario를 query key에 넣지 않고 staleTime: Infinity로 세션 내 재사용한다.
 */
export function useTimeseriesCatalog(): TimeseriesCatalog | undefined {
  const { data } = useQuery({
    queryKey: ['timeseries-catalog'],
    queryFn: fetchTimeseriesCatalog,
    staleTime: Infinity,
  });
  return data;
}
