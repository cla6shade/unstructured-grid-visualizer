import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import { nearestHourlyTimestamp } from '@/lib/timeUtils';

/**
 * 태풍/시나리오 전환 로직. 카탈로그를 참조해 setter를 호출하고 타임스탬프를 범위에 맞게 스냅한다.
 * 사이드바(태풍 선택)와 상단 바(시나리오 선택)에서 공유한다.
 */
export function useScenarioSelection() {
  const catalog = useScenario((s) => s.catalog);
  const typhoonId = useScenario((s) => s.typhoonId);
  const setTyphoonId = useScenario((s) => s.setTyphoonId);
  const setScenarioId = useScenario((s) => s.setScenarioId);
  const setTimestamp = useScenario((s) => s.setTimestamp);

  const selectTyphoon = (nextTyphoonId: string) => {
    const nextTyphoon = catalog.typhoons.find(
      (t) => t.typhoon_id === nextTyphoonId,
    );
    if (!nextTyphoon) return;
    const nextScenarioId = nextTyphoon.scenario_ids.at(-1);
    if (!nextScenarioId) return;
    setTyphoonId(nextTyphoonId);
    setScenarioId(nextScenarioId);
    const times = catalog.scenario_times.find(
      (t) => t.typhoon_id === nextTyphoonId && t.scenario_id === nextScenarioId,
    );
    if (times) {
      setTimestamp(nearestHourlyTimestamp(times.first_time, times.last_time));
    }
  };

  const selectScenario = (nextScenarioId: string) => {
    setScenarioId(nextScenarioId);
    const times = catalog.scenario_times.find(
      (t) => t.typhoon_id === typhoonId && t.scenario_id === nextScenarioId,
    );
    if (times) {
      setTimestamp(nearestHourlyTimestamp(times.first_time, times.last_time));
    }
  };

  return { selectTyphoon, selectScenario };
}
