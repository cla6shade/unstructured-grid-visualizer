import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Layer as DeckLayer } from '@deck.gl/core';
import { useDeckLayersRegistry } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { useContourSurface } from '@/features/layers/shared/surface/useContourSurface';
import { createContourLayer } from '@/features/layers/shared/surface/createContourLayer';
import { useVectorSurface } from '@/features/layers/shared/flow/useVectorSurface';
import {
  useFlowIcons,
  type FlowIcons,
} from '@/features/layers/shared/flow/useFlowIcons';
import { createFlowIconLayer } from '@/features/layers/shared/flow/createFlowIconLayer';
import { useReportInitialLoad } from '@/features/map/loading/hooks/useReportInitialLoad';
import { useDensityStore } from '@/features/map/density/store/densityStore';
import { useBoundaryMask } from '@/features/layers/boundary/hooks/useBoundaryMask';
import { localMaskProps } from '@/features/layers/boundary/lib/maskProps';
import { waveHeightFetcher } from '@/features/layers/wave/lib/waveHeightFetcher';
import { waveDirectionFetcher } from '@/features/layers/wave/lib/waveDirectionFetcher';

const WAVE_GROUP_ID = 'wave';
const WAVE_ZINDEX = 30;

/**
 * Wave 레이어: WH(파고) contour + THETAW(파향) 방향 아이콘(SVG)을 하나의 deck
 * registry 그룹(WAVE_GROUP_ID)으로 묶어 등록한다. 배열 앞쪽이 아래로 그려지므로
 * [contour..., icon...] 순서로 둬서 파고 위에 파향 화살표가 얹힌다.
 *
 * 아이콘 입자는 rAF로 매 프레임 갱신되고(진행 방향 회전 + 수명 페이드 opacity),
 * contour는 timestamp 스크럽 시에만 바뀐다. 둘 다 ref에 보관하고 공통 pushCombined()가
 * 결합 배열을 upsert한다(해류처럼 React 리렌더 회피). 밀도는 해류 슬라이더(useDensityStore) 공유.
 */
export function WaveLayer() {
  const visible = useLayerStore((s) => s.layers.wave);
  const {
    base: cBase,
    detail: cDetail,
    isLoaded: contourLoaded,
    detailLoaded: cDetailLoaded,
  } = useContourSurface(waveHeightFetcher, visible);
  const {
    base: vBase,
    detail: vDetail,
    isLoaded: vectorLoaded,
    detailLoaded: vDetailLoaded,
  } = useVectorSurface(waveDirectionFetcher, visible);

  const nationwideDensity = useDensityStore((s) => s.nationwide);
  const portDensity = useDensityStore((s) => s.port);
  useReportInitialLoad('wave', visible && contourLoaded && vectorLoaded);

  // boundaryReady = 항구 && zoom>=11 && boundary geojson 로드 완료.
  const boundaryReady = useBoundaryMask().isLoaded;
  // base는 boundary 바깥(해당 디테일 도착 후 컷), detail은 마스크 준비 시에만 그려 boundary 안쪽 클리핑.
  // contour와 icon(vector)의 디테일 로드 시점이 달라 base 컷 gating을 각각 따로 둔다.
  const cBaseActive = boundaryReady && cDetailLoaded;
  const vBaseActive = boundaryReady && vDetailLoaded;
  const cBaseMask = useMemo(() => localMaskProps(cBaseActive, true), [cBaseActive]);
  const vBaseMask = useMemo(() => localMaskProps(vBaseActive, true), [vBaseActive]);
  const detailMask = useMemo(() => localMaskProps(true, false), []);

  const registry = useDeckLayersRegistry();
  const groupId = WAVE_GROUP_ID;

  // 결합 등록의 각 조각을 ref에 보관한다. contour는 useMemo로, 아이콘 입자는 rAF 콜백으로 갱신.
  const contourLayersRef = useRef<DeckLayer[]>([]);
  const baseIconRef = useRef<FlowIcons | null>(null);
  const detailIconRef = useRef<FlowIcons | null>(null);

  const pushCombined = useCallback(() => {
    const icons: DeckLayer[] = [];
    if (baseIconRef.current) {
      icons.push(
        createFlowIconLayer({
          id: `${groupId}-icon-base`,
          icons: baseIconRef.current,
          visible: true,
          ...vBaseMask,
        }),
      );
    }
    if (detailIconRef.current) {
      icons.push(
        createFlowIconLayer({
          id: `${groupId}-icon-detail`,
          icons: detailIconRef.current,
          visible: true,
          ...detailMask,
        }),
      );
    }
    const layers = [...contourLayersRef.current, ...icons];
    if (layers.length === 0) {
      registry.removeLayerGroup(groupId);
      return;
    }
    registry.upsertLayerGroup(groupId, layers, WAVE_ZINDEX);
  }, [registry, groupId, vBaseMask, detailMask]);

  // contour base/detail은 timestamp/뷰포트 변경 시에만 바뀐다.
  // detail이 EMPTY면 ContourSurface가 모델을 안 만들어 무해(전국 뷰).
  // detail contour는 마스크 준비 시에만 그린다(마스크 없이 그리면 base와 겹친다).
  const contourLayers = useMemo<DeckLayer[]>(() => {
    if (!visible) return [];
    const layers: DeckLayer[] = [
      createContourLayer({
        id: `${groupId}-contour-base`,
        surface: cBase,
        visible,
        ...cBaseMask,
      }),
    ];
    if (boundaryReady) {
      layers.push(
        createContourLayer({
          id: `${groupId}-contour-detail`,
          surface: cDetail,
          visible,
          ...detailMask,
        }),
      );
    }
    return layers;
  }, [groupId, cBase, cDetail, visible, boundaryReady, cBaseMask, detailMask]);
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
  useFlowIcons(vDetail, visible && boundaryReady, onDetailIcons, {
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
