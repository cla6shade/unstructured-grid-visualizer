import { useMemo } from 'react';
import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import { useScenarioSelection } from '@/features/map/scenario/hooks/useScenarioSelection';
import { useTyphoonSidebarStore } from '@/features/map/scenario/store/typhoonSidebarStore';
import { ScenarioIdPicker } from './ScenarioIdPicker';
import { TyphoonGlyph } from './TyphoonGlyph';

/**
 * 항구 셀렉터 위 상단 바(태풍정보.svg). 왼쪽부터 태풍 토글 버튼(사이드바 열기) +
 * 선택된 태풍명 + 시나리오 picker.
 */
export function TyphoonScenarioBar() {
  const catalog = useScenario((s) => s.catalog);
  const typhoonId = useScenario((s) => s.typhoonId);
  const scenarioId = useScenario((s) => s.scenarioId);
  const toggleSidebar = useTyphoonSidebarStore((s) => s.toggle);
  const { selectScenario } = useScenarioSelection();

  const typhoonName = useMemo(
    () =>
      catalog.typhoons.find((t) => t.typhoon_id === typhoonId)?.typhoon_name ??
      typhoonId,
    [catalog, typhoonId],
  );

  const scenarioOptions = useMemo(
    () =>
      catalog.typhoons.find((t) => t.typhoon_id === typhoonId)?.scenario_ids ??
      [],
    [catalog, typhoonId],
  );

  return (
    <div className="flex items-center gap-3 w-[355px] h-18 bg-surface rounded-[12px] px-3 select-none">
      <button
        onClick={toggleSidebar}
        aria-label="태풍 검색 열기"
        className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-light text-map-icon cursor-pointer shrink-0 transition-all hover:brightness-95"
      >
        <TyphoonGlyph size={28} />
      </button>
      <span className="flex-1 truncate text-xl font-bold text-foreground">
        {typhoonName}
      </span>
      <ScenarioIdPicker
        value={scenarioId}
        options={scenarioOptions}
        onChange={selectScenario}
      />
    </div>
  );
}
