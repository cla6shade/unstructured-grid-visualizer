import { useQueries } from '@tanstack/react-query';
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
 *
 * typhoonId/scenarioId는 모달이 계산한 유효값(로컬 오버라이드 ?? 전역값)을 인자로 받는다 —
 * 전역 scenario store를 직접 읽지 않으므로 모달 안에서만 태풍/시나리오를 바꿀 수 있다.
 */
export function useTimeseriesSeries(
  selected: SelectedStation | null,
  typhoonId: string,
  scenarioId: string,
): VariableSeries[] {
  const catalog = useTimeseriesCatalog();

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
