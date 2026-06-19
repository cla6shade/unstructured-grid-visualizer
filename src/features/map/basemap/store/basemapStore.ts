import { createStore, type StoreApi } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getBasemaps, type BaseMapOption } from '@/features/map/basemap/constants/baseMaps';

const STORAGE_KEY = 'basemapId';

export interface BasemapStore {
  basemapId: string;
  basemap: BaseMapOption;
  setBasemapId: (id: string) => void;
}

export type BasemapStoreInstance = StoreApi<BasemapStore>;

export function createBasemapStore(): BasemapStoreInstance {
  // 스토어 생성(인증 통과 후 Provider 마운트) 시점에 한 번만 만든다.
  // style 객체 동일성을 유지해야 setBasemapId 외엔 maplibre가 재로드하지 않는다.
  const basemaps = getBasemaps();
  const resolveBasemap = (id: string): BaseMapOption =>
    basemaps.find((b) => b.id === id) ?? basemaps[0];

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
