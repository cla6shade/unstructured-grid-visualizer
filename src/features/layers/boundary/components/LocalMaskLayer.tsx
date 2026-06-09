import { useMemo } from 'react';
import type { Layer as DeckLayer } from '@deck.gl/core';
import { useRegisterLayerGroup } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useBoundaryMask } from '../hooks/useBoundaryMask';
import { buildBoundaryMaskLayer } from '../lib/boundaryMaskFactory';
import { LOCAL_MASK_ID } from '../constants';

const NO_DECK_LAYERS: DeckLayer[] = [];

/**
 * 현재 항구의 boundary GeoJSON으로 deck.gl 마스크 그룹(LOCAL_MASK_ID)을 등록한다.
 * 항구별 contour/flow/wave 레이어가 maskId=LOCAL_MASK_ID로 이 마스크를 참조해
 * z=6은 경계 바깥, z=11은 경계 안쪽만 그린다. CoastlineLayer의 마스크 등록과 동형.
 */
export function LocalMaskLayer() {
  const { geojson } = useBoundaryMask();

  const layers = useMemo<DeckLayer[]>(() => {
    if (!geojson || geojson.features.length === 0) return NO_DECK_LAYERS;
    return [buildBoundaryMaskLayer(geojson, LOCAL_MASK_ID)];
  }, [geojson]);

  useRegisterLayerGroup(LOCAL_MASK_ID, layers);

  return null;
}
