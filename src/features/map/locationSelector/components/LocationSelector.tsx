import {
  KOREA_LOCATION_ID,
  PORTS,
} from '@/features/map/locationSelector/constants/locations';
import { useLocationStore } from '@/features/map/locationSelector/store/locationStore';

/**
 * 항구 셀렉터. 항구/전국을 선택하면 locationStore를 갱신하고,
 * 실제 지도 이동은 useLocationNavigation이 담당한다(MapView에서 호출).
 * 디자인은 구 koos-front의 MapLocationSelector를 포팅.
 */
export function LocationSelector() {
  const activeId = useLocationStore((s) => s.location.id);
  const setLocation = useLocationStore((s) => s.setLocation);
  const isNational = activeId === KOREA_LOCATION_ID;

  return (
    <div className="absolute top-10 left-10 z-[1000] flex items-center gap-6 bg-[rgba(44,46,52,0.8)] rounded-[12px] p-3 select-none">
      <div className="flex gap-4 items-center">
        {PORTS.map((loc) => {
          const active = activeId === loc.id;
          return (
            <button
              key={loc.id}
              onClick={() => setLocation(loc.id)}
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
        onClick={() => setLocation(KOREA_LOCATION_ID)}
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
