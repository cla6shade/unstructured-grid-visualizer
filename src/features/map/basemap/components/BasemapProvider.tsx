import { useState, type ReactNode } from 'react';
import { createBasemapStore } from '@/features/map/basemap/store/basemapStore';
import { BasemapContext } from '@/features/map/basemap/store/basemapContext';

interface BasemapProviderProps {
  children: ReactNode;
}

export function BasemapProvider({ children }: BasemapProviderProps) {
  const [store] = useState(() => createBasemapStore());

  return (
    <BasemapContext.Provider value={store}>{children}</BasemapContext.Provider>
  );
}
