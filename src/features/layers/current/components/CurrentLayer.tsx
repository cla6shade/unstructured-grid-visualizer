import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { useFlowLayerGroup } from '@/features/layers/shared/hooks/useFlowLayerGroup';
import { currentFetcher } from '@/features/layers/current/lib/currentFetcher';
import { CURRENT_SPEED_LUT } from '@/features/layers/current/constants/currentScale';
import {
  SELECTABLE_LAYER_SPECS,
  type LayerId,
} from '@/features/layers/shared/registry';

export function CurrentLayer() {
  const layers = useLayerStore((s) => s.layers);
  // current 단독(다른 선택 레이어 전부 off)일 때만 유속→색 LUT를 입힌다.
  const onlyCurrent = SELECTABLE_LAYER_SPECS.every(
    (s) => layers[s.id as LayerId] === (s.id === 'current'),
  );
  useFlowLayerGroup(currentFetcher, {
    id: 'current',
    layerName: 'current-flow-lines',
    zIndex: 20,
    speedColorLut: onlyCurrent ? CURRENT_SPEED_LUT : null,
  });
  return null;
}
