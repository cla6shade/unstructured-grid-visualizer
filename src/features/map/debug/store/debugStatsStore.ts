import { create } from 'zustand';

export interface ValueStats {
  key: string;
  min: number;
  max: number;
  count: number;
  nonZeroCount: number;
}

type StatsMap = Record<string, ValueStats>;

interface DebugStatsStore {
  stats: StatsMap;
  report: (layerId: string, key: string, values: Float32Array) => void;
}

function computeStats(key: string, values: Float32Array): ValueStats {
  let min = Infinity;
  let max = -Infinity;
  let nonZero = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === 0) continue;
    nonZero++;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min)) {
    min = 0;
    max = 0;
  }
  return { key, min, max, count: values.length, nonZeroCount: nonZero };
}

export const useDebugStatsStore = create<DebugStatsStore>((set) => ({
  stats: {},
  report: (layerId, key, values) =>
    set((s) => ({
      stats: { ...s.stats, [layerId]: computeStats(key, values) },
    })),
}));
