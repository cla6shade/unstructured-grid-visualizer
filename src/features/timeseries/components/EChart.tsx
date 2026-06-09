import { useEffect, useRef } from 'react';
import type { EChartsCoreOption, EChartsType } from 'echarts/core';
import { echarts } from '@/features/timeseries/lib/echartsSetup';

interface EChartProps {
  option: EChartsCoreOption;
  className?: string;
}

/**
 * echarts/core 인스턴스를 div에 붙이는 얇은 React 래퍼.
 * setOption(merge 아님: notMerge)으로 option 변경을 반영하고, ResizeObserver로 리사이즈,
 * unmount 시 dispose한다. (echarts-for-react 미사용 — 의존성 최소화.)
 */
export function EChart({ option, className }: EChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsType | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = echarts.init(el);
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div ref={containerRef} className={className} />;
}
