import { use } from 'react';
import { useStore } from 'zustand';
import type { ScenarioStore } from '@/features/map/scenario/lib/types';
import { ScenarioContext } from '@/features/map/scenario/store/scenarioContext';

export function useScenario<T>(selector: (state: ScenarioStore) => T): T {
  const store = use(ScenarioContext);
  if (!store) {
    throw new Error('useScenario must be used within ScenarioProvider');
  }
  return useStore(store, selector);
}
