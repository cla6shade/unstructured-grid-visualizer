import { GeoJsonLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import { COASTLINE_MASK_ID } from '../constants';

/**
 * coastline GeoJSON으로 deck.gl 마스크 레이어를 만든다.
 * 화면에는 보이지 않고, 다른 deck.gl 레이어를 육지/바다 경계로 잘라내는 데 쓰인다.
 */
export function buildCoastlineMaskLayer(
  data: GeoJSON.FeatureCollection,
): Layer {
  return new GeoJsonLayer({
    id: COASTLINE_MASK_ID,
    data,
    operation: 'mask',
    filled: true,
    stroked: false,
  });
}
