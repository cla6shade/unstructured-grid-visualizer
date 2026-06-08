import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { useLocationStore } from '@/features/map/locationSelector/store/locationStore';
import {
  KOREA_LOCATION_ID,
  LOCATIONS,
} from '@/features/map/locationSelector/constants/locations';
import { directionParticle } from '@/features/map/locationSelector/lib/particle';
import { useLoadingStatus } from '@/features/map/loading/hooks/useLoadingStatus';
import { loadViewKey } from '@/features/map/loading/types';
import {
  InitialLoadingScreen,
  CATALOG_ROW,
  type LoadingRow,
} from '@/features/map/loading/components/InitialLoadingScreen';
import { SELECTABLE_LAYER_SPECS } from '@/features/layers/core/registry';

/**
 * 로딩/이동 화면.
 * - 항구로 이동 요청(클릭) 시: store.pending이 즉시 세팅되어 "OO(으)로 이동 중..."을
 *   바로 띄운다(실제 카메라 이동은 1초 뒤). 도착·로드가 끝나면 사라진다.
 * - 데이터 로드 체크리스트는 **앱 최초 데이터 로드 시에만** 띄운다. 이후 타임스탬프
 *   스크럽이나 팬·줌으로는 다시 뜨지 않는다(hasInitialLoaded 게이트).
 * - 항구로의 클릭 이동 화면("OO(으)로 이동 중...")은 초기 로드 여부와 무관하게 유지한다.
 */
export function LoadingOverlay() {
  const timestamp = useScenario((s) => s.timestamp);
  const location = useLocationStore((s) => s.location);
  const pending = useLocationStore((s) => s.pending);
  const byClick = useLocationStore((s) => s.byClick);
  const visibility = useLayerStore((s) => s.layers);
  const loadedForView = useLoadingStatus(
    (s) => s.loaded[loadViewKey(location.urlKey, timestamp)],
  );
  const hasInitialLoaded = useLoadingStatus((s) => s.hasInitialLoaded);
  const markInitialLoaded = useLoadingStatus((s) => s.markInitialLoaded);

  // 이동 요청 중인 항구가 있으면 즉시 "이동 중"(1초 대기 + 도착 전까지).
  const pendingPort =
    pending && pending !== KOREA_LOCATION_ID
      ? LOCATIONS.find((l) => l.id === pending)
      : null;
  if (pendingPort) return <MovingOverlay label={pendingPort.label} />;

  const visibleLayers = SELECTABLE_LAYER_SPECS.filter(
    (spec) => visibility[spec.id],
  );
  const allLoaded = visibleLayers.every((spec) =>
    Boolean(loadedForView?.[spec.id]),
  );

  if (visibleLayers.length === 0) return null;
  if (allLoaded) {
    // 현재 뷰가 전부 로드되면 최초 1회 초기 로드 완료를 마킹한다(멱등).
    markInitialLoaded();
    return null;
  }

  // 클릭으로 이동한 항구만: 도착 후 데이터 로딩 중에도 "OO(으)로 이동 중..." 유지.
  if (location.id !== KOREA_LOCATION_ID && byClick) {
    return <MovingOverlay label={location.label} />;
  }

  // 데이터 로드 체크리스트는 '초기 데이터 로드 시'에만 노출한다.
  if (hasInitialLoaded) return null;

  // 최초 로드: 데이터 로딩 진행을 체크리스트로 표시('이동 중' 문구 없이).
  const rows: LoadingRow[] = [
    { ...CATALOG_ROW, loaded: true },
    ...visibleLayers.map((spec) => ({
      id: spec.id,
      label: spec.label,
      loaded: Boolean(loadedForView?.[spec.id]),
    })),
  ];
  return <InitialLoadingScreen rows={rows} />;
}

function MovingOverlay({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-[2000] bg-map-canvas flex items-center justify-center select-none">
      <p className="text-xl font-bold tracking-tight">
        <span className="text-primary">{label}</span>
        <span className="text-white ml-[0.2rem]">
          {directionParticle(label)} 이동 중...
        </span>
      </p>
    </div>
  );
}
