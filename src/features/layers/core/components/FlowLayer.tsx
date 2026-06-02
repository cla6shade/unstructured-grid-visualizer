import { useCallback } from 'react';
import { useDeckLayersRegistry } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { useVectorSurface } from '@/features/vector/hooks/useVectorSurface';
import {
  useFlowLines,
  type FlowSegments,
} from '@/features/vector/hooks/useFlowLines';
import { createFlowLayer } from '@/features/vector/lib/createFlowLayer';
import { useReportInitialLoad } from '@/features/map/loading/hooks/useReportInitialLoad';
import type { FlowLayerSpec, LayerId } from '../registry';

export function FlowLayer({ spec }: { spec: FlowLayerSpec }) {
  const visible = useLayerStore((s) => s.layers[spec.id as LayerId]);
  const { base, detail, isLoaded } = useVectorSurface(spec.fetcher, visible);
  useReportInitialLoad(spec.id as LayerId, visible && isLoaded);
  const registry = useDeckLayersRegistry();

  // 전국(z=6) 베이스와 항구(z=11) 디테일을 각각 별도 그룹으로 등록한다.
  // 베이스 mesh는 디테일 영역에 구멍이 뚫려 그 자리엔 입자가 안 생기고, 디테일이 채운다(비겹침).
  const baseGroupId = `${spec.layerName}-base`;
  const detailGroupId = `${spec.layerName}-detail`;

  const onBaseSegments = useCallback(
    (segments: FlowSegments | null) => upsertOrRemove(registry, baseGroupId, segments, spec.zIndex),
    [registry, baseGroupId, spec.zIndex],
  );
  const onDetailSegments = useCallback(
    (segments: FlowSegments | null) => upsertOrRemove(registry, detailGroupId, segments, spec.zIndex),
    [registry, detailGroupId, spec.zIndex],
  );

  useFlowLines(base, visible, onBaseSegments);
  useFlowLines(detail, visible, onDetailSegments);

  return null;
}

function upsertOrRemove(
  registry: ReturnType<typeof useDeckLayersRegistry>,
  groupId: string,
  segments: FlowSegments | null,
  zIndex: number,
): void {
  if (segments) {
    registry.upsertLayerGroup(
      groupId,
      [createFlowLayer({ id: groupId, segments, visible: true })],
      zIndex,
    );
  } else {
    registry.removeLayerGroup(groupId);
  }
}
