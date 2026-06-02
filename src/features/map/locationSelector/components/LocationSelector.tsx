import {
  KOREA_LOCATION_ID,
  PORTS,
  type LocationId,
} from '@/features/map/locationSelector/constants/locations';
import { useLocationStore } from '@/features/map/locationSelector/store/locationStore';

interface LocationSelectorProps {
  onSelect: (id: LocationId) => void;
}

/**
 * 항구 셀렉터(좌상단 고정 컨트롤). 항구/전국 클릭 시 onSelect로 카메라 이동을 요청한다.
 * 현재 active 하이라이트는 뷰포트가 구동하는 locationStore.location을 그대로 반영.
 * 디자인은 구 koos-front의 MapLocationSelector를 포팅.
 */
export function LocationSelector({ onSelect }: LocationSelectorProps) {
  const activeId = useLocationStore((s) => s.location.id);
  const isNational = activeId === KOREA_LOCATION_ID;

  return (
    <div className="absolute top-10 left-10 z-[1000] flex items-center gap-6 bg-[rgba(44,46,52,0.8)] rounded-[12px] p-3 select-none">
      <div className="flex gap-4 items-center">
        {PORTS.map((loc) => {
          const active = activeId === loc.id;
          return (
            <button
              key={loc.id}
              onClick={() => onSelect(loc.id)}
              disabled={active}
              className={`w-[60px] h-[60px] rounded-full text-[20px] text-[#e7eaef] transition-all ${
                active
                  ? 'bg-[#2b68d6] font-bold cursor-default'
                  : 'bg-[rgba(44,46,52,0.8)] font-medium cursor-pointer hover:bg-[#3a3c42]'
              }`}
            >
              {loc.label}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onSelect(KOREA_LOCATION_ID)}
        disabled={isNational}
        className={`h-[60px] w-[161px] rounded-[120px] text-[20px] transition-all ${
          isNational
            ? 'bg-[#2b68d6] text-white font-bold cursor-default'
            : 'bg-[rgba(44,46,52,0.8)] text-[#e7eaef] font-medium cursor-pointer hover:bg-[#3a3c42]'
        }`}
      >
        전국 지도 보기
      </button>
    </div>
  );
}
