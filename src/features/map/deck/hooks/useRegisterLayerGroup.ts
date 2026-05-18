import { use, useEffect } from 'react';
import { useStore } from 'zustand';
import type { Layer } from '@deck.gl/core';
import { DeckLayersContext } from '@/features/map/deck/store/deckLayersContext';

/**
 * deck.gl 레이어 그룹 하나를 오버레이에 등록한다.
 * layers는 이 그룹을 구성하는 deck.gl 레이어들이며,
 * 안정된 참조여야 한다(useMemo 권장).
 */
export function useRegisterLayerGroup(
  id: string,
  layers: Layer[],
  zIndex?: number,
): void {
  const store = use(DeckLayersContext);
  if (!store) {
    throw new Error(
      'useRegisterLayerGroup must be used within DeckOverlayProvider',
    );
  }
  const upsertLayerGroup = useStore(store, (s) => s.upsertLayerGroup);

  useEffect(() => {
    upsertLayerGroup(id, layers, zIndex);
    return () => upsertLayerGroup(id, []);
  }, [upsertLayerGroup, id, layers, zIndex]);
}
