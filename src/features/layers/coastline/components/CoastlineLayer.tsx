import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import type { Layer as DeckLayer } from '@deck.gl/core';
import { useRegisterLayerGroup } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useCoastline } from '@/features/layers/coastline/hooks/useCoastline';
import { buildCoastlineMaskLayer } from '@/features/layers/coastline/lib/coastlineLayerFactory';
import type { CoastlineLayerSpec } from '@/features/layers/core/registry';

const NO_DECK_LAYERS: DeckLayer[] = [];

export function CoastlineLayer({ spec }: { spec: CoastlineLayerSpec }) {
  const coastline = useCoastline();
  const maskLayerName = `${spec.layerName}-mask`;
  const strokeLayerName = `${spec.layerName}-stroke`;

  const maskLayers = useMemo<DeckLayer[]>(() => {
    if (!coastline || coastline.features.length === 0) return NO_DECK_LAYERS;
    return [buildCoastlineMaskLayer(coastline, maskLayerName)];
  }, [coastline, maskLayerName]);

  useRegisterLayerGroup(maskLayerName, maskLayers, spec.zIndex);

  if (!coastline || coastline.features.length === 0) return null;

  return (
    <Source id={spec.layerName} type="geojson" data={coastline}>
      <Layer
        id={strokeLayerName}
        type="line"
        paint={{ 'line-color': '#ffffff', 'line-width': 1 }}
      />
    </Source>
  );
}
