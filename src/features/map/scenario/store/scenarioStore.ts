import { createStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  ScenarioState,
  ScenarioStore,
  ScenarioStoreInstance,
} from '@/features/map/scenario/lib/types';

export function createScenarioStore(
  initial: ScenarioState,
): ScenarioStoreInstance {
  return createStore<ScenarioStore>()(
    devtools(
      (set) => ({
        ...initial,
        setScenarioId: (scenarioId) =>
          set({ scenarioId }, undefined, 'setScenarioId'),
        setTyphoonId: (typhoonId) =>
          set({ typhoonId }, undefined, 'setTyphoonId'),
        setTimestamp: (timestamp) =>
          set({ timestamp }, undefined, 'setTimestamp'),
      }),
      { name: 'ScenarioStore' },
    ),
  );
}
