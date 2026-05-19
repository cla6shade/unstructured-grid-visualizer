import { useEffect, useState } from 'react';
import type { Layer } from '@deck.gl/core';
import { useViewport } from '@/features/map/viewport/hooks/useViewport';
import { useTime } from '@/features/map/time/hooks/useTime';
import { getTileCoordsInBounds } from '@/lib/tile';
import { pickZoomThreshold } from '@/lib/zoom';
import { CURRENT_ZOOMS, getConfigForZoom } from '../lib/currentZoomConfig';
import { loadCurrentField } from '../lib/loadCurrentField';
import { createCurrentSimulation } from '../lib/currentSimulation';
import { createCurrentLineLayer } from '../lib/createCurrentLineLayer';

const STEP_DT = 1 / 60;

/**
 * current(해류) 파티클 레이어를 만든다. useContourSurface와 동일한 선언적 패턴 —
 * zoom/bounds/timeIndex가 바뀌면 effect가 통째로 재실행되면서 벡터장을 새로 받아
 * 시뮬레이션을 새로 만들고 RAF 루프를 시작한다. 매 프레임 setLayer로 상태만 갱신하고,
 * deck.gl 등록은 호출부의 useRegisterLayerGroup이 render phase에서 처리한다.
 */
export function useCurrentLayer(): Layer | null {
  const zoom = useViewport((s) => s.zoom);
  const bounds = useViewport((s) => s.bounds);
  const timeIndex = useTime((s) => s.timeIndex);

  const [layer, setLayer] = useState<Layer | null>(null);

  useEffect(() => {
    const dataZoom = pickZoomThreshold(zoom, CURRENT_ZOOMS);
    if (dataZoom === null) {
      setLayer(null);
      return;
    }

    const tiles = getTileCoordsInBounds(dataZoom, bounds, { padding: 1 });
    if (tiles.length === 0) {
      setLayer(null);
      return;
    }

    let cancelled = false;
    let rafId = 0;
    const controller = new AbortController();

    loadCurrentField(tiles, timeIndex, controller.signal).then((field) => {
      if (cancelled) return;

      const sim = createCurrentSimulation(
        field,
        getConfigForZoom(dataZoom),
        bounds,
      );
      const builder = createCurrentLineLayer();

      function animate() {
        setLayer(builder.build(sim.step(STEP_DT), bounds));
        rafId = requestAnimationFrame(animate);
      }
      rafId = requestAnimationFrame(animate);
    });

    return () => {
      cancelled = true;
      controller.abort();
      cancelAnimationFrame(rafId);
    };
  }, [zoom, bounds, timeIndex]);

  return layer;
}
