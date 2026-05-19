import type { LatLngBound } from '@/features/map/viewport/types';
import type { CurrentField } from './currentField';
import { buildTriangleIndex } from './triangleIndex';
import {
  createParticles,
  createLineBuffers,
  stepParticles,
} from './particleSimulator';
import type { LineBuffers, SimulatorConfig } from './particleSimulator';

const INDEX_CELL_SIZE = 0.02;

/**
 * current 파티클 시뮬레이션. 메인 스레드에서 동기로 구동된다.
 * field/zoom/bounds가 바뀌면 호출부에서 새 인스턴스를 만들어 쓴다(증분 갱신 없음).
 * 빈 field여도 삼각망이 비어 있을 뿐 안전하게 동작한다(파티클이 그려지지 않음).
 */
export interface CurrentSimulation {
  /** 한 프레임 전진시키고 렌더용 라인 버퍼를 반환한다. */
  step(dt: number): LineBuffers;
}

export function createCurrentSimulation(
  field: CurrentField,
  config: SimulatorConfig,
  bounds: LatLngBound,
): CurrentSimulation {
  const triIndex = buildTriangleIndex(
    field.pointsData,
    field.pointsLoaded,
    field.triangles.subarray(0, field.triCount * 3),
    field.west,
    field.south,
    field.east,
    field.north,
    INDEX_CELL_SIZE,
  );
  const particles = createParticles(config, bounds, field, triIndex);
  const buffer = createLineBuffers(config.maxParticles, config.trailLength);

  return {
    step(dt) {
      stepParticles(particles, field, triIndex, bounds, config, buffer, dt);
      return buffer;
    },
  };
}
