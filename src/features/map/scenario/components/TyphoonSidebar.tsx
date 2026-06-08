import { useMemo, useState } from 'react';
import { PanelLeftClose, Search } from 'lucide-react';
import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import { useScenarioSelection } from '@/features/map/scenario/hooks/useScenarioSelection';
import { useTyphoonSidebarStore } from '@/features/map/scenario/store/typhoonSidebarStore';
import {
  listTyphoonYears,
  typhoonYear,
} from '@/features/map/scenario/lib/typhoonYear';
import { YearPicker } from './YearPicker';

/**
 * 왼쪽 태풍 검색 사이드바(사이드바.svg). 이름 검색 + 연도 필터로 태풍을 찾아 선택한다.
 * 열림 상태는 typhoonSidebarStore가 전역으로 관리(상단 바 토글 버튼과 연동).
 */
export function TyphoonSidebar() {
  const catalog = useScenario((s) => s.catalog);
  const typhoonId = useScenario((s) => s.typhoonId);
  const open = useTyphoonSidebarStore((s) => s.open);
  const close = useTyphoonSidebarStore((s) => s.close);
  const { selectTyphoon } = useScenarioSelection();

  const [query, setQuery] = useState('');
  const [year, setYear] = useState<number | null>(null);

  const years = useMemo(() => listTyphoonYears(catalog), [catalog]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.typhoons.filter((t) => {
      if (year !== null && typhoonYear(t.typhoon_id) !== year) return false;
      if (q && !t.typhoon_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [catalog, query, year]);

  const handleSelect = (id: string) => {
    selectTyphoon(id);
    close();
  };

  return (
    <aside
      className={`absolute top-0 left-0 h-dvh w-90 z-[1100] bg-map-surface-deep flex flex-col transition-transform duration-300 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col gap-4 px-8 pt-8 pb-4">
        <button
          onClick={close}
          aria-label="사이드바 닫기"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-light text-map-icon cursor-pointer transition-all hover:brightness-95"
        >
          <PanelLeftClose size={24} />
        </button>

        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-map-content-subtle pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="태풍 이름 검색"
            className="w-full h-10 rounded-[8px] bg-surface-light pl-11 pr-4 text-base font-medium text-map-icon placeholder:text-map-content-subtle focus:outline-none"
          />
        </div>

        <YearPicker value={year} options={years} onChange={setYear} />
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {filtered.length === 0 ? (
          <p className="py-3 text-base text-map-content-subtle">
            검색 결과가 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col">
            {filtered.map((t) => {
              const isSelected = t.typhoon_id === typhoonId;
              return (
                <li key={t.typhoon_id}>
                  <button
                    onClick={() => handleSelect(t.typhoon_id)}
                    className={`flex w-full items-baseline gap-2 py-3 text-left text-base cursor-pointer transition-colors ${
                      isSelected
                        ? 'text-foreground font-bold'
                        : 'text-map-content-muted font-medium hover:text-foreground'
                    }`}
                  >
                    <span className="truncate">{t.typhoon_name}</span>
                    <span className="shrink-0 text-sm text-map-content-subtle">
                      {t.typhoon_id}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
