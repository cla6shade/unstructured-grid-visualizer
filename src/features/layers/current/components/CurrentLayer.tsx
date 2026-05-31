import { useCallback } from 'react';
import { useDeckLayersRegistry } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useVectorSurface } from '@/features/vector/hooks/useVectorSurface';
import {
  useFlowLines,
  type FlowSegments,
} from '@/features/vector/hooks/useFlowLines';
import { createFlowLayer } from '@/features/vector/lib/createFlowLayer';
import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { currentFetcher } from '../lib/currentFetcher';

const CURRENT_LAYER_ID = 'current-flow-lines';
// contour mesh(z=10) 위에 흐름선을 올린다.
const CURRENT_Z = 20;

/**
 * Current(해류) 레이어. mesh의 (u, v) 속도장을 barycentric 보간해 파티클을 흘려보내고,
 * 그 잔상을 LineLayer로 매 프레임 그리는 흐름 애니메이션으로 표출한다.
 *
 * 흐름은 매 프레임 새 버퍼를 내므로 React state/useMemo를 거치지 않고 rAF 루프에서
 * registry에 직접 upsert한다(컴포넌트 리렌더 회피). 보이지 않거나 언마운트되면 remove.
 * <Map> 안의 DeckOverlayProvider 자식으로 두어야 한다.
 */
export function CurrentLayer() {
  const mesh = useVectorSurface(currentFetcher);
  const visible = useLayerStore((s) => s.layers.current);
  const registry = useDeckLayersRegistry();

  const onSegments = useCallback(
    (segments: FlowSegments | null) => {
      if (segments) {
        registry.upsertLayerGroup(
          CURRENT_LAYER_ID,
          [createFlowLayer({ id: CURRENT_LAYER_ID, segments, visible: true })],
          CURRENT_Z,
        );
      } else {
        registry.removeLayerGroup(CURRENT_LAYER_ID);
      }
    },
    [registry],
  );

  useFlowLines(mesh, visible, onSegments);

  return null;
}
