import { IconLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import { MASK_EXTENSIONS } from '@/features/layers/coastline/lib/maskExtension';
import type { FlowIcons } from './useFlowIcons';

// 흐름 진행 방향 화살표 글리프(기본 위쪽 ↑). mask:true라 getColor로 색·alpha를 입힌다.
const ARROW_SVG =
  '<svg width="32" height="44" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M21.3333 16.2462L0 21.6615L21.3333 27.0769L16 44L32 21.6615L16 0L21.3333 16.2462Z" fill="white"/>' +
  '</svg>';

const ARROW_ICON = {
  url: `data:image/svg+xml;base64,${btoa(ARROW_SVG)}`,
  width: 32,
  height: 44,
  anchorX: 16,
  anchorY: 22,
  mask: true,
} as const;

export interface FlowIconLayerProps {
  id: string;
  icons: FlowIcons;
  visible: boolean;
  maskId?: string;
  maskInverted?: boolean;
}

/**
 * useFlowIcons가 만든 입자별 위치/각도/색을 deck.gl IconLayer로 그린다.
 * 화살표 SVG를 mask로 써서 getColor의 alpha(수명 페이드)가 그대로 불투명도가 된다.
 * 버퍼는 매 프레임 새 참조로 들어와 attribute가 재업로드된다.
 */
export function createFlowIconLayer({
  id,
  icons,
  visible,
  maskId,
  maskInverted = false,
}: FlowIconLayerProps): Layer {
  const { positions, angles, colors, count } = icons;
  return new IconLayer({
    id,
    visible,
    data: {
      length: count,
      attributes: {
        getPosition: { value: positions, size: 3 },
        getAngle: { value: angles, size: 1 },
        getColor: { value: colors, size: 4 },
      },
    },
    getIcon: () => ARROW_ICON,
    getSize: 18,
    sizeUnits: 'pixels',
    // mask alpha 그라데이션이 잘리지 않도록 컷오프 해제.
    alphaCutoff: 0,
    ...(maskId ? { extensions: MASK_EXTENSIONS, maskId, maskInverted } : {}),
  });
}
