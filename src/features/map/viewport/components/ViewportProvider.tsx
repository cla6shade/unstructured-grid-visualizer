import { useState, type ReactNode } from 'react';
import { createViewportStore } from '@/features/map/viewport/store/viewportStore';
import { ViewportContext } from '@/features/map/viewport/store/viewportContext';
import type { ViewportState } from '@/features/map/viewport/types';

interface ViewportProviderProps {
  initialState: ViewportState;
  children: ReactNode;
}

export function ViewportProvider({
  initialState,
  children,
}: ViewportProviderProps) {
  const [store] = useState(() => createViewportStore(initialState));

  return (
    <ViewportContext.Provider value={store}>
      {children}
    </ViewportContext.Provider>
  );
}
