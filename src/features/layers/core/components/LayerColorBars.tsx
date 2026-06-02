import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { LAYER_COLOR_BARS } from '@/features/layers/core/colorBar';
import { ColorBar } from '@/features/layers/core/components/ColorBar';
import type { LayerId } from '@/features/layers/core/registry';

// 켜져 있는 레이어 중 컬러바 스펙이 정의된 것만 렌더한다. vector(flow) 레이어는
// 스펙이 없어 자동으로 제외된다.
export function LayerColorBars() {
  const layers = useLayerStore((s) => s.layers);

  const visible = (Object.keys(LAYER_COLOR_BARS) as LayerId[]).filter(
    (id) => layers[id],
  );
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((id) => (
        <ColorBar key={id} spec={LAYER_COLOR_BARS[id]!} />
      ))}
    </>
  );
}
