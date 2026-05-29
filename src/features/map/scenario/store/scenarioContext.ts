import { createContext } from 'react';
import type { ScenarioStoreInstance } from '@/features/map/scenario/types';

export const ScenarioContext = createContext<ScenarioStoreInstance | null>(
  null,
);
