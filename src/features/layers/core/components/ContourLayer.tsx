import { useMemo } from 'react';
import type { Layer as DeckLayer } from '@deck.gl/core';
import { useRegisterLayerGroup } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { useContourSurface } from '@/features/contour/hooks/useContourSurface';
import { createContourLayer } from '@/features/contour/lib/createContourLayer';
import { useReportInitialLoad } from '@/features/map/loading/hooks/useReportInitialLoad';
import type { ContourLayerSpec, LayerId } from '../registry';

export function ContourLayer({ spec }: { spec: ContourLayerSpec }) {
  const visible = useLayerStore((s) => s.layers[spec.id as LayerId]);
  const { base, detail, isLoaded } = useContourSurface(spec.fetcher, visible);
  useReportInitialLoad(spec.id as LayerId, visible && isLoaded);

  // 전국(z=6) 베이스 + 항구(z=11) 디테일을 별도 deck 레이어로 등록한다.
  // 디테일이 EMPTY면 ContourSurface가 모델을 만들지 않아 무해(전국 뷰).
  const layers = useMemo<DeckLayer[]>(
    () => [
      createContourLayer({ id: `${spec.layerName}-base`, surface: base, visible }),
      createContourLayer({ id: `${spec.layerName}-detail`, surface: detail, visible }),
    ],
    [spec.layerName, base, detail, visible],
  );

  useRegisterLayerGroup(spec.layerName, layers, spec.zIndex);

  return null;
}
