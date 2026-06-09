import type { EChartsCoreOption } from 'echarts/core';
import type {
  CustomSeriesRenderItemParams,
  CustomSeriesRenderItemAPI,
  CustomSeriesRenderItemReturn,
} from 'echarts';
import { parseKstNaive } from '@/lib/timeUtils';
import { formatKstLabel } from '@/features/timeseries/lib/currentTimeMarkLine';
import { MODEL_COLOR, AXIS_LINE, AXIS_LABEL } from '@/features/timeseries/lib/buildLineOption';
import type { TimeseriesPoint } from '@/features/timeseries/types';

/** 화면에 그릴 최대 stick 개수(다운샘플 목표). */
const TARGET_STICKS = 80;
/** maxSpeed에 대응하는 stick 픽셀 길이. */
const MAX_PX = 34;

interface Combined {
  ms: number;
  speed: number;
  /** 라디안. 0 = 동(+x), 북(+v) = 화면 위. */
  angle: number;
}

/** U/V 시계열을 t 기준으로 결합해 {ms, speed, angle} 배열로. (격자 어긋남 방어용 Map 매칭) */
function combineUV(
  uPoints: TimeseriesPoint[],
  vPoints: TimeseriesPoint[],
): Combined[] {
  const vByT = new Map(vPoints.map((p) => [p.t, p.value]));
  const out: Combined[] = [];
  for (const up of uPoints) {
    const v = vByT.get(up.t);
    if (v == null) continue;
    const u = up.value;
    out.push({
      ms: parseKstNaive(up.t.replace(' ', 'T')),
      speed: Math.hypot(u, v),
      angle: Math.atan2(v, u),
    });
  }
  return out;
}

/** 결합 배열의 최대 speed(0이면 1로 클램프). 헤더 스케일 힌트로도 쓰임. */
export function maxSpeedOf(
  uPoints: TimeseriesPoint[],
  vPoints: TimeseriesPoint[],
): number {
  const combined = combineUV(uPoints, vPoints);
  return combined.reduce((m, c) => Math.max(m, c.speed), 0);
}

/**
 * U/V 시계열 → feather(stick) 차트 option. 시간축 위 baseline(y=0)에서 각 시점의 속도 벡터를
 * 막대로 그린다: 방향 = atan2(V,U), 길이 ∝ hypot(U,V). 막대는 **픽셀 공간**에 그려 축 스케일과
 * 무관하게 각도를 시각적으로 보존한다.
 */
export function buildFeatherOption(
  uPoints: TimeseriesPoint[],
  vPoints: TimeseriesPoint[],
  model: string,
  currentMs: number | null,
): EChartsCoreOption {
  const color = MODEL_COLOR[model] ?? '#9aa0a6';
  const combined = combineUV(uPoints, vPoints);
  const maxSpeed = combined.reduce((m, c) => Math.max(m, c.speed), 0) || 1;

  const step = Math.max(1, Math.ceil(combined.length / TARGET_STICKS));
  // data 항목: [ms, 0(baseline), speed, angle]
  const data = combined
    .filter((_, i) => i % step === 0)
    .map((c) => [c.ms, 0, c.speed, c.angle]);

  return {
    animation: false,
    grid: { top: 20, right: 16, bottom: 28, left: 48 },
    tooltip: {
      trigger: 'item',
      formatter: (p: { value: number[] }) => {
        const [ms, , speed, angle] = p.value;
        const deg = (angle * 180) / Math.PI;
        const bearing = ((90 - deg) % 360 + 360) % 360;
        return `${formatKstLabel(ms)}<br/>유속 ${speed.toFixed(2)} m/s<br/>방향 ${bearing.toFixed(0)}°`;
      },
    },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: AXIS_LINE } },
      axisLabel: { color: AXIS_LABEL, hideOverlap: true },
    },
    yAxis: { type: 'value', min: -1, max: 1, show: false },
    dataZoom: [{ type: 'inside' }],
    series: [
      {
        type: 'custom',
        coordinateSystem: 'cartesian2d',
        encode: { x: 0, y: 1 },
        data,
        renderItem: (
          _params: CustomSeriesRenderItemParams,
          api: CustomSeriesRenderItemAPI,
        ): CustomSeriesRenderItemReturn => {
          const ms = api.value(0) as number;
          const speed = api.value(2) as number;
          const angle = api.value(3) as number;
          const base = api.coord([ms, 0]);
          const L = (speed / maxSpeed) * MAX_PX;
          return {
            type: 'line',
            shape: {
              x1: base[0],
              y1: base[1],
              x2: base[0] + L * Math.cos(angle),
              y2: base[1] - L * Math.sin(angle),
            },
            style: { stroke: color, lineWidth: 1.5 },
          };
        },
        markLine: {
          symbol: 'none',
          silent: true,
          data: [
            // 중앙 가로 baseline
            {
              yAxis: 0,
              lineStyle: { color: '#3a3c42', width: 1 },
              label: { show: false },
            },
            // 현재 시각 세로선 + 라벨(그리드 안쪽에 그려 클리핑 방지)
            ...(currentMs == null
              ? []
              : [
                  {
                    xAxis: currentMs,
                    lineStyle: {
                      color: '#e7eaef',
                      type: 'dashed' as const,
                      width: 1,
                    },
                    label: {
                      show: true,
                      position: 'insideEndTop' as const,
                      formatter: () => formatKstLabel(currentMs),
                      color: '#e7eaef',
                      backgroundColor: '#212226cc',
                      padding: [2, 4] as [number, number],
                      borderRadius: 3,
                      fontSize: 10,
                    },
                  },
                ]),
          ],
        },
      },
    ],
  };
}
