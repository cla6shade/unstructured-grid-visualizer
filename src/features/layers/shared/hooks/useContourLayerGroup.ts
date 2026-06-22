import { useMemo } from 'react';
import type { Layer as DeckLayer } from '@deck.gl/core';
import { useRegisterLayerGroup } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { useContourSurface } from '@/features/layers/shared/surface/useContourSurface';
import { createContourLayer } from '@/features/layers/shared/surface/createContourLayer';
import { useReportInitialLoad } from '@/features/map/loading/hooks/useReportInitialLoad';
import { useBoundaryMask } from '@/features/layers/boundary/hooks/useBoundaryMask';
import { localMaskProps } from '@/features/layers/boundary/lib/maskProps';
import { LOCAL_ZINDEX_OFFSET } from '@/features/layers/boundary/constants';
import type { ContourTileFetcher } from '@/features/layers/shared/surface/types';
import type { LayerId } from '@/features/layers/shared/registry';

const NO_LAYERS: DeckLayer[] = [];

export interface ContourLayerGroupOptions {
  id: LayerId;
  layerName: string;
  zIndex: number;
}

/**
 * contour 필드(자유수면·수심 등)를 전국(z=6) base + 항구(z=11) detail 두 그룹으로 deck
 * registry에 등록하는 공용 훅. 필드별 컴포넌트는 fetcher와 id/layerName/zIndex만 넘긴다.
 */
export function useContourLayerGroup(
  fetcher: ContourTileFetcher,
  { id, layerName, zIndex }: ContourLayerGroupOptions,
): void {
  const visible = useLayerStore((s) => s.layers[id]);
  const { base, detail, isLoaded, detailLoaded } = useContourSurface(
    fetcher,
    visible,
  );
  useReportInitialLoad(id, visible && isLoaded);

  // boundaryReady = 항구 && zoom>=11 && boundary geojson 로드 완료.
  const boundaryReady = useBoundaryMask().isLoaded;

  // 전국(z=6) 베이스: boundary가 준비되고 z=11 디테일까지 도착한 뒤에만 boundary 바깥으로 컷한다
  // (로딩 중 빈 구멍 방지). 그 외에는 maskId 미부여 → 전체 렌더.
  const baseLayers = useMemo<DeckLayer[]>(
    () => [
      createContourLayer({
        id: `${layerName}-base`,
        surface: base,
        visible,
        ...localMaskProps(boundaryReady && detailLoaded, true),
      }),
    ],
    [layerName, base, visible, boundaryReady, detailLoaded],
  );

  // 항구(z=11) 디테일: 마스크가 준비된 경우에만 그린다(마스크 없이 그리면 base와 겹친다).
  // boundary 안쪽으로 클리핑(maskInverted:false)하고 더 높은 zIndex로 위에 올린다.
  const detailLayers = useMemo<DeckLayer[]>(
    () =>
      boundaryReady
        ? [
            createContourLayer({
              id: `${layerName}-detail`,
              surface: detail,
              visible,
              ...localMaskProps(true, false),
            }),
          ]
        : NO_LAYERS,
    [layerName, detail, visible, boundaryReady],
  );

  useRegisterLayerGroup(`${layerName}-base`, baseLayers, zIndex);
  useRegisterLayerGroup(
    `${layerName}-detail`,
    detailLayers,
    zIndex + LOCAL_ZINDEX_OFFSET,
  );
}
