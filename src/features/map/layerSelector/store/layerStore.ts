import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { LAYER_DEFS, type LayerId } from '@/features/map/layerSelector/constants/layers';

type LayerVisibility = Record<LayerId, boolean>;

interface LayerStore {
  layers: LayerVisibility;
  toggle: (id: LayerId) => void;
}

const initialVisibility = LAYER_DEFS.reduce(
  (acc, def) => ({ ...acc, [def.id]: def.defaultVisible }),
  {} as LayerVisibility,
);

// id → 데이터 모델. 모델이 다른 레이어는 함께 켜질 수 없다(surge ↔ wave 상호배타).
const MODEL_OF = LAYER_DEFS.reduce(
  (acc, def) => ({ ...acc, [def.id]: def.model }),
  {} as Record<LayerId, (typeof LAYER_DEFS)[number]['model']>,
);

export const useLayerStore = create<LayerStore>()(
  devtools(
    (set) => ({
      layers: initialVisibility,
      toggle: (id) =>
        set(
          (s) => {
            const next = !s.layers[id];
            // 끌 때는 해당 id만 false. 켤 때는 다른 모델 레이어를 모두 false로 만들어
            // 모델 간 상호배타를 강제한다(예: 파랑을 켜면 surge 3종이 꺼진다).
            if (!next) {
              return { layers: { ...s.layers, [id]: false } };
            }
            const model = MODEL_OF[id];
            const layers = { ...s.layers, [id]: true };
            for (const def of LAYER_DEFS) {
              if (def.model !== model) layers[def.id] = false;
            }
            return { layers };
          },
          undefined,
          `toggle/${id}`,
        ),
    }),
    { name: 'LayerStore' },
  ),
);
