import { useMemo } from 'react';
import { formatKstIso, parseKstNaive } from '@/lib/timeUtils';
import { useScenario } from './useScenario';

const HOUR_MS = 60 * 60 * 1000;

/**
 * 현재 timestamp의 다음 스텝(+1시간)을 KST ISO 문자열로 반환한다.
 * catalog의 scenario_times(first/last)로 다음 스텝이 시나리오 시간 범위 안인지 확인하고,
 * 범위를 벗어나면(= 더 이상 데이터가 없으면) null을 반환한다.
 * 프리페치 활성 여부와 재생 종료 판정의 단일 출처.
 */
export function useNextTimestep(): string | null {
  const catalog = useScenario((s) => s.catalog);
  const typhoonId = useScenario((s) => s.typhoonId);
  const scenarioId = useScenario((s) => s.scenarioId);
  const timestamp = useScenario((s) => s.timestamp);

  return useMemo(() => {
    const times = catalog.scenario_times.find(
      (t) => t.typhoon_id === typhoonId && t.scenario_id === scenarioId,
    );
    if (!times) return null;
    const last = parseKstNaive(times.last_time);
    const next = new Date(timestamp).getTime() + HOUR_MS;
    if (next > last) return null;
    return formatKstIso(next);
  }, [catalog, typhoonId, scenarioId, timestamp]);
}
