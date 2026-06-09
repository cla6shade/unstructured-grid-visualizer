import { useMemo } from 'react';
import type { Layer as DeckLayer } from '@deck.gl/core';
import { useRegisterLayerGroup } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { useContourSurface } from '@/features/contour/hooks/useContourSurface';
import { createContourLayer } from '@/features/contour/lib/createContourLayer';
import { useReportInitialLoad } from '@/features/map/loading/hooks/useReportInitialLoad';
import { useBoundaryMask } from '@/features/layers/boundary/hooks/useBoundaryMask';
import { localMaskProps } from '@/features/layers/boundary/lib/maskProps';
import { LOCAL_ZINDEX_OFFSET } from '@/features/layers/boundary/constants';
import type { ContourLayerSpec, LayerId } from '../registry';

const NO_LAYERS: DeckLayer[] = [];

export function ContourLayer({ spec }: { spec: ContourLayerSpec }) {
  const visible = useLayerStore((s) => s.layers[spec.id as LayerId]);
  const { base, detail, isLoaded, detailLoaded } = useContourSurface(
    spec.fetcher,
    visible,
  );
  useReportInitialLoad(spec.id as LayerId, visible && isLoaded);

  // boundaryReady = 항구 && zoom>=11 && boundary geojson 로드 완료.
  const boundaryReady = useBoundaryMask().isLoaded;

  // 전국(z=6) 베이스: boundary가 준비되고 z=11 디테일까지 도착한 뒤에만 boundary 바깥으로 컷한다
  // (로딩 중 빈 구멍 방지). 그 외에는 maskId 미부여 → 전체 렌더.
  const baseLayers = useMemo<DeckLayer[]>(
    () => [
      createContourLayer({
        id: `${spec.layerName}-base`,
        surface: base,
        visible,
        ...localMaskProps(boundaryReady && detailLoaded, true),
      }),
    ],
    [spec.layerName, base, visible, boundaryReady, detailLoaded],
  );

  // 항구(z=11) 디테일: 마스크가 준비된 경우에만 그린다(마스크 없이 그리면 base와 겹친다).
  // boundary 안쪽으로 클리핑(maskInverted:false)하고 더 높은 zIndex로 위에 올린다.
  const detailLayers = useMemo<DeckLayer[]>(
    () =>
      boundaryReady
        ? [
            createContourLayer({
              id: `${spec.layerName}-detail`,
              surface: detail,
              visible,
              ...localMaskProps(true, false),
            }),
          ]
        : NO_LAYERS,
    [spec.layerName, detail, visible, boundaryReady],
  );

  useRegisterLayerGroup(`${spec.layerName}-base`, baseLayers, spec.zIndex);
  useRegisterLayerGroup(
    `${spec.layerName}-detail`,
    detailLayers,
    spec.zIndex + LOCAL_ZINDEX_OFFSET,
  );

  return null;
}
