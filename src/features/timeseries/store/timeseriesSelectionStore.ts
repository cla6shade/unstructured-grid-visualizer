import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SelectedStation } from '@/features/timeseries/types';

interface TimeseriesSelectionStore {
  /** 현재 선택된 시계열 station(없으면 null). */
  selected: SelectedStation | null;
  select: (station: SelectedStation) => void;
  clear: () => void;
}

// 지도에서 선택한 시계열 station. 추후 timeseries 차트 패널이 이 값을 구독한다.
export const useTimeseriesSelectionStore = create<TimeseriesSelectionStore>()(
  devtools(
    (set) => ({
      selected: null,
      select: (station) => set({ selected: station }, undefined, 'select'),
      clear: () => set({ selected: null }, undefined, 'clear'),
    }),
    { name: 'TimeseriesSelectionStore' },
  ),
);
