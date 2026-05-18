import { use } from 'react';
import { useStore } from 'zustand';
import type { BasemapStore } from '@/features/map/basemap/store/basemapStore';
import { BasemapContext } from '@/features/map/basemap/store/basemapContext';

export function useBasemap<T>(selector: (state: BasemapStore) => T): T {
  const store = use(BasemapContext);
  if (!store) {
    throw new Error('useBasemap must be used within BasemapProvider');
  }
  return useStore(store, selector);
}
