import { BASEMAPS } from '@/features/map/basemap/constants/baseMaps';
import { useBasemap } from '@/features/map/basemap/hooks/useBasemap';

export function BasemapSelector() {
  const basemapId = useBasemap((s) => s.basemapId);
  const setBasemapId = useBasemap((s) => s.setBasemapId);

  return (
    <div className="absolute top-10 right-10 z-50 flex flex-col gap-[14px] bg-surface rounded-[12px] pt-3 pb-[10px] px-3 w-[114px] select-none">
      {BASEMAPS.map((baseMap) => (
        <button
          key={baseMap.id}
          onClick={() => setBasemapId(baseMap.id)}
          className={`flex items-center justify-center w-full h-[52px] rounded-[8px] cursor-pointer text-[16px] transition-all ${
            basemapId === baseMap.id
              ? 'bg-foreground-active border border-primary shadow-md text-foreground font-bold'
              : 'bg-background border border-transparent text-foreground-muted font-medium hover:bg-background-hover'
          }`}
        >
          {baseMap.label}
        </button>
      ))}
    </div>
  );
}
