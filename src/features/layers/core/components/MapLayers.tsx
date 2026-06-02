import { CoastlineLayer } from '@/features/layers/coastline/components/CoastlineLayer';
import { ContourLayer } from './ContourLayer';
import { FlowLayer } from './FlowLayer';
import { WaveLayer } from './WaveLayer';
import { MAP_LAYER_SPECS, type LayerSpec } from '../registry';

export function MapLayers() {
  return (
    <>
      {MAP_LAYER_SPECS.map((spec) => (
        <MapLayer key={spec.id} spec={spec} />
      ))}
    </>
  );
}

function MapLayer({ spec }: { spec: LayerSpec }) {
  switch (spec.type) {
    case 'coastline':
      return <CoastlineLayer spec={spec} />;
    case 'contour':
      return <ContourLayer spec={spec} />;
    case 'flow':
      return <FlowLayer spec={spec} />;
    case 'wave':
      return <WaveLayer spec={spec} />;
  }
}
