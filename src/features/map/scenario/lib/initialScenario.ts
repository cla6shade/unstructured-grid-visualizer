import type {
  ScenarioState,
  SubsetCatalog,
} from '@/features/map/scenario/types';
import { nearestHourlyTimestamp } from '@/lib/timeUtils';

/**
 * catalog에서 초기 scenario 상태를 도출한다.
 * - typhoonId: 마지막 typhoon
 * - scenarioId: 해당 typhoon의 마지막 scenario_id
 * - timestamp: 해당 (typhoon, scenario)의 scenario_times 범위 안에서
 *   1시간 간격으로 스냅한, 현재 시각에 가장 가까운 KST ISO 문자열
 */
export function deriveInitialScenario(catalog: SubsetCatalog): ScenarioState {
  const lastTyphoon = catalog.typhoons.at(-1);
  if (!lastTyphoon) {
    throw new Error('catalog.typhoons is empty');
  }
  const scenarioId = lastTyphoon.scenario_ids.at(-1);
  if (!scenarioId) {
    throw new Error(
      `catalog.typhoons[${lastTyphoon.typhoon_id}].scenario_ids is empty`,
    );
  }
  const times = catalog.scenario_times.find(
    (t) =>
      t.typhoon_id === lastTyphoon.typhoon_id && t.scenario_id === scenarioId,
  );
  if (!times) {
    throw new Error(
      `scenario_times not found for ${lastTyphoon.typhoon_id}/${scenarioId}`,
    );
  }
  return {
    catalog,
    typhoonId: lastTyphoon.typhoon_id,
    scenarioId,
    timestamp: nearestHourlyTimestamp(times.first_time, times.last_time),
  };
}
