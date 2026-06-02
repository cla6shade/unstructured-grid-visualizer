import { useState, type ReactNode } from 'react';
import { createLoadingStatusStore } from '@/features/map/loading/store/loadingStatusStore';
import { LoadingStatusContext } from '@/features/map/loading/store/loadingStatusContext';

export function LoadingStatusProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createLoadingStatusStore());

  return (
    <LoadingStatusContext.Provider value={store}>
      {children}
    </LoadingStatusContext.Provider>
  );
}
