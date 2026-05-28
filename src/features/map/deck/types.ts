import type { Layer } from '@deck.gl/core';

export interface LayerGroup {
  layers: Layer[];
  /** 작을수록 먼저(아래에) 그려진다. */
  zIndex: number;
}

export interface DeckLayersRegistry {
  /** id가 가리키는 레이어 그룹을 upsert한다. */
  upsertLayerGroup: (id: string, layers: Layer[], zIndex?: number) => void;
  /** id가 가리키는 레이어 그룹을 제거한다. */
  removeLayerGroup: (id: string) => void;
}
