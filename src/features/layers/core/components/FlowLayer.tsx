import { useCallback, useMemo } from 'react';
import { useDeckLayersRegistry } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { useVectorSurface } from '@/features/vector/hooks/useVectorSurface';
import {
  useFlowLines,
  type FlowSegments,
} from '@/features/vector/hooks/useFlowLines';
import { createFlowLayer } from '@/features/vector/lib/createFlowLayer';
import { useReportInitialLoad } from '@/features/map/loading/hooks/useReportInitialLoad';
import { useDensityStore } from '@/features/map/density/store/densityStore';
import { CURRENT_SPEED_LUT } from '@/features/layers/current/constants/currentScale';
import { useBoundaryMask } from '@/features/layers/boundary/hooks/useBoundaryMask';
import { localMaskProps, type LocalMaskProps } from '@/features/layers/boundary/lib/maskProps';
import { LOCAL_ZINDEX_OFFSET } from '@/features/layers/boundary/constants';
import { SELECTABLE_LAYER_SPECS, type FlowLayerSpec, type LayerId } from '../registry';

export function FlowLayer({ spec }: { spec: FlowLayerSpec }) {
  const layers = useLayerStore((s) => s.layers);
  const visible = layers[spec.id as LayerId];
  // current 단독(다른 선택 레이어 전부 off)일 때만 유속→depthColorMap 색을 입힌다.
  const onlyCurrent =
    spec.id === 'current' &&
    SELECTABLE_LAYER_SPECS.every(
      (s) => layers[s.id as LayerId] === (s.id === spec.id),
    );
  const speedColorLut = onlyCurrent ? CURRENT_SPEED_LUT : null;
  const { base, detail, isLoaded, detailLoaded } = useVectorSurface(
    spec.fetcher,
    visible,
  );
  // 전국(base)·항구(detail) 흐름의 파티클 밀도를 각각 독립적으로 조절한다.
  const nationwideDensity = useDensityStore((s) => s.nationwide);
  const portDensity = useDensityStore((s) => s.port);
  useReportInitialLoad(spec.id as LayerId, visible && isLoaded);
  const registry = useDeckLayersRegistry();

  // boundaryReady = 항구 && zoom>=11 && boundary geojson 로드 완료.
  const boundaryReady = useBoundaryMask().isLoaded;

  // 전국(z=6) 베이스와 항구(z=11) 디테일을 각각 별도 그룹으로 등록한다.
  // 베이스는 boundary 바깥(디테일 도착 후 컷), 디테일은 마스크 준비 시에만 그려 boundary 안쪽으로
  // 클리핑하고 더 높은 zIndex로 올린다(마스크 없이 그리면 base와 겹친다).
  const baseGroupId = `${spec.layerName}-base`;
  const detailGroupId = `${spec.layerName}-detail`;
  const baseMask = useMemo(
    () => localMaskProps(boundaryReady && detailLoaded, true),
    [boundaryReady, detailLoaded],
  );
  const detailMask = useMemo(() => localMaskProps(true, false), []);
  const detailZIndex = spec.zIndex + LOCAL_ZINDEX_OFFSET;

  const onBaseSegments = useCallback(
    (segments: FlowSegments | null) =>
      upsertOrRemove(registry, baseGroupId, segments, spec.zIndex, baseMask),
    [registry, baseGroupId, spec.zIndex, baseMask],
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

  return null;
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
