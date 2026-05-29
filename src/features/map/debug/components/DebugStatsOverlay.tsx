import { useDebugStatsStore } from '@/features/map/debug/store/debugStatsStore';

const LABELS: Record<string, string> = {
  freeSurface: '자유수면',
  waterDepth: '수심',
};

export function DebugStatsOverlay() {
  const stats = useDebugStatsStore((s) => s.stats);
  const entries = Object.entries(stats);

  return (
    <div className="absolute top-10 left-10 z-[1000] flex flex-col gap-1 bg-[rgba(44,46,52,0.85)] rounded-[8px] px-3 py-2 text-[12px] text-[#e7eaef] font-mono select-none pointer-events-none">
      <div className="text-[#bcbfc5] mb-1">값 범위 (디버그)</div>
      {entries.length === 0 && <div className="text-[#7b7f84]">데이터 없음</div>}
      {entries.map(([layerId, s]) => (
        <div key={layerId} className="flex gap-2">
          <span className="text-white">
            {LABELS[layerId] ?? layerId}[{s.key}]
          </span>
          <span>
            min={s.min.toFixed(3)} max={s.max.toFixed(3)}
          </span>
          <span className="text-[#7b7f84]">
            ({s.nonZeroCount}/{s.count})
          </span>
        </div>
      ))}
    </div>
  );
}
