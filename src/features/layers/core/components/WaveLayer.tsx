import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Layer as DeckLayer } from '@deck.gl/core';
import { useDeckLayersRegistry } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { useContourSurface } from '@/features/contour/hooks/useContourSurface';
import { createContourLayer } from '@/features/contour/lib/createContourLayer';
import { useVectorSurface } from '@/features/vector/hooks/useVectorSurface';
import {
  useFlowIcons,
  type FlowIcons,
} from '@/features/vector/hooks/useFlowIcons';
import { createWaveIconLayer } from '@/features/vector/lib/createWaveIconLayer';
import { useReportInitialLoad } from '@/features/map/loading/hooks/useReportInitialLoad';
import { useDensityStore } from '@/features/map/density/store/densityStore';
import type { WaveLayerSpec, LayerId } from '../registry';

/**
 * Wave 레이어: WH(파고) contour + THETAW(파향) 방향 아이콘(SVG)을 하나의 deck
 * registry 그룹(spec.layerName)으로 묶어 등록한다. 배열 앞쪽이 아래로 그려지므로
 * [contour..., icon...] 순서로 둬서 파고 위에 파향 화살표가 얹힌다.
 *
 * 아이콘 입자는 rAF로 매 프레임 갱신되고(진행 방향 회전 + 수명 페이드 opacity),
 * contour는 timestamp 스크럽 시에만 바뀐다. 둘 다 ref에 보관하고 공통 pushCombined()가
 * 결합 배열을 upsert한다(해류처럼 React 리렌더 회피). 밀도는 해류 슬라이더(useDensityStore) 공유.
 */
export function WaveLayer({ spec }: { spec: WaveLayerSpec }) {
  const visible = useLayerStore((s) => s.layers[spec.id as LayerId]);
  const { base: cBase, detail: cDetail, isLoaded: contourLoaded } =
    useContourSurface(spec.contourFetcher, visible);
  const { base: vBase, detail: vDetail, isLoaded: vectorLoaded } =
    useVectorSurface(spec.vectorFetcher, visible);

  const nationwideDensity = useDensityStore((s) => s.nationwide);
  const portDensity = useDensityStore((s) => s.port);
  useReportInitialLoad(spec.id as LayerId, visible && contourLoaded && vectorLoaded);

  const registry = useDeckLayersRegistry();
  const groupId = spec.layerName;

  // 결합 등록의 각 조각을 ref에 보관한다. contour는 useMemo로, 아이콘 입자는 rAF 콜백으로 갱신.
  const contourLayersRef = useRef<DeckLayer[]>([]);
  const baseIconRef = useRef<FlowIcons | null>(null);
  const detailIconRef = useRef<FlowIcons | null>(null);

  const pushCombined = useCallback(() => {
    const icons: DeckLayer[] = [];
    if (baseIconRef.current) {
      icons.push(
        createWaveIconLayer({
          id: `${groupId}-icon-base`,
          icons: baseIconRef.current,
          visible: true,
        }),
      );
    }
    if (detailIconRef.current) {
      icons.push(
        createWaveIconLayer({
          id: `${groupId}-icon-detail`,
          icons: detailIconRef.current,
          visible: true,
        }),
      );
    }
    const layers = [...contourLayersRef.current, ...icons];
    if (layers.length === 0) {
      registry.removeLayerGroup(groupId);
      return;
    }
    registry.upsertLayerGroup(groupId, layers, spec.zIndex);
  }, [registry, groupId, spec.zIndex]);

  // contour base/detail은 timestamp/뷰포트 변경 시에만 바뀐다.
  // detail이 EMPTY면 ContourSurface가 모델을 안 만들어 무해(전국 뷰).
  const contourLayers = useMemo<DeckLayer[]>(
    () =>
      visible
        ? [
            createContourLayer({ id: `${groupId}-contour-base`, surface: cBase, visible }),
            createContourLayer({ id: `${groupId}-contour-detail`, surface: cDetail, visible }),
          ]
        : [],
    [groupId, cBase, cDetail, visible],
  );
  useEffect(() => {
    contourLayersRef.current = contourLayers;
    pushCombined();
  }, [contourLayers, pushCombined]);

  const onBaseIcons = useCallback(
    (icons: FlowIcons | null) => {
      baseIconRef.current = icons;
      pushCombined();
    },
    [pushCombined],
  );
  const onDetailIcons = useCallback(
    (icons: FlowIcons | null) => {
      detailIconRef.current = icons;
      pushCombined();
    },
    [pushCombined],
  );

  // 밀도는 해류 슬라이더 공유. THETAW가 단위벡터라 flowSpeed로 속도를 조절한다.
  // TODO: flowSpeed는 실 데이터로 튜닝 필요.
  useFlowIcons(vBase, visible, onBaseIcons, {
    particleCount: nationwideDensity,
    flowSpeed: 0.5,
    minAge: 0.5,
    ageJitter: 3,
    maxDt: 0.05,
    fadeIn: 0.6,
    fadeOut: 1,
  });
  useFlowIcons(vDetail, visible, onDetailIcons, {
    particleCount: portDensity,
    flowSpeed: 0.01,
    minAge: 1,
    ageJitter: 1.5,
    maxDt: 0.05,
    fadeIn: 0.3,
    fadeOut: 0.5,
  });

  useEffect(() => () => registry.removeLayerGroup(groupId), [registry, groupId]);

  return null;
}
