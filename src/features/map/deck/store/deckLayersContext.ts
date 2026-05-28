import { createContext } from 'react';
import type { DeckLayersRegistry } from '@/features/map/deck/types';

export const DeckLayersContext = createContext<DeckLayersRegistry | null>(
  null,
);
