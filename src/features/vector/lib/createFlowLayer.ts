import { LineLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import { MASK_EXTENSIONS } from '@/features/layers/coastline/lib/maskExtension';
import type { FlowSegments } from '../hooks/useFlowLines';

export interface FlowLayerProps {
  id: string;
  segments: FlowSegments;
  visible: boolean;
  maskId?: string;
  maskInverted?: boolean;
}

/**
 * useFlowLines가 만든 trail 세그먼트를 deck.gl LineLayer로 그린다.
 * 색상 alpha가 trail head→tail로 감소해 흐르는 잔상처럼 보인다.
 * 세그먼트 버퍼는 매 프레임 새 참조로 들어와 attribute가 재업로드된다.
 */
export function createFlowLayer({
  id,
  segments,
  visible,
  maskId,
  maskInverted = false,
}: FlowLayerProps): Layer {
  const { sources, targets, colors, count } = segments;
  return new LineLayer({
    id,
    visible,
    data: {
      length: count,
      attributes: {
        getSourcePosition: { value: sources, size: 3 },
        getTargetPosition: { value: targets, size: 3 },
        getColor: { value: colors, size: 4 },
      },
    },
    getWidth: 3,
    widthUnits: 'pixels',
    capRounded: true,
    ...(maskId ? { extensions: MASK_EXTENSIONS, maskId, maskInverted } : {}),
  });
}
