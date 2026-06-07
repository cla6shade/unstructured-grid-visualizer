import { useViewport } from '@/features/map/viewport/hooks/useViewport';

/** 현재 중심 좌표·줌·뷰포트 bounds를 보여주는 디버그 오버레이. */
export function ViewportStatsOverlay() {
  const center = useViewport((s) => s.center);
  const zoom = useViewport((s) => s.zoom);
  const bounds = useViewport((s) => s.bounds);

  return (
    <div className="flex flex-col gap-1 bg-background/85 rounded-[8px] px-3 py-2 text-xs text-foreground-muted font-mono select-none pointer-events-none">
      <div className="text-map-content-faint mb-1">뷰포트 (디버그)</div>
      <div className="flex gap-2">
        <span className="text-white">center</span>
        <span>
          {center.lng.toFixed(4)}, {center.lat.toFixed(4)}
        </span>
        <span className="text-map-icon-muted">z={zoom.toFixed(2)}</span>
      </div>
      <div className="flex gap-2">
        <span className="text-white">SW</span>
        <span>
          {bounds.sw.lng.toFixed(4)}, {bounds.sw.lat.toFixed(4)}
        </span>
      </div>
      <div className="flex gap-2">
        <span className="text-white">NE</span>
        <span>
          {bounds.ne.lng.toFixed(4)}, {bounds.ne.lat.toFixed(4)}
        </span>
      </div>
    </div>
  );
}
