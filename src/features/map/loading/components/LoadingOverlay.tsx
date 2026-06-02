import { useScenario } from '@/features/map/scenario/hooks/useScenario';
import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { useLoadingStatus } from '@/features/map/loading/hooks/useLoadingStatus';
import {
  InitialLoadingScreen,
  CATALOG_ROW,
  type LoadingRow,
} from '@/features/map/loading/components/InitialLoadingScreen';
import { SELECTABLE_LAYER_SPECS } from '@/features/layers/core/registry';

/**
 * 현재 timestamp 기준으로 visible한 데이터 레이어의 초기 로드 진행을 전체화면으로 보여준다.
 * 모든 visible 레이어가 완료되면 null을 반환해 사라진다. timestamp가 바뀌면 새 버킷이 비어
 * 자동으로 다시 떠오른다(별도 reset 없음).
 */
export function LoadingOverlay() {
  const timestamp = useScenario((s) => s.timestamp);
  const visibility = useLayerStore((s) => s.layers);
  const loadedForTs = useLoadingStatus((s) => s.loaded[timestamp]);

  const layerRows: LoadingRow[] = SELECTABLE_LAYER_SPECS.filter(
    (spec) => visibility[spec.id],
  ).map((spec) => ({
    id: spec.id,
    label: spec.label,
    loaded: Boolean(loadedForTs?.[spec.id]),
  }));

  // suspense를 지난 시점이라 카탈로그는 항상 완료. 레이어와 동일한 행으로 함께 보여준다.
  const rows: LoadingRow[] = [{ ...CATALOG_ROW, loaded: true }, ...layerRows];

  if (layerRows.length === 0 || rows.every((row) => row.loaded)) return null;

  return <InitialLoadingScreen rows={rows} />;
}
