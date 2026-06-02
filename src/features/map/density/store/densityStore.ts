import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  DEFAULT_NATIONWIDE_DENSITY,
  DEFAULT_PORT_DENSITY,
} from '@/features/map/density/constants/density';

interface DensityStore {
  /** 전국(base, z=6) 흐름 파티클 수. */
  nationwide: number;
  /** 항구(detail, z=11) 흐름 파티클 수. */
  port: number;
  setNationwide: (n: number) => void;
  setPort: (n: number) => void;
}

export const useDensityStore = create<DensityStore>()(
  devtools(
    (set) => ({
      nationwide: DEFAULT_NATIONWIDE_DENSITY,
      port: DEFAULT_PORT_DENSITY,
      setNationwide: (n) => set({ nationwide: n }, undefined, 'setNationwide'),
      setPort: (n) => set({ port: n }, undefined, 'setPort'),
    }),
    { name: 'DensityStore' },
  ),
);
