import { useState, type ReactNode } from 'react';
import { createTimeStore } from '@/features/map/time/store/timeStore';
import { TimeContext } from '@/features/map/time/store/timeContext';

interface TimeProviderProps {
  initialTimeIndex?: number;
  children: ReactNode;
}

export function TimeProvider({
  initialTimeIndex = 0,
  children,
}: TimeProviderProps) {
  const [store] = useState(() =>
    createTimeStore({ timeIndex: initialTimeIndex }),
  );

  return <TimeContext.Provider value={store}>{children}</TimeContext.Provider>;
}
