import { createStore, type StoreApi } from 'zustand';
import { devtools } from 'zustand/middleware';
import { BASEMAPS, type BaseMapOption } from '@/features/map/basemap/constants/baseMaps';

const STORAGE_KEY = 'basemapId';

export interface BasemapStore {
  basemapId: string;
  basemap: BaseMapOption;
  setBasemapId: (id: string) => void;
}

export type BasemapStoreInstance = StoreApi<BasemapStore>;

function resolveBasemap(id: string): BaseMapOption {
  return BASEMAPS.find((b) => b.id === id) ?? BASEMAPS[0];
}

export function createBasemapStore(): BasemapStoreInstance {
  const initialId = localStorage.getItem(STORAGE_KEY) ?? 'default';

  return createStore<BasemapStore>()(
    devtools(
      (set) => ({
        basemapId: initialId,
        basemap: resolveBasemap(initialId),
        setBasemapId: (id) => {
          localStorage.setItem(STORAGE_KEY, id);
          set(
            { basemapId: id, basemap: resolveBasemap(id) },
            undefined,
            'setBasemapId',
          );
        },
      }),
      { name: 'BasemapStore' },
    ),
  );
}
