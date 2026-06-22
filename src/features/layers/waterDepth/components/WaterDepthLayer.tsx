import { useContourLayerGroup } from '@/features/layers/shared/hooks/useContourLayerGroup';
import { waterDepthFetcher } from '@/features/layers/waterDepth/lib/waterDepthFetcher';

export function WaterDepthLayer() {
  useContourLayerGroup(waterDepthFetcher, {
    id: 'waterDepth',
    layerName: 'water-depth-contour-mesh',
    zIndex: 10,
  });
  return null;
}
