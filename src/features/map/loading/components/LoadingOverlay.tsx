import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { useLocationStore } from '@/features/map/locationSelector/store/locationStore';
import { directionParticle } from '@/features/map/locationSelector/lib/particle';
import { useLoadingStatus } from '@/features/map/loading/hooks/useLoadingStatus';
import { loadViewKey } from '@/features/map/loading/types';
import { SELECTABLE_LAYER_SPECS } from '@/features/layers/core/registry';

/**
 * 현재 location+timestamp 기준으로 visible 데이터 레이어가 모두 로드되기 전까지
 * "OO(으)로 이동 중..." 전체화면 오버레이를 보여준다(구 koos-front 디자인 포팅).
 * location/timestamp가 바뀌면 새 버킷이 비어 자동으로 다시 떠오른다(별도 reset 없음).
 */
export function LoadingOverlay() {
  const timestamp = useScenario((s) => s.timestamp);
  const location = useLocationStore((s) => s.location);
  const visibility = useLayerStore((s) => s.layers);
  const loadedForView = useLoadingStatus(
    (s) => s.loaded[loadViewKey(location.urlKey, timestamp)],
  );

  const visibleLayers = SELECTABLE_LAYER_SPECS.filter(
    (spec) => visibility[spec.id],
  );
  const allLoaded = visibleLayers.every((spec) =>
    Boolean(loadedForView?.[spec.id]),
  );

  if (visibleLayers.length === 0 || allLoaded) return null;

  const label = location.label;

  return (
    <div className="fixed inset-0 z-[2000] bg-[#000012] flex items-center justify-center select-none">
      <p className="text-[20px] font-bold tracking-tight">
        <span className="text-[#2b68d6]">{label}</span>
        <span className="text-white ml-[0.2rem]">
          {directionParticle(label)} 이동 중...
        </span>
      </p>
    </div>
  );
}
