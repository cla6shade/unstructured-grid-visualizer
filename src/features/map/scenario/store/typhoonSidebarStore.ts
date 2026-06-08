import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface TyphoonSidebarStore {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

// 태풍 검색 사이드바의 열림 상태. 상단 바 토글 버튼과 사이드바가 분리돼 있어 전역으로 공유한다.
export const useTyphoonSidebarStore = create<TyphoonSidebarStore>()(
  devtools(
    (set) => ({
      open: false,
      toggle: () => set((s) => ({ open: !s.open }), undefined, 'toggle'),
      close: () => set({ open: false }, undefined, 'close'),
    }),
    { name: 'TyphoonSidebarStore' },
  ),
);
