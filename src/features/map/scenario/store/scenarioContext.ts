import { createContext } from 'react';
import type { ScenarioStoreInstance } from '@/features/map/scenario/lib/types';

export const ScenarioContext = createContext<ScenarioStoreInstance | null>(
  null,
);
