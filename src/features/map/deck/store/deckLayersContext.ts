import { createContext } from 'react';
import type { DeckLayersStoreInstance } from '@/features/map/deck/types';

export const DeckLayersContext = createContext<DeckLayersStoreInstance | null>(
  null,
);
