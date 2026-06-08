import { useEffect, useRef } from 'react';
import { normalizeValue, type ColorLut } from '@/lib/colorMap';
import {
  createVelocityField,
  type VelocityField,
} from '../lib/velocityField';
import type { VectorMesh } from '../types';

/** LineLayer binary attribute로 바로 올릴 trail 세그먼트 버퍼. */
export interface FlowSegments {
  sources: Float32Array; // segCount * 3
  targets: Float32Array; // segCount * 3
  colors: Uint8Array; // segCount * 4
  count: number;
}

const TRAIL_COLOR: readonly [number, number, number] = [180, 220, 255];
const HEAD_ALPHA = 230;
const DEG2RAD = Math.PI / 180;

/** 흐름 시뮬레이션 튜닝 파라미터. */
export interface FlowParams {
  /** 파티클 수(density). 클수록 촘촘하다. */
  particleCount: number;
  /** 파티클당 trail 점 개수. 세그먼트는 (trailLength - 1)개. */
  trailLength: number;
  /** (u, v) 크기(m/s 가정) → 위도(deg)/초 이동량. 실데이터로 튜닝 필요. */
  flowSpeed: number;
  /** 파티클 최소 수명(초). staggered respawn을 위해 ageJitter만큼 ±랜덤. */
  minAge: number;
  /** 수명 랜덤 가산폭(초). */
  ageJitter: number;
  /** dt 폭주 방지 상한(초, 탭 비활성 후 복귀 등). */
  maxDt: number;
  /**
   * 주어지면 각 trail 점의 유속(|(u, v)|)을 이 LUT로 조회해 선 색을 입힌다.
   * null이면 고정색(TRAIL_COLOR). 버퍼 크기와 무관하므로 dynRef로 즉시 반영된다.
   */
  speedColorLut?: ColorLut | null;
}

interface Sim {
  px: Float32Array;
  py: Float32Array;
  age: Float32Array;
  maxAge: Float32Array;
  trailX: Float32Array; // PARTICLE_COUNT * TRAIL_LENGTH
  trailY: Float32Array;
  trailS: Float32Array; // 각 trail 점의 유속(|(u, v)|). 색 매핑용.
  /** 유효 trail 점 개수(1..TRAIL_LENGTH). 생성 시 자라고 소멸 시 줄어든다. */
  len: Float32Array;
  /** 소멸 진행 중이면 1. 머리는 멈추고 꼬리가 끝점까지 따라붙는다. */
  dying: Uint8Array;
  seeded: boolean;
}

interface BufferSet {
  sources: Float32Array;
  targets: Float32Array;
  colors: Uint8Array;
}

function makeBuffer(segCount: number): BufferSet {
  return {
    sources: new Float32Array(segCount * 3),
    targets: new Float32Array(segCount * 3),
    colors: new Uint8Array(segCount * 4),
  };
}

function makeSim(particleCount: number, trailLength: number): Sim {
  return {
    px: new Float32Array(particleCount),
    py: new Float32Array(particleCount),
    age: new Float32Array(particleCount),
    maxAge: new Float32Array(particleCount),
    trailX: new Float32Array(particleCount * trailLength),
    trailY: new Float32Array(particleCount * trailLength),
    trailS: new Float32Array(particleCount * trailLength),
    len: new Float32Array(particleCount),
    dying: new Uint8Array(particleCount),
    seeded: false,
  };
}

/** 파티클 i를 실제 삼각형 내부(=자료가 있는 곳) 임의 지점에 재배치하고 trail을 한 점으로 접는다. */
function respawn(
  sim: Sim,
  field: VelocityField,
  i: number,
  trailLength: number,
  minAge: number,
  ageJitter: number,
): void {
  const seed: [number, number] = [0, 0];
  field.randomPointInMesh(seed);
  const lon = seed[0];
  const lat = seed[1];
  sim.px[i] = lon;
  sim.py[i] = lat;
  sim.age[i] = 0;
  sim.maxAge[i] = minAge + Math.random() * ageJitter;
  sim.len[i] = 1;
  sim.dying[i] = 0;
  const base = i * trailLength;
  for (let k = 0; k < trailLength; k++) {
    sim.trailX[base + k] = lon;
    sim.trailY[base + k] = lat;
    sim.trailS[base + k] = 0;
  }
}

