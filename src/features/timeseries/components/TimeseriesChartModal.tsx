import { useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import { useTimeseriesCatalog } from '@/features/timeseries/hooks/useTimeseriesCatalog';
import { useTimeseriesSeries } from '@/features/timeseries/hooks/useTimeseriesSeries';
import { useTimeseriesSelectionStore } from '@/features/timeseries/store/timeseriesSelectionStore';
import { TimeseriesVariableChart } from '@/features/timeseries/components/TimeseriesVariableChart';
import { TimeseriesFeatherChart } from '@/features/timeseries/components/TimeseriesFeatherChart';
import { partitionVectorPairs } from '@/features/timeseries/lib/vectorPairs';

/** model 표시 순서·한글 라벨. */
const MODEL_ORDER = ['SURGE', 'TIDE', 'WAVE'] as const;
const MODEL_LABEL: Record<string, string> = {
  SURGE: '폭풍해일',
  TIDE: '조석',
  WAVE: '파랑',
};

/**
 * station 클릭 시 그 지점에서 요청 가능한 모든 변수의 시계열 그래프를 중앙 모달에 띄운다.
 * selected가 null이면 아무것도 렌더하지 않는다. backdrop 클릭·X·Esc로 닫는다.
 */
export function TimeseriesChartModal() {
  const selected = useTimeseriesSelectionStore((s) => s.selected);
  const clear = useTimeseriesSelectionStore((s) => s.clear);
  const catalog = useTimeseriesCatalog();
  const timestamp = useScenario((s) => s.timestamp);

  const series = useTimeseriesSeries(selected);

  const currentMs = useMemo(() => {
    const ms = timestamp ? new Date(timestamp).getTime() : NaN;
    return Number.isNaN(ms) ? null : ms;
  }, [timestamp]);

  // Esc로 닫기.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clear();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, clear]);

  if (!selected) return null;

  const region = catalog?.regions.find(
    (r) => r.region_key === selected.regionKey,
  );

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-8"
      onClick={clear}
    >
      <div
        className="flex max-h-[85vh] w-[min(1100px,92vw)] flex-col rounded-[12px] bg-map-surface-deep shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-4 border-b border-[#33353b] px-6 py-4">
          <div className="flex flex-col">
            <span className="text-base font-medium text-map-content">
              {selected.id}
            </span>
            <span className="text-xs text-map-content-faint">
              {region?.label ?? selected.regionKey} · 시계열
            </span>
          </div>
          <button
            type="button"
            onClick={clear}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-light text-map-icon cursor-pointer transition-all hover:brightness-95"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 본문: model별 그룹 */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {MODEL_ORDER.map((model) => {
            const group = series.filter((s) => s.variable.model === model);
            if (group.length === 0) return null;
            // U/V 벡터 쌍(유속)은 feather 하나로, 나머지는 line으로.
            const { pairs, singles } = partitionVectorPairs(group);
            return (
              <section key={model} className="mb-6 last:mb-0">
                <h3 className="mb-3 text-sm font-medium text-map-content-strong">
                  {MODEL_LABEL[model] ?? model}
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {singles.map((s) => (
                    <TimeseriesVariableChart
                      key={s.variable.id}
                      series={s}
                      currentMs={currentMs}
                    />
                  ))}
                  {pairs.map((p) => (
                    <div key={p.key} className="md:col-span-2">
                      <TimeseriesFeatherChart
                        label={p.label}
                        uSeries={p.u}
                        vSeries={p.v}
                        currentMs={currentMs}
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
