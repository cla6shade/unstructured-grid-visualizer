import { useMemo } from 'react';
import type { Layer } from '@deck.gl/core';
import { useRegisterLayerGroup } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useCurrentLayer } from '../hooks/useCurrentLayer';

const CURRENT_LAYER_ID = 'current';
const CURRENT_Z = 30;

/**
 * current(해류) 파티클 레이어. deck.gl LineLayer로 흰색 trail을 렌더한다.
 * <Map> 안의 DeckOverlayProvider 자식으로 두어야 한다.
 */
export function CurrentLayer() {
  const layer = useCurrentLayer();

  const layers = useMemo<Layer[]>(
    () => (layer ? [layer] : []),
    [layer],
  );

  useRegisterLayerGroup(CURRENT_LAYER_ID, layers, CURRENT_Z);

  return null;
}
