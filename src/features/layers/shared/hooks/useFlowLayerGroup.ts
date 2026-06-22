import { useCallback, useMemo } from 'react';
import { useDeckLayersRegistry } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { useVectorSurface } from '@/features/layers/shared/flow/useVectorSurface';
import {
  useFlowLines,
  type FlowSegments,
} from '@/features/layers/shared/flow/useFlowLines';
import { createFlowLayer } from '@/features/layers/shared/flow/createFlowLayer';
import { useReportInitialLoad } from '@/features/map/loading/hooks/useReportInitialLoad';
import { useDensityStore } from '@/features/map/density/store/densityStore';
import { useBoundaryMask } from '@/features/layers/boundary/hooks/useBoundaryMask';
import {
  localMaskProps,
  type LocalMaskProps,
} from '@/features/layers/boundary/lib/maskProps';
import { LOCAL_ZINDEX_OFFSET } from '@/features/layers/boundary/constants';
import type { ColorLut } from '@/lib/colorMap';
import type { VectorTileFetcher } from '@/features/layers/shared/flow/types';
import type { LayerId } from '@/features/layers/shared/registry';

export interface FlowLayerGroupOptions {
  id: LayerId;
  layerName: string;
  zIndex: number;
  /** 유속→색 LUT. null이면 단색(기본). 해류 단독 표시 시에만 current가 넘긴다. */
  speedColorLut?: ColorLut | null;
}

/**
 * vector 필드(해류 등)의 파티클 흐름을 전국 base + 항구 detail 두 그룹으로 deck registry에
 * 등록하는 공용 훅. 필드 특화 색상 정책은 speedColorLut 파라미터로만 주입한다(훅은 필드 무관).
 */
export function useFlowLayerGroup(
  fetcher: VectorTileFetcher,
  { id, layerName, zIndex, speedColorLut = null }: FlowLayerGroupOptions,
): void {
  const visible = useLayerStore((s) => s.layers[id]);
  const { base, detail, isLoaded, detailLoaded } = useVectorSurface(
    fetcher,
    visible,
  );
  // 전국(base)·항구(detail) 흐름의 파티클 밀도를 각각 독립적으로 조절한다.
  const nationwideDensity = useDensityStore((s) => s.nationwide);
  const portDensity = useDensityStore((s) => s.port);
  useReportInitialLoad(id, visible && isLoaded);
  const registry = useDeckLayersRegistry();

  // boundaryReady = 항구 && zoom>=11 && boundary geojson 로드 완료.
  const boundaryReady = useBoundaryMask().isLoaded;

  // 전국(z=6) 베이스와 항구(z=11) 디테일을 각각 별도 그룹으로 등록한다.
  // 베이스는 boundary 바깥(디테일 도착 후 컷), 디테일은 마스크 준비 시에만 그려 boundary 안쪽으로
  // 클리핑하고 더 높은 zIndex로 올린다(마스크 없이 그리면 base와 겹친다).
  const baseGroupId = `${layerName}-base`;
  const detailGroupId = `${layerName}-detail`;
  const baseMask = useMemo(
    () => localMaskProps(boundaryReady && detailLoaded, true),
    [boundaryReady, detailLoaded],
  );
  const detailMask = useMemo(() => localMaskProps(true, false), []);
  const detailZIndex = zIndex + LOCAL_ZINDEX_OFFSET;

  const onBaseSegments = useCallback(
    (segments: FlowSegments | null) =>
      upsertOrRemove(registry, baseGroupId, segments, zIndex, baseMask),
    [registry, baseGroupId, zIndex, baseMask],
  );
  const onDetailSegments = useCallback(
    (segments: FlowSegments | null) =>
      upsertOrRemove(registry, detailGroupId, segments, detailZIndex, detailMask),
    [registry, detailGroupId, detailZIndex, detailMask],
  );

  useFlowLines(base, visible, onBaseSegments, {
    particleCount: nationwideDensity,
    trailLength: 100,
    flowSpeed: 2,
    minAge: 3,
    ageJitter: 3,
    maxDt: 0.05,
    speedColorLut,
  });
  useFlowLines(detail, visible && boundaryReady, onDetailSegments, {
    particleCount: portDensity,
    trailLength: 30,
    flowSpeed: 0.7,
    minAge: 1,
    ageJitter: 1.5,
    maxDt: 0.05,
    speedColorLut,
  });
}

function upsertOrRemove(
  registry: ReturnType<typeof useDeckLayersRegistry>,
  groupId: string,
  segments: FlowSegments | null,
  zIndex: number,
  mask: LocalMaskProps,
): void {
  if (segments) {
    registry.upsertLayerGroup(
      groupId,
      [createFlowLayer({ id: groupId, segments, visible: true, ...mask })],
      zIndex,
    );
  } else {
    registry.removeLayerGroup(groupId);
  }
}
