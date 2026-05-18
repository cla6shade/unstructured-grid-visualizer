import { createContext } from 'react';
import type { TimeStoreInstance } from '@/features/map/time/types';

export const TimeContext = createContext<TimeStoreInstance | null>(null);
