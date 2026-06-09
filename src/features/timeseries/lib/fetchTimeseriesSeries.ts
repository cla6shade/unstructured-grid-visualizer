import { apiFetch } from '@/lib/network/apiFetch';
import type { TimeseriesSeries } from '@/features/timeseries/types';

export interface TimeseriesSeriesParams {
  region: string;
  typhoonId: string;
  scenarioId: string;
  station: string;
  variable: string;
}

/**
 * `/api/timeseries/{region}/{typhoon_id}/{scenario_id}/{station}/{variable}` — 한 변수의 시계열을
 * 받아온다. station/variable id는 한글·특수문자가 있을 수 있어 encodeURIComponent 필수.
 * 값/시간은 시나리오·태풍 단위로 URL 불변이라 기본 force-cache를 유지한다.
 * 해당 station에 없는 변수면 404 → null(차트 단위 방어).
 */
export async function fetchTimeseriesSeries({
  region,
  typhoonId,
  scenarioId,
  station,
  variable,
}: TimeseriesSeriesParams): Promise<TimeseriesSeries | null> {
  const path = `/api/timeseries/${encodeURIComponent(region)}/${encodeURIComponent(
    typhoonId,
  )}/${encodeURIComponent(scenarioId)}/${encodeURIComponent(
    station,
  )}/${encodeURIComponent(variable)}`;
  const res = await apiFetch(path);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fetchTimeseriesSeries failed: ${res.status}`);
  return (await res.json()) as TimeseriesSeries;
}
