import { use } from 'react';
import { useStore } from 'zustand';
import type { ViewportStore } from '@/features/map/viewport/types';
import { ViewportContext } from '@/features/map/viewport/store/viewportContext';

export function useViewport<T>(selector: (state: ViewportStore) => T): T {
  const store = use(ViewportContext);
  if (!store) {
    throw new Error('useViewport must be used within ViewportProvider');
  }
  return useStore(store, selector);
}
