import { useMemo } from 'react';
import type { Layer } from '@deck.gl/core';
import { useRegisterLayerGroup } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useContourSurface } from '@/features/contour/hooks/useContourSurface';
import { createContourLayer } from '@/features/contour/lib/createContourLayer';
import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { waterDepthFetcher } from '../lib/waterDepthFetcher';

const WATER_DEPTH_LAYER_ID = 'water-depth-contour-mesh';
const WATER_DEPTH_Z = 10;

/**
 * Water Depth(수심) contour 레이어. deck.gl ContourSurface로 렌더한다.
 * <Map> 안의 DeckOverlayProvider 자식으로 두어야 한다.
 */
export function WaterDepthLayer() {
  const surface = useContourSurface(waterDepthFetcher);
  const visible = useLayerStore((s) => s.layers.waterDepth);

  const layers = useMemo<Layer[]>(
    () => [createContourLayer({ id: WATER_DEPTH_LAYER_ID, surface, visible })],
    [surface, visible],
  );

  useRegisterLayerGroup(WATER_DEPTH_LAYER_ID, layers, WATER_DEPTH_Z);

  return null;
}
