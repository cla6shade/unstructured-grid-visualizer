import { use } from 'react';
import { useStore } from 'zustand';
import type { TimeStore } from '@/features/map/time/types';
import { TimeContext } from '@/features/map/time/store/timeContext';

export function useTime<T>(selector: (state: TimeStore) => T): T {
  const store = use(TimeContext);
  if (!store) {
    throw new Error('useTime must be used within TimeProvider');
  }
  return useStore(store, selector);
}