/**
 * 속도장 위로 파티클을 흘려보내며 trail 세그먼트를 매 프레임 갱신한다.
 * 만든 FlowSegments는 onSegments 콜백으로 넘긴다(비표시/언마운트 시 null).
 *
 * React state를 거치지 않고 rAF 루프에서 직접 콜백을 호출 → 컴포넌트 리렌더 없이
 * 매 프레임 deck registry에 upsert할 수 있다. 더블 버퍼를 번갈아 채워 새 참조를 넘긴다.
 * field는 mesh가 바뀔 때만 재생성하고 파티클 상태는 유지 → timestamp 스크럽에도 흐름이 끊기지 않는다.
 */
export function useFlowLines(
  mesh: VectorMesh,
  visible: boolean,
  onSegments: (segments: FlowSegments | null) => void,
  params: FlowParams,
): void {
  const { particleCount, trailLength } = params;

  // rAF 루프가 매 프레임 최신 콜백을 쓰도록 ref로 들고, 콜백 교체가 effect를 재기동하지 않게 한다.
  const cbRef = useRef(onSegments);
  cbRef.current = onSegments;

  // 버퍼 크기와 무관한 파라미터(flowSpeed/minAge/ageJitter/maxDt)는 ref로 들어
  // effect 재기동(흐름 끊김) 없이 매 프레임 최신값으로 반영한다.
  const dynRef = useRef(params);
  dynRef.current = params;

  const fieldRef = useRef<VelocityField | null>(null);
  const simRef = useRef<Sim | null>(null);
  const buffersRef = useRef<[BufferSet, BufferSet] | null>(null);
  const flipRef = useRef(0);

  // mesh 변경 시 속도장만 교체 (파티클은 유지).
  useEffect(() => {
    fieldRef.current = createVelocityField(mesh);
    if (!fieldRef.current) {
      // mesh가 비면(예: 항구→전국 전환으로 디테일 슬롯이 EMPTY) 속도장이 없어
      // 더 이상 세그먼트를 못 만든다. 등록된 그룹에 남은 잔상이 안 보이도록 비운다.
      if (simRef.current) simRef.current.seeded = false;
      cbRef.current(null);
    }
  }, [mesh]);

  useEffect(() => {
    if (!visible) {
      cbRef.current(null);
      return;
    }

    const segCount = particleCount * (trailLength - 1);
    // 크기에 영향을 주는 파라미터(particleCount/trailLength) 변경 시에만 버퍼/sim을 재생성
    // → 흐름이 리셋된다. 나머지 파라미터는 dynRef로 즉시 반영(끊김 없음).
    // (timestamp 스크럽으로는 effect가 재실행되지 않아 흐름이 유지된다.)
    if (!buffersRef.current || buffersRef.current[0].colors.length !== segCount * 4) {
      buffersRef.current = [makeBuffer(segCount), makeBuffer(segCount)];
    }
    if (
      !simRef.current ||
      simRef.current.px.length !== particleCount ||
      simRef.current.trailX.length !== particleCount * trailLength
    ) {
      simRef.current = makeSim(particleCount, trailLength);
    }

    let raf = 0;
    let last = 0;
    const vel: [number, number] = [0, 0];

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const field = fieldRef.current;
      const sim = simRef.current!;
      const { flowSpeed, minAge, ageJitter, maxDt } = dynRef.current;
      const dt = last ? Math.min((now - last) / 1000, maxDt) : 0;
      last = now;

      if (!field) return;
      if (!sim.seeded) {
        for (let i = 0; i < particleCount; i++)
          respawn(sim, field, i, trailLength, minAge, ageJitter);
        sim.seeded = true;
      }

      for (let i = 0; i < particleCount; i++) {
        // 소멸 중: 머리는 멈춘 채 꼬리가 끝점으로 따라붙어 trail이 줄어든다.
        if (sim.dying[i]) {
          sim.len[i] -= 1;
          if (sim.len[i] <= 1) respawn(sim, field, i, trailLength, minAge, ageJitter);
          continue;
        }

        sim.age[i] += dt;
        const px = sim.px[i];
        const py = sim.py[i];
        if (sim.age[i] > sim.maxAge[i] || !field.sample(px, py, vel)) {
          // 즉시 사라지지 않고 소멸 단계로 진입 (꼬리가 끝점까지 수축).
          sim.dying[i] = 1;
          continue;
        }
        // 현재 위치를 trail head로 기록 후 전진. vel은 (px, py)에서 샘플한 속도라
        // 그 크기를 head 점의 유속으로 같이 기록한다(색 매핑용).
        const base = i * trailLength;
        for (let k = trailLength - 1; k > 0; k--) {
          sim.trailX[base + k] = sim.trailX[base + k - 1];
          sim.trailY[base + k] = sim.trailY[base + k - 1];
          sim.trailS[base + k] = sim.trailS[base + k - 1];
        }
        sim.trailX[base] = px;
        sim.trailY[base] = py;
        sim.trailS[base] = Math.hypot(vel[0], vel[1]);
        if (sim.len[i] < trailLength) sim.len[i] += 1;
        const cosLat = Math.max(Math.cos(py * DEG2RAD), 0.01);
        sim.px[i] = px + (vel[0] * flowSpeed * dt) / cosLat;
        sim.py[i] = py + vel[1] * flowSpeed * dt;
      }

      // trail → 세그먼트 버퍼 채우기 (더블 버퍼 번갈아).
      const buf = buffersRef.current![flipRef.current];
      flipRef.current ^= 1;
      const { sources, targets, colors } = buf;
      const segPerParticle = trailLength - 1;
      const [r, g, b] = TRAIL_COLOR;
      const lut = dynRef.current.speedColorLut;
      const lutLast = lut ? lut.size - 1 : 0;
      for (let i = 0; i < particleCount; i++) {
        const base = i * trailLength;
        // 유효 trail 점 len개 → 그릴 세그먼트는 (len - 1)개.
        const validSeg = sim.len[i] - 1;
        for (let k = 0; k < segPerParticle; k++) {
          const seg = i * segPerParticle + k;
          const s3 = seg * 3;
          const c4 = seg * 4;
          if (k >= validSeg) {
            // 아직 안 자란/소멸로 줄어든 구간: 투명 처리해 숨긴다.
            colors[c4 + 3] = 0;
            continue;
          }
          sources[s3] = sim.trailX[base + k];
          sources[s3 + 1] = sim.trailY[base + k];
          sources[s3 + 2] = 0;
          targets[s3] = sim.trailX[base + k + 1];
          targets[s3 + 1] = sim.trailY[base + k + 1];
          targets[s3 + 2] = 0;
          if (lut) {
            // 유속을 LUT로 조회해 색을 정한다. alpha는 head→tail 페이드 유지.
            const t = normalizeValue(
              sim.trailS[base + k],
              lut.min,
              lut.max,
              lut.scale,
            );
            const o = ((t * lutLast + 0.5) | 0) * 4;
            colors[c4] = lut.rgba[o] * 255;
            colors[c4 + 1] = lut.rgba[o + 1] * 255;
            colors[c4 + 2] = lut.rgba[o + 2] * 255;
          } else {
            colors[c4] = r;
            colors[c4 + 1] = g;
            colors[c4 + 2] = b;
          }
          colors[c4 + 3] = Math.round(HEAD_ALPHA * (1 - k / segPerParticle));
        }
      }

      cbRef.current({ sources, targets, colors, count: segCount });
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      cbRef.current(null);
    };
  }, [visible, particleCount, trailLength]);
}
