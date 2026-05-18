import { createStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  TimeState,
  TimeStore,
  TimeStoreInstance,
} from '@/features/map/time/types';

export function createTimeStore(initial: TimeState): TimeStoreInstance {
  return createStore<TimeStore>()(
    devtools(
      (set) => ({
        ...initial,
        setTimeIndex: (timeIndex) =>
          set({ timeIndex }, undefined, 'setTimeIndex'),
      }),
      { name: 'TimeStore' },
    ),
  );
}
