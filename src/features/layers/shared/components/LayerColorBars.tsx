import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { LAYER_COLOR_BARS } from '@/features/layers/shared/colorBar';
import { ColorBar } from '@/features/layers/shared/components/ColorBar';
import { currentColorBarSpec } from '@/features/layers/current/constants/currentScale';
import {
  SELECTABLE_LAYER_SPECS,
  type LayerId,
} from '@/features/layers/shared/registry';

// 켜져 있는 레이어 중 컬러바 스펙이 정의된 것만 렌더한다. vector(flow) 레이어는
// 스펙이 없어 자동으로 제외되지만, current 단독일 때는 유속 컬러바를 따로 띄운다.
export function LayerColorBars() {
  const layers = useLayerStore((s) => s.layers);

  const visible = (Object.keys(LAYER_COLOR_BARS) as LayerId[]).filter(
    (id) => layers[id],
  );

  // current 단독(다른 선택 레이어 전부 off): 유속 컬러바를 라인 색과 함께 노출.
  const onlyCurrent = SELECTABLE_LAYER_SPECS.every(
    (s) => layers[s.id as LayerId] === (s.id === 'current'),
  );

  if (visible.length === 0 && !onlyCurrent) return null;

  return (
    <>
      {visible.map((id) => (
        <ColorBar key={id} spec={LAYER_COLOR_BARS[id]!} />
      ))}
      {onlyCurrent && <ColorBar key="current" spec={currentColorBarSpec} />}
    </>
  );
}
