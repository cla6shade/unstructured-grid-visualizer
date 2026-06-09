import { GeoJsonLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';

/**
 * 항구 boundary GeoJSON으로 deck.gl 마스크 레이어를 만든다.
 * 화면에는 보이지 않고, 다른 deck.gl 레이어를 항구 경계 안/밖으로 잘라내는 데 쓰인다.
 * (coastlineLayerFactory의 buildCoastlineMaskLayer와 동형.)
 */
export function buildBoundaryMaskLayer(
  data: GeoJSON.FeatureCollection,
  id: string,
): Layer {
  return new GeoJsonLayer({
    id,
    data,
    operation: 'mask',
    filled: true,
    stroked: false,
  });
}
