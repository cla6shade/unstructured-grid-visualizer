import { createStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  DeckLayersStore,
  DeckLayersStoreInstance,
} from '@/features/map/deck/types';

export function createDeckLayersStore(): DeckLayersStoreInstance {
  return createStore<DeckLayersStore>()(
    devtools(
      (set) => ({
        layerGroups: {},
        upsertLayerGroup: (id, layers, zIndex = 0) =>
          set(
            (state) => {
              if (layers.length === 0) {
                if (!(id in state.layerGroups)) return state;
                const next = { ...state.layerGroups };
                delete next[id];
                return { layerGroups: next };
              }
              return {
                layerGroups: {
                  ...state.layerGroups,
                  [id]: { layers, zIndex },
                },
              };
            },
            undefined,
            'upsertLayerGroup',
          ),
      }),
      { name: 'DeckLayersStore' },
    ),
  );
}
