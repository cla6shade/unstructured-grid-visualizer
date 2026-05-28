import { use, useEffect } from 'react';
import type { Layer } from '@deck.gl/core';
import { DeckLayersContext } from '@/features/map/deck/store/deckLayersContext';

/**
 * deck.gl 레이어 그룹 하나를 오버레이에 등록한다.
 * layers는 이 그룹을 구성하는 deck.gl 레이어들이다.
 */
export function useRegisterLayerGroup(
  id: string,
  layers: Layer[],
  zIndex?: number,
): void {
  const registry = use(DeckLayersContext);
  if (!registry) {
    throw new Error(
      'useRegisterLayerGroup must be used within DeckOverlayProvider',
    );
  }

  useEffect(() => {
    registry.upsertLayerGroup(id, layers, zIndex);
    return () => registry.removeLayerGroup(id);
  }, [registry, id, layers, zIndex]);
}
