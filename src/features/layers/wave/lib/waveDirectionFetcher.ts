import type { VectorTileFetcher } from '@/features/vector/types';
import { waveSource } from './waveSource';

const DEG2RAD = Math.PI / 180;

/**
 * Wave direction(THETAW) flow fetcher. THETAW를 노드별 단위 (u, v)로 변환한다.
 * 규약: 해양학 'to'(파랑 진행 방향), 북(0°) 기준 시계방향 → u=sin(θ), v=cos(θ).
 * 방향을 뒤집어야 하면 아래 두 부호만 바꾸면 된다(예: from↔to는 둘 다 음수).
 * 크기는 1(단위벡터)이라 입자 속도는 useFlowLines의 flowSpeed가 결정한다.
 */
export const waveDirectionFetcher: VectorTileFetcher = {
  ...waveSource,
  toVectors: (values) => {
    const theta = values['THETAW'];
    const n = theta.length;
    const out = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const r = theta[i] * DEG2RAD;
      out[i * 2] = Math.sin(r);
      out[i * 2 + 1] = Math.cos(r);
    }
    return out;
  },
};
