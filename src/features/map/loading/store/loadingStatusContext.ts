import { createContext } from 'react';
import type { LoadingStatusStoreInstance } from '@/features/map/loading/types';

export const LoadingStatusContext =
  createContext<LoadingStatusStoreInstance | null>(null);
