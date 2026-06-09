import { useMemo } from 'react';
import { EChart } from '@/features/timeseries/components/EChart';
import { buildLineOption } from '@/features/timeseries/lib/buildLineOption';
import type { VariableSeries } from '@/features/timeseries/hooks/useTimeseriesSeries';

interface TimeseriesVariableChartProps {
  series: VariableSeries;
  /** 현재 시나리오 timestamp(epoch ms) — 차트에 수직선으로 표시. */
  currentMs: number | null;
}

/** 변수 한 개의 시계열 line 차트. 로딩/데이터 없음 상태를 차트 단위로 방어한다. */
export function TimeseriesVariableChart({
  series,
  currentMs,
}: TimeseriesVariableChartProps) {
  const { variable, points, isLoading, isError } = series;

  const option = useMemo(
    () => buildLineOption(points, variable.model, currentMs),
    [points, variable.model, currentMs],
  );

  const hasData = points.length > 0;

  return (
    <div className="flex flex-col gap-1 rounded-[8px] bg-map-surface p-3">
      <div className="text-xs text-map-content-faint">{variable.label}</div>
      <div className="relative h-44">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-xs text-map-content-subtle">
            불러오는 중…
          </div>
        ) : !hasData ? (
          <div className="flex h-full items-center justify-center text-xs text-map-content-subtle">
            {isError ? '불러오기 실패' : '데이터 없음'}
          </div>
        ) : (
          <EChart option={option} className="h-full w-full" />
        )}
      </div>
    </div>
  );
}
