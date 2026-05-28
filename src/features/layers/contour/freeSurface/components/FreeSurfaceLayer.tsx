import { useMemo } from 'react';
import type { Layer } from '@deck.gl/core';
import { useRegisterLayerGroup } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useContourSurface } from '../../hooks/useContourSurface';
import { createContourLayer } from '../../lib/createContourLayer';
import { freeSurfaceFetcher } from '../lib/freeSurfaceFetcher';

const FREE_SURFACE_LAYER_ID = 'free-surface-contour-mesh';
const FREE_SURFACE_Z = 10;

/**
 * Free Surface(자유수면) contour 레이어. deck.gl SurfaceMeshLayer로 렌더한다.
 * <Map> 안의 DeckOverlayProvider 자식으로 두어야 한다.
 */
export function FreeSurfaceLayer() {
  const surface = useContourSurface(freeSurfaceFetcher);

  const layers = useMemo<Layer[]>(
    () => [createContourLayer({ id: FREE_SURFACE_LAYER_ID, surface, visible: true })],
    [surface],
  );

  useRegisterLayerGroup(FREE_SURFACE_LAYER_ID, layers, FREE_SURFACE_Z);

  return null;
}
