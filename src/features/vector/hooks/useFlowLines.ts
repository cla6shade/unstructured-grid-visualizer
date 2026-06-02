import { useEffect, useRef } from 'react';
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

const PARTICLE_COUNT = 4000;
/** 파티클당 trail 점 개수. 세그먼트는 (TRAIL_LENGTH - 1)개. */
const TRAIL_LENGTH = 100;
/** (u, v) 크기(m/s 가정) → 위도(deg)/초 이동량. 실데이터로 튜닝 필요. */
const FLOW_SPEED = 2;
/** 파티클 수명(초). staggered respawn을 위해 ±랜덤. */
const MIN_AGE = 3;
const AGE_JITTER = 3;
/** dt 폭주 방지(탭 비활성 후 복귀 등). */
const MAX_DT = 0.05;
const TRAIL_COLOR: readonly [number, number, number] = [180, 220, 255];
const HEAD_ALPHA = 230;
const DEG2RAD = Math.PI / 180;

interface Sim {
  px: Float32Array;
  py: Float32Array;
  age: Float32Array;
  maxAge: Float32Array;
  trailX: Float32Array; // PARTICLE_COUNT * TRAIL_LENGTH
  trailY: Float32Array;
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

function makeSim(): Sim {
  return {
    px: new Float32Array(PARTICLE_COUNT),
    py: new Float32Array(PARTICLE_COUNT),
    age: new Float32Array(PARTICLE_COUNT),
    maxAge: new Float32Array(PARTICLE_COUNT),
    trailX: new Float32Array(PARTICLE_COUNT * TRAIL_LENGTH),
    trailY: new Float32Array(PARTICLE_COUNT * TRAIL_LENGTH),
    len: new Float32Array(PARTICLE_COUNT),
    dying: new Uint8Array(PARTICLE_COUNT),
    seeded: false,
  };
}

/** 파티클 i를 mesh 내부 임의 지점에 재배치하고 trail을 한 점으로 접는다. */
function respawn(sim: Sim, field: VelocityField, i: number): void {
  const probe: [number, number] = [0, 0];
  let lon = 0;
  let lat = 0;
  for (let attempt = 0; attempt < 8; attempt++) {
    lon = field.minLon + Math.random() * (field.maxLon - field.minLon);
    lat = field.minLat + Math.random() * (field.maxLat - field.minLat);
    if (field.sample(lon, lat, probe)) break;
  }
  sim.px[i] = lon;
  sim.py[i] = lat;
  sim.age[i] = 0;
  sim.maxAge[i] = MIN_AGE + Math.random() * AGE_JITTER;
  sim.len[i] = 1;
  sim.dying[i] = 0;
  const base = i * TRAIL_LENGTH;
  for (let k = 0; k < TRAIL_LENGTH; k++) {
    sim.trailX[base + k] = lon;
    sim.trailY[base + k] = lat;
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
): void {
  // rAF 루프가 매 프레임 최신 콜백을 쓰도록 ref로 들고, 콜백 교체가 effect를 재기동하지 않게 한다.
  const cbRef = useRef(onSegments);
  cbRef.current = onSegments;

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

    const segCount = PARTICLE_COUNT * (TRAIL_LENGTH - 1);
    if (!buffersRef.current) {
      buffersRef.current = [makeBuffer(segCount), makeBuffer(segCount)];
    }
    if (!simRef.current) simRef.current = makeSim();

    let raf = 0;
    let last = 0;
    const vel: [number, number] = [0, 0];

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const field = fieldRef.current;
      const sim = simRef.current!;
      const dt = last ? Math.min((now - last) / 1000, MAX_DT) : 0;
      last = now;

      if (!field) return;
      if (!sim.seeded) {
        for (let i = 0; i < PARTICLE_COUNT; i++) respawn(sim, field, i);
        sim.seeded = true;
      }

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // 소멸 중: 머리는 멈춘 채 꼬리가 끝점으로 따라붙어 trail이 줄어든다.
        if (sim.dying[i]) {
          sim.len[i] -= 1;
          if (sim.len[i] <= 1) respawn(sim, field, i);
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
        // 현재 위치를 trail head로 기록 후 전진.
        const base = i * TRAIL_LENGTH;
        for (let k = TRAIL_LENGTH - 1; k > 0; k--) {
          sim.trailX[base + k] = sim.trailX[base + k - 1];
          sim.trailY[base + k] = sim.trailY[base + k - 1];
        }
        sim.trailX[base] = px;
        sim.trailY[base] = py;
        if (sim.len[i] < TRAIL_LENGTH) sim.len[i] += 1;
        const cosLat = Math.max(Math.cos(py * DEG2RAD), 0.01);
        sim.px[i] = px + (vel[0] * FLOW_SPEED * dt) / cosLat;
        sim.py[i] = py + vel[1] * FLOW_SPEED * dt;
      }

      // trail → 세그먼트 버퍼 채우기 (더블 버퍼 번갈아).
      const buf = buffersRef.current![flipRef.current];
      flipRef.current ^= 1;
      const { sources, targets, colors } = buf;
      const segPerParticle = TRAIL_LENGTH - 1;
      const [r, g, b] = TRAIL_COLOR;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const base = i * TRAIL_LENGTH;
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
          colors[c4] = r;
          colors[c4 + 1] = g;
          colors[c4 + 2] = b;
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
  }, [visible]);
}
