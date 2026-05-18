import type { StoreApi } from 'zustand';

export interface TimeState {
  /** 현재로부터 1시간 간격의 시계열 인덱스 (0..TILE_TIME_INDEX_COUNT-1) */
  timeIndex: number;
}

export interface TimeStore extends TimeState {
  setTimeIndex: (timeIndex: number) => void;
}

export type TimeStoreInstance = StoreApi<TimeStore>;
