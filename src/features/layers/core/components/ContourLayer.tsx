import { useMemo } from 'react';
import type { Layer as DeckLayer } from '@deck.gl/core';
import { useRegisterLayerGroup } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { useContourSurface } from '@/features/contour/hooks/useContourSurface';
import { createContourLayer } from '@/features/contour/lib/createContourLayer';
import type { ContourLayerSpec, LayerId } from '../registry';

export function ContourLayer({ spec }: { spec: ContourLayerSpec }) {
  const visible = useLayerStore((s) => s.layers[spec.id as LayerId]);
  const surface = useContourSurface(spec.fetcher, visible);

  const layers = useMemo<DeckLayer[]>(
    () => [
      createContourLayer({
        id: spec.layerName,
        surface,
        visible,
      }),
    ],
    [spec.layerName, surface, visible],
  );

  useRegisterLayerGroup(spec.layerName, layers, spec.zIndex);

  return null;
}
