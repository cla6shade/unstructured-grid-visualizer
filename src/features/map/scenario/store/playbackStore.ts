import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface PlaybackStore {
  /** 타임라인 재생 중 여부. 재생 버튼(ScenarioTimeSelector)과 surface 훅의 프리페치가 공유한다. */
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
}

// 재생 상태를 전역으로 둬, 보이는 레이어의 surface 훅이 재생 중일 때만 다음 스텝을 프리페치하게 한다.
export const usePlaybackStore = create<PlaybackStore>()(
  devtools(
    (set) => ({
      isPlaying: false,
      setIsPlaying: (isPlaying) =>
        set({ isPlaying }, undefined, 'setIsPlaying'),
    }),
    { name: 'PlaybackStore' },
  ),
);
