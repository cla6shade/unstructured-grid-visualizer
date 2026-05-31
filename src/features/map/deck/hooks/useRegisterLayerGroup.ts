import { use, useEffect } from 'react';
import type { Layer } from '@deck.gl/core';
import { DeckLayersContext } from '@/features/map/deck/store/deckLayersContext';
import type { DeckLayersRegistry } from '@/features/map/deck/types';

/** DeckOverlayProvider의 레이어 registry를 가져온다. provider 밖이면 throw. */
export function useDeckLayersRegistry(): DeckLayersRegistry {
  const registry = use(DeckLayersContext);
  if (!registry) {
    throw new Error(
      'useDeckLayersRegistry must be used within DeckOverlayProvider',
    );
  }
  return registry;
}

/**
 * 레이어 그룹을 선언형으로 등록한다. layers 참조가 바뀔 때마다 upsert, 언마운트 시 remove.
 * 매 프레임 갱신되는 애니메이션 레이어는 이 훅 대신 useDeckLayersRegistry로
 * registry를 받아 rAF 루프에서 직접 upsert하라(React 리렌더 회피).
 */
export function useRegisterLayerGroup(
  id: string,
  layers: Layer[],
  zIndex?: number,
): void {
  const registry = useDeckLayersRegistry();

  useEffect(() => {
    registry.upsertLayerGroup(id, layers, zIndex);
    return () => registry.removeLayerGroup(id);
  }, [registry, id, layers, zIndex]);
}
