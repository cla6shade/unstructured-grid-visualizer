import { use } from 'react';
import { useStore } from 'zustand';
import type { LoadingStatusStore } from '@/features/map/loading/types';
import { LoadingStatusContext } from '@/features/map/loading/store/loadingStatusContext';

export function useLoadingStatus<T>(
  selector: (state: LoadingStatusStore) => T,
): T {
  const store = use(LoadingStatusContext);
  if (!store) {
    throw new Error('useLoadingStatus must be used within LoadingStatusProvider');
  }
  return useStore(store, selector);
}
