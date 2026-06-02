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
  const { mesh, isLoaded } = useVectorSurface(spec.fetcher, visible);
  useReportInitialLoad(spec.id as LayerId, visible && isLoaded);
  const registry = useDeckLayersRegistry();

  const onSegments = useCallback(
    (segments: FlowSegments | null) => {
      if (segments) {
        registry.upsertLayerGroup(
          spec.layerName,
          [createFlowLayer({ id: spec.layerName, segments, visible: true })],
          spec.zIndex,
        );
      } else {
        registry.removeLayerGroup(spec.layerName);
      }
    },
    [registry, spec.layerName, spec.zIndex],
  );

  useFlowLines(mesh, visible, onSegments);

  return null;
}
