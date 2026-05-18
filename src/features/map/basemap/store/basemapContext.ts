import { createContext } from 'react';
import type { BasemapStoreInstance } from '@/features/map/basemap/store/basemapStore';

export const BasemapContext = createContext<BasemapStoreInstance | null>(null);
