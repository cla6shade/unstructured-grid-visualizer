import { apiFetch } from '@/lib/network/apiFetch';
import type { TimeseriesCatalog } from '@/features/timeseries/types';

/**
 * `/api/timeseries/catalog` — region별 시계열 관측소(station) 목록을 받아온다.
 * station은 시나리오/타임스탬프와 무관하고 URL 단위 불변에 가까워 기본 force-cache를 둔다.
 */
export async function fetchTimeseriesCatalog(): Promise<TimeseriesCatalog> {
  const res = await apiFetch('/api/timeseries/catalog');
  if (!res.ok) throw new Error(`fetchTimeseriesCatalog failed: ${res.status}`);
  return (await res.json()) as TimeseriesCatalog;
}
