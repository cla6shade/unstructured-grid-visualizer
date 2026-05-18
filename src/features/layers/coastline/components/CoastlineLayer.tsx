import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import type { Layer as DeckLayer } from '@deck.gl/core';
import { useCoastline } from '../hooks/useCoastline';
import { useRegisterLayerGroup } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { buildCoastlineMaskLayer } from '../lib/coastlineLayerFactory';
import { COASTLINE_MASK_ID } from '../constants';

const NO_LAYERS: DeckLayer[] = [];

/**
 * coastline을 두 가지로 렌더한다.
 * - stroke: maplibre 네이티브 line 레이어 (실제로 보이는 해안선)
 * - mask: deck.gl 마스크 레이어 (보이지 않음, 다른 deck.gl 레이어를 잘라냄)
 * <Map> 안의 DeckOverlayProvider 자식으로 렌더해야 한다.
 */
export function CoastlineLayer() {
  const coastline = useCoastline();

  const maskLayers = useMemo<DeckLayer[]>(() => {
    if (!coastline || coastline.features.length === 0) return NO_LAYERS;
    return [buildCoastlineMaskLayer(coastline)];
  }, [coastline]);

  useRegisterLayerGroup(COASTLINE_MASK_ID, maskLayers);

  if (!coastline || coastline.features.length === 0) return null;

  return (
    <Source id="coastline" type="geojson" data={coastline}>
      <Layer
        id="coastline-stroke"
        type="line"
        paint={{ 'line-color': '#ffffff', 'line-width': 1 }}
      />
    </Source>
  );
}
