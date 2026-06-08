import { createStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  loadViewKey,
  type LoadingStatusStore,
  type LoadingStatusStoreInstance,
} from '@/features/map/loading/types';

export function createLoadingStatusStore(): LoadingStatusStoreInstance {
  return createStore<LoadingStatusStore>()(
    devtools(
      (set, get) => ({
        loaded: {},
        hasInitialLoaded: false,
        markInitialLoaded: () => {
          if (get().hasInitialLoaded) return;
          // 렌더 단계에서 호출되므로 set은 microtask로 미룬다.
          queueMicrotask(() => {
            if (get().hasInitialLoaded) return;
            set({ hasInitialLoaded: true }, undefined, 'markInitialLoaded');
          });
        },
        markIsInitialLoaded: (layerId, location, ts) => {
          const key = loadViewKey(location, ts);
          // 멱등: 이미 완료면 아무 것도 하지 않는다.
          if (get().loaded[key]?.[layerId]) return;
          // 렌더 단계에서 호출되므로 set은 microtask로 미뤄
          // "Cannot update a component while rendering a different component" 회피.
          queueMicrotask(() => {
            if (get().loaded[key]?.[layerId]) return;
            set(
              (s) => ({
                loaded: {
                  ...s.loaded,
                  [key]: { ...s.loaded[key], [layerId]: true },
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
