import { CoastlineLayer } from '@/features/layers/coastline/components/CoastlineLayer';
import { LocalMaskLayer } from '@/features/layers/boundary/components/LocalMaskLayer';
import { FreeSurfaceLayer } from '@/features/layers/freeSurface/components/FreeSurfaceLayer';
import { WaterDepthLayer } from '@/features/layers/waterDepth/components/WaterDepthLayer';
import { CurrentLayer } from '@/features/layers/current/components/CurrentLayer';
import { WaveLayer } from '@/features/layers/wave/components/WaveLayer';

/**
 * 렌더 가능한 모든 레이어를 마운트한다. 각 컴포넌트는 자기 필드 폴더에서 fetcher와
 * 배선 상수(layerName/zIndex)를 소유하고, useLayerStore에서 자체 visible을 읽는다.
 * 실제 그려지는 순서는 각 레이어의 zIndex로 결정되므로 나열 순서 자체는 무관하다.
 */
export function MapLayers() {
  return (
    <>
      <LocalMaskLayer />
      <CoastlineLayer />
      <FreeSurfaceLayer />
      <WaterDepthLayer />
      <CurrentLayer />
      <WaveLayer />
    </>
  );
}
