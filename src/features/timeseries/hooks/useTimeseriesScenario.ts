import { useMemo } from 'react';
import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import { useTimeseriesCatalog } from '@/features/timeseries/hooks/useTimeseriesCatalog';
import { useTimeseriesScenarioStore } from '@/features/timeseries/store/timeseriesScenarioStore';
import type { SelectedStation } from '@/features/timeseries/types';

export interface TyphoonOption {
  id: string;
  name: string;
}

export interface TimeseriesScenarioControls {
  typhoonId: string;
  scenarioId: string;
  typhoonOptions: TyphoonOption[];
  scenarioOptions: string[];
  selectTyphoon: (nextTyphoonId: string) => void;
  selectScenario: (nextScenarioId: string) => void;
}

/**
 * 시계열 모달이 쓰는 "유효 태풍/시나리오 + 선택지 + setter"를 한 곳에서 계산한다.
 * 전역 scenario store는 read-only(초기값·태풍 이름)로만 참조하고, 선택 변경은 station 단위로
 * timeseriesScenarioStore(로컬 오버라이드)에만 기록한다 — 지도 전역 상태는 절대 바뀌지 않는다.
 *
 * - 선택지: timeseries 카탈로그의 해당 region(`region.typhoons` / 선택 태풍의 `scenario_ids`).
 * - 태풍 이름: 전역 subset 카탈로그에서 resolve(없으면 region 이름 → id).
 * - 유효값: overrides[`${regionKey}:${id}`] ?? 전역 store 값.
 */
export function useTimeseriesScenario(
  selected: SelectedStation | null,
): TimeseriesScenarioControls {
  const subsetCatalog = useScenario((s) => s.catalog);
  const globalTyphoonId = useScenario((s) => s.typhoonId);
  const globalScenarioId = useScenario((s) => s.scenarioId);
  const tsCatalog = useTimeseriesCatalog();
  const overrides = useTimeseriesScenarioStore((s) => s.overrides);
  const setOverride = useTimeseriesScenarioStore((s) => s.setOverride);

  const key = selected ? `${selected.regionKey}:${selected.id}` : '';

  const region = useMemo(
    () =>
      selected
        ? tsCatalog?.regions.find((r) => r.region_key === selected.regionKey)
        : undefined,
    [tsCatalog, selected],
  );

  const override = overrides[key];
  const typhoonId = override?.typhoonId ?? globalTyphoonId;
  const scenarioId = override?.scenarioId ?? globalScenarioId;

  const typhoonOptions = useMemo<TyphoonOption[]>(
    () =>
      (region?.typhoons ?? []).map((t) => ({
        id: t.typhoon_id,
        name:
          subsetCatalog.typhoons.find((s) => s.typhoon_id === t.typhoon_id)
            ?.typhoon_name ??
          t.typhoon_name ??
          t.typhoon_id,
      })),
    [region, subsetCatalog],
  );

  const scenarioOptions = useMemo(
    () =>
      region?.typhoons.find((t) => t.typhoon_id === typhoonId)?.scenario_ids ??
      [],
    [region, typhoonId],
  );

  const selectTyphoon = (nextTyphoonId: string) => {
    if (!key) return;
    const nextTyphoon = region?.typhoons.find(
      (t) => t.typhoon_id === nextTyphoonId,
    );
    // 태풍을 바꾸면 그 태풍의 마지막 시나리오를 기본값으로 잡는다(전역 selectTyphoon과 동일 규칙).
    const nextScenarioId = nextTyphoon?.scenario_ids.at(-1) ?? scenarioId;
    setOverride(key, { typhoonId: nextTyphoonId, scenarioId: nextScenarioId });
  };

  const selectScenario = (nextScenarioId: string) => {
    if (!key) return;
    setOverride(key, { typhoonId, scenarioId: nextScenarioId });
  };

  return {
    typhoonId,
    scenarioId,
    typhoonOptions,
    scenarioOptions,
    selectTyphoon,
    selectScenario,
  };
}
