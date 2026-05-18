import { BASEMAPS } from '@/features/map/basemap/constants/baseMaps';
import { useBasemap } from '@/features/map/basemap/hooks/useBasemap';

export function BasemapSelector() {
  const basemapId = useBasemap((s) => s.basemapId);
  const setBasemapId = useBasemap((s) => s.setBasemapId);

  return (
    <div className="absolute top-10 right-10 z-50 flex flex-col gap-[14px] bg-[rgba(44,46,52,0.8)] rounded-[12px] pt-3 pb-[10px] px-3 w-[114px] select-none">
      {BASEMAPS.map((baseMap) => (
        <button
          key={baseMap.id}
          onClick={() => setBasemapId(baseMap.id)}
          className={`flex items-center justify-center w-full h-[52px] rounded-[8px] cursor-pointer text-[16px] transition-all ${
            basemapId === baseMap.id
              ? 'bg-[#595b5f] border border-[#2b68d6] shadow-[0px_0px_12px_rgba(88,89,95,0.32)] text-white font-bold'
              : 'bg-[#2c2e34] border border-transparent text-[#e7eaef] font-medium hover:bg-[#3a3c42]'
          }`}
        >
          {baseMap.label}
        </button>
      ))}
    </div>
  );
}
