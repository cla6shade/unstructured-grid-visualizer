import { use, useState, type ReactNode } from 'react';
import { createScenarioStore } from '@/features/map/scenario/store/scenarioStore';
import { ScenarioContext } from '@/features/map/scenario/store/scenarioContext';
import { deriveInitialScenario } from '@/features/map/scenario/lib/initialScenario';
import type { SubsetCatalog } from '@/features/map/scenario/lib/types';

interface ScenarioProviderProps {
  catalogPromise: Promise<SubsetCatalog>;
  children: ReactNode;
}

export function ScenarioProvider({
  catalogPromise,
  children,
}: ScenarioProviderProps) {
  const catalog = use(catalogPromise);
  const [store] = useState(() =>
    createScenarioStore(deriveInitialScenario(catalog)),
  );

  return (
    <ScenarioContext.Provider value={store}>
      {children}
    </ScenarioContext.Provider>
  );
}
