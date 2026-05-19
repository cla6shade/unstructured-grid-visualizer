import { LineLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { LatLngBound } from '@/features/map/viewport/types';
import { MASK_EXTENSIONS } from '@/features/layers/coastline/lib/maskExtension';
import { COASTLINE_MASK_ID } from '@/features/layers/coastline/constants';
import type { LineBuffers } from './particleSimulator';

const LAYER_ID = 'current-particle-lines';

/**
 * 시뮬레이션 라인 버퍼를 deck.gl LineLayer로 변환하는 빌더.
 * RAF 루프에서 매 프레임 호출되므로 scratch 버퍼를 재사용해 할당을 피한다.
 */
export interface CurrentLineLayerBuilder {
  build(buf: LineBuffers, bounds: LatLngBound): Layer | null;
}

export function createCurrentLineLayer(): CurrentLineLayerBuilder {
  let src = new Float32Array(0);
  let tgt = new Float32Array(0);
  let colors = new Uint8ClampedArray(0);

  return {
    build(buf, bounds) {
      if (buf.count === 0) return null;

      // 화면 밖 라인은 버린다. bounds를 10% 패딩해 가장자리 끊김을 줄인다.
      const padLng = (bounds.ne.lng - bounds.sw.lng) * 0.1;
      const padLat = (bounds.ne.lat - bounds.sw.lat) * 0.1;
      const west = bounds.sw.lng - padLng;
      const east = bounds.ne.lng + padLng;
      const south = bounds.sw.lat - padLat;
      const north = bounds.ne.lat + padLat;

      if (src.length < buf.count * 3) {
        src = new Float32Array(buf.count * 3);
        tgt = new Float32Array(buf.count * 3);
        colors = new Uint8ClampedArray(buf.count * 4);
      }

      let j = 0;
      for (let i = 0; i < buf.count; i++) {
        const pIdx = i * 4;
        const sLng = buf.positions[pIdx];
        const sLat = buf.positions[pIdx + 1];
        const tLng = buf.positions[pIdx + 2];
        const tLat = buf.positions[pIdx + 3];
        const sIn = sLng >= west && sLng <= east && sLat >= south && sLat <= north;
        const tIn = tLng >= west && tLng <= east && tLat >= south && tLat <= north;
        if (!sIn && !tIn) continue;

        const o3 = j * 3;
        src[o3] = sLng;
        src[o3 + 1] = sLat;
        src[o3 + 2] = 0;
        tgt[o3] = tLng;
        tgt[o3 + 1] = tLat;
        tgt[o3 + 2] = 0;

        const o4 = j * 4;
        colors[o4] = buf.colors[pIdx];
        colors[o4 + 1] = buf.colors[pIdx + 1];
        colors[o4 + 2] = buf.colors[pIdx + 2];
        colors[o4 + 3] = buf.colors[pIdx + 3];
        j++;
      }

      if (j === 0) return null;

      return new LineLayer({
        id: LAYER_ID,
        data: {
          length: j,
          attributes: {
            getSourcePosition: { value: src.subarray(0, j * 3), size: 3 },
            getTargetPosition: { value: tgt.subarray(0, j * 3), size: 3 },
            getColor: { value: colors.subarray(0, j * 4), size: 4 },
          },
        },
        widthUnits: 'pixels',
        getWidth: 2.5,
        extensions: MASK_EXTENSIONS,
        maskId: COASTLINE_MASK_ID,
        maskInverted: true,
      });
    },
  };
}
