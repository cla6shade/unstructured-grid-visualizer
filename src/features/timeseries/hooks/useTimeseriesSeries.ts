import { useQueries } from '@tanstack/react-query';
import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import { useTimeseriesCatalog } from '@/features/timeseries/hooks/useTimeseriesCatalog';
import { fetchTimeseriesSeries } from '@/features/timeseries/lib/fetchTimeseriesSeries';
import type {
  SelectedStation,
  TimeseriesPoint,
  TimeseriesVariable,
} from '@/features/timeseries/types';

export interface VariableSeries {
  variable: TimeseriesVariable;
  points: TimeseriesPoint[];
  isLoading: boolean;
  isError: boolean;
}

/**
 * 선택된 station의 region에 대한 catalog 변수 전체를 병렬로 받아온다.
 * region 변수 목록은 catalog에서 selected.regionKey로 찾는다. station/typhoon/scenario 단위로
 * URL 불변이라 staleTime: Infinity. 404(해당 station에 없는 변수)는 points=[] (isError 아님).
 */
export function useTimeseriesSeries(
  selected: SelectedStation | null,
): VariableSeries[] {
  const catalog = useTimeseriesCatalog();
  const typhoonId = useScenario((s) => s.typhoonId);
  const scenarioId = useScenario((s) => s.scenarioId);

  const region = selected
    ? catalog?.regions.find((r) => r.region_key === selected.regionKey)
    : undefined;
  const variables = region?.variables ?? [];

  const results = useQueries({
    queries: variables.map((variable) => ({
      queryKey: [
        'timeseries',
        selected?.regionKey,
        typhoonId,
        scenarioId,
        selected?.id,
        variable.id,
      ],
      queryFn: () =>
        fetchTimeseriesSeries({
          region: selected!.regionKey,
          typhoonId,
          scenarioId,
          station: selected!.id,
          variable: variable.id,
        }),
      enabled: !!selected,
      staleTime: Infinity,
    })),
  });

  return variables.map((variable, i) => {
    const r = results[i];
    return {
      variable,
      points: r.data?.points ?? [],
      isLoading: r.isPending,
      isError: r.isError,
    };
  });
}
