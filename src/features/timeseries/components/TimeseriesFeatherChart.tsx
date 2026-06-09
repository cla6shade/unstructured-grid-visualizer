import { useMemo } from 'react';
import { EChart } from '@/features/timeseries/components/EChart';
import {
  buildFeatherOption,
  maxSpeedOf,
} from '@/features/timeseries/lib/buildFeatherOption';
import type { VariableSeries } from '@/features/timeseries/hooks/useTimeseriesData';

interface TimeseriesFeatherChartProps {
  label: string;
  uSeries: VariableSeries;
  vSeries: VariableSeries;
  /** 현재 시나리오 timestamp(epoch ms). */
  currentMs: number | null;
}

/**
 * U/V 속도 벡터를 feather(stick) 차트로 그린다. 방향=atan2(V,U), 길이∝hypot(U,V).
 * 두 채널 중 하나라도 로딩이면 placeholder, 결합 데이터가 없으면 "데이터 없음".
 */
export function TimeseriesFeatherChart({
  label,
  uSeries,
  vSeries,
  currentMs,
}: TimeseriesFeatherChartProps) {
  const isLoading = uSeries.isLoading || vSeries.isLoading;
  const isError = uSeries.isError || vSeries.isError;

  const option = useMemo(
    () =>
      buildFeatherOption(
        uSeries.points,
        vSeries.points,
        uSeries.variable.model,
        currentMs,
      ),
    [uSeries.points, vSeries.points, uSeries.variable.model, currentMs],
  );

  const maxSpeed = useMemo(
    () => maxSpeedOf(uSeries.points, vSeries.points),
    [uSeries.points, vSeries.points],
  );

  const hasData = uSeries.points.length > 0 && vSeries.points.length > 0;

  return (
    <div className="flex flex-col gap-1 rounded-[8px] bg-map-surface p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-map-content-faint">{label}</span>
        {hasData && (
          <span className="text-[10px] text-map-content-subtle">
            최대 {maxSpeed.toFixed(2)} m/s
          </span>
        )}
      </div>
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
