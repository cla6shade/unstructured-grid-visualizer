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

export const useLayerStore = create<LayerStore>()(
  devtools(
    (set) => ({
      layers: initialVisibility,
      toggle: (id) =>
        set(
          (s) => ({ layers: { ...s.layers, [id]: !s.layers[id] } }),
          undefined,
          `toggle/${id}`,
        ),
    }),
    { name: 'LayerStore' },
  ),
);
