import type { EChartsCoreOption } from 'echarts/core';
import { parseKstNaive } from '@/lib/timeUtils';
import { currentTimeMarkLine } from '@/features/timeseries/lib/currentTimeMarkLine';
import type { TimeseriesPoint } from '@/features/timeseries/types';

/** model별 라인 색. (SURGE 폭풍해일 / TIDE 조석 / WAVE 파랑) feather 차트와 공유. */
export const MODEL_COLOR: Record<string, string> = {
  SURGE: '#e2574c',
  TIDE: '#2b68d6',
  WAVE: '#2fb8a8',
};

/** 차트 축 색(line/feather 공유). */
export const AXIS_LINE = '#595b5f';
export const AXIS_LABEL = '#bcbfc5';

/** KST naive 문자열("2003-09-04 09:00:00")을 epoch ms로. parseKstNaive는 'T' 구분을 기대한다. */
function pointToTuple(p: TimeseriesPoint): [number, number] {
  return [parseKstNaive(p.t.replace(' ', 'T')), p.value];
}

/**
 * 변수 시계열 → echarts line option. x축은 time, 현재 시나리오 timestamp는 수직 markLine으로 표시.
 * @param currentMs 현재 timestamp(epoch ms) — markLine 위치. 없으면 생략.
 */
export function buildLineOption(
  points: TimeseriesPoint[],
  model: string,
  currentMs: number | null,
): EChartsCoreOption {
  const color = MODEL_COLOR[model] ?? '#9aa0a6';
  const data = points.map(pointToTuple);

  return {
    animation: false,
    grid: { top: 20, right: 16, bottom: 28, left: 48 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
    },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: AXIS_LINE } },
      axisLabel: { color: AXIS_LABEL, hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { show: true, lineStyle: { color: AXIS_LINE } },
      axisLabel: { color: AXIS_LABEL },
      splitLine: { lineStyle: { color: '#33353b' } },
    },
    dataZoom: [{ type: 'inside' }],
    series: [
      {
        type: 'line',
        data,
        showSymbol: false,
        sampling: 'lttb',
        lineStyle: { color, width: 1.5 },
        itemStyle: { color },
        markLine: currentTimeMarkLine(currentMs),
      },
    ],
  };
}
