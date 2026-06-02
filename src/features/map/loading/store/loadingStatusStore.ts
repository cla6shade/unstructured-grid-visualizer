import { createStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  LoadingStatusStore,
  LoadingStatusStoreInstance,
} from '@/features/map/loading/types';

export function createLoadingStatusStore(): LoadingStatusStoreInstance {
  return createStore<LoadingStatusStore>()(
    devtools(
      (set, get) => ({
        loaded: {},
        markIsInitialLoaded: (layerId, ts) => {
          // 멱등: 이미 완료면 아무 것도 하지 않는다.
          if (get().loaded[ts]?.[layerId]) return;
          // 렌더 단계에서 호출되므로 set은 microtask로 미뤄
          // "Cannot update a component while rendering a different component" 회피.
          queueMicrotask(() => {
            if (get().loaded[ts]?.[layerId]) return;
            set(
              (s) => ({
                loaded: {
                  ...s.loaded,
                  [ts]: { ...s.loaded[ts], [layerId]: true },
                },
              }),
              undefined,
              `mark/${layerId}`,
            );
          });
        },
      }),
      { name: 'LoadingStatusStore' },
    ),
  );
}
