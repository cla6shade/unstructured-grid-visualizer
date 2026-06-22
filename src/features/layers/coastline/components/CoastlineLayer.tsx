import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import type { Layer as DeckLayer } from '@deck.gl/core';
import { useRegisterLayerGroup } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useCoastline } from '@/features/layers/coastline/hooks/useCoastline';
import { buildCoastlineMaskLayer } from '@/features/layers/coastline/lib/coastlineLayerFactory';

const NO_DECK_LAYERS: DeckLayer[] = [];

// 해안선은 데이터 필드가 아니라 마스킹 인프라라 자체 배선 상수를 소유한다(가장 아래 zIndex).
const COASTLINE_LAYER_NAME = 'coastline';
const COASTLINE_ZINDEX = 0;

export function CoastlineLayer() {
  const coastline = useCoastline();
  const maskLayerName = `${COASTLINE_LAYER_NAME}-mask`;
  const strokeLayerName = `${COASTLINE_LAYER_NAME}-stroke`;

  const maskLayers = useMemo<DeckLayer[]>(() => {
    if (!coastline || coastline.features.length === 0) return NO_DECK_LAYERS;
    return [buildCoastlineMaskLayer(coastline, maskLayerName)];
  }, [coastline, maskLayerName]);

  useRegisterLayerGroup(maskLayerName, maskLayers, COASTLINE_ZINDEX);

  if (!coastline || coastline.features.length === 0) return null;

  return (
    <Source id={COASTLINE_LAYER_NAME} type="geojson" data={coastline}>
      <Layer
        id={strokeLayerName}
        type="line"
        paint={{ 'line-color': '#ffffff', 'line-width': 1 }}
      />
    </Source>
  );
}
