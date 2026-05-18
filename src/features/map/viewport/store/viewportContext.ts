import { createContext } from 'react';
import type { ViewportStoreInstance } from '@/features/map/viewport/types';

export const ViewportContext = createContext<ViewportStoreInstance | null>(null);
