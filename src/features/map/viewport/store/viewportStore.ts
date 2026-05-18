import { createStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  ViewportState,
  ViewportStore,
  ViewportStoreInstance,
} from '@/features/map/viewport/types';

export function createViewportStore(
  initial: ViewportState,
): ViewportStoreInstance {
  return createStore<ViewportStore>()(
    devtools(
      (set) => ({
        ...initial,
        _setView: (view) => set(view, undefined, 'setView'),
      }),
      { name: 'ViewportStore' },
    ),
  );
}
