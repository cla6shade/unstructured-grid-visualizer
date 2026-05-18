import type { StoreApi } from 'zustand';
import type { Layer } from '@deck.gl/core';

export interface LayerGroup {
  layers: Layer[];
  /** 작을수록 먼저(아래에) 그려진다. */
  zIndex: number;
}

export interface DeckLayersState {
  /** id별 deck.gl 레이어 그룹 */
  layerGroups: Record<string, LayerGroup>;
}

export interface DeckLayersStore extends DeckLayersState {
  /**
   * id가 가리키는 레이어 그룹을 upsert한다.
   * 빈 배열을 넘기면 해당 그룹을 제거한다.
   */
  upsertLayerGroup: (id: string, layers: Layer[], zIndex?: number) => void;
}

export type DeckLayersStoreInstance = StoreApi<DeckLayersStore>;
