import { useDebugStatsStore } from '@/features/map/debug/store/debugStatsStore';

const LABELS: Record<string, string> = {
  freeSurface: '자유수면',
  waterDepth: '수심',
  current: '해류',
};

export function DebugStatsOverlay() {
  const stats = useDebugStatsStore((s) => s.stats);
  const entries = Object.entries(stats);

  return (
    <div className="flex flex-col gap-1 bg-background/85 rounded-[8px] px-3 py-2 text-xs text-foreground-muted font-mono select-none pointer-events-none">
      <div className="text-map-content-faint mb-1">값 범위 (디버그)</div>
      {entries.length === 0 && <div className="text-map-icon-muted">데이터 없음</div>}
      {entries.map(([layerId, s]) => (
        <div key={layerId} className="flex gap-2">
          <span className="text-white">
            {LABELS[layerId] ?? layerId}[{s.key}]
          </span>
          <span>
            min={s.min.toFixed(3)} max={s.max.toFixed(3)}
          </span>
          <span className="text-map-icon-muted">
            ({s.nonZeroCount}/{s.count})
          </span>
        </div>
      ))}
    </div>
  );
}
