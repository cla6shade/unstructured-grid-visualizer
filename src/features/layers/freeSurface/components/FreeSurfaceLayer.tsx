import { useContourLayerGroup } from '@/features/layers/shared/hooks/useContourLayerGroup';
import { freeSurfaceFetcher } from '@/features/layers/freeSurface/lib/freeSurfaceFetcher';

export function FreeSurfaceLayer() {
  useContourLayerGroup(freeSurfaceFetcher, {
    id: 'freeSurface',
    layerName: 'free-surface-contour-mesh',
    zIndex: 10,
  });
  return null;
}
