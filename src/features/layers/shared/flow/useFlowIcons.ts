import { useEffect, useRef } from 'react';
import {
  createVelocityField,
  type VelocityField,
} from './velocityField';
import type { VectorMesh } from './types';

/** IconLayer binary attribute로 바로 올릴 입자별 아이콘 버퍼. */
export interface FlowIcons {
  positions: Float32Array; // count * 3
  angles: Float32Array; // count (deg, CCW+)
  colors: Uint8Array; // count * 4
  count: number;
}

const ICON_COLOR: readonly [number, number, number] = [180, 220, 255];
const MAX_ALPHA = 230;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/** 아이콘 흐름 시뮬레이션 튜닝 파라미터(트레일 없음, 입자=아이콘 1개). */
export interface IconFlowParams {
  /** 입자 수(density). */
  particleCount: number;
  /** (u, v) 크기 → 위도(deg)/초 이동량. */
  flowSpeed: number;
  /** 입자 최소 수명(초). ageJitter만큼 ±랜덤. */
  minAge: number;
  /** 수명 랜덤 가산폭(초). */
  ageJitter: number;
  /** dt 폭주 방지 상한(초). */
  maxDt: number;
  /** 스폰 직후 불투명도가 0→1로 차는 시간(초). */
  fadeIn: number;
  /** 소멸 직전 1→0으로 빠지는 시간(초). */
  fadeOut: number;
}

interface Sim {
  px: Float32Array;
  py: Float32Array;
  age: Float32Array;
  maxAge: Float32Array;
  /** 진행 방향(마지막 샘플 속도). 아이콘 회전각 계산에 쓴다. */
  dx: Float32Array;
  dy: Float32Array;
  seeded: boolean;
}

interface BufferSet {
  positions: Float32Array;
  angles: Float32Array;
  colors: Uint8Array;
}

function makeBuffer(count: number): BufferSet {
  return {
    positions: new Float32Array(count * 3),
    angles: new Float32Array(count),
    colors: new Uint8Array(count * 4),
  };
}

function makeSim(count: number): Sim {
  return {
    px: new Float32Array(count),
    py: new Float32Array(count),
    age: new Float32Array(count),
    maxAge: new Float32Array(count),
    dx: new Float32Array(count),
    dy: new Float32Array(count),
    seeded: false,
  };
}

/** 입자 i를 mesh 내부 임의 지점에 재배치하고 초기 방향을 샘플한다. */
function respawn(
  sim: Sim,
  field: VelocityField,
  i: number,
  minAge: number,
  ageJitter: number,
): void {
  const seed: [number, number] = [0, 0];
  field.randomPointInMesh(seed);
  sim.px[i] = seed[0];
  sim.py[i] = seed[1];
  sim.age[i] = 0;
  sim.maxAge[i] = minAge + Math.random() * ageJitter;
  const vel: [number, number] = [0, 1];
  field.sample(seed[0], seed[1], vel);
  sim.dx[i] = vel[0];
  sim.dy[i] = vel[1];
}

/**
 * useFlowLines의 아이콘판. 트레일 대신 입자마다 SVG 아이콘 1개를 진행 방향으로
 * 회전시켜 그리고, 수명(fadeIn/fadeOut)에 따라 opacity를 변조한다.
 * 만든 FlowIcons는 onIcons 콜백으로 넘긴다(비표시/언마운트 시 null).
 * 흐름/밀도 동작은 useFlowLines와 동일한 규약(rAF 직접 콜백, mesh 변경 시 속도장만 교체).
 */
export function useFlowIcons(
  mesh: VectorMesh,
  visible: boolean,
  onIcons: (icons: FlowIcons | null) => void,
  params: IconFlowParams,
): void {
  const { particleCount } = params;

  const cbRef = useRef(onIcons);
  cbRef.current = onIcons;
  const dynRef = useRef(params);
  dynRef.current = params;

  const fieldRef = useRef<VelocityField | null>(null);
  const simRef = useRef<Sim | null>(null);
  const buffersRef = useRef<[BufferSet, BufferSet] | null>(null);
  const flipRef = useRef(0);

  useEffect(() => {
    fieldRef.current = createVelocityField(mesh);
    if (!fieldRef.current) {
      if (simRef.current) simRef.current.seeded = false;
      cbRef.current(null);
    }
  }, [mesh]);

  useEffect(() => {
    if (!visible) {
      cbRef.current(null);
      return;
    }

    if (!buffersRef.current || buffersRef.current[0].angles.length !== particleCount) {
      buffersRef.current = [makeBuffer(particleCount), makeBuffer(particleCount)];
    }
    if (!simRef.current || simRef.current.px.length !== particleCount) {
      simRef.current = makeSim(particleCount);
    }

    let raf = 0;
    let last = 0;
    const vel: [number, number] = [0, 0];

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const field = fieldRef.current;
      const sim = simRef.current!;
      const { flowSpeed, minAge, ageJitter, maxDt, fadeIn, fadeOut } =
        dynRef.current;
      const dt = last ? Math.min((now - last) / 1000, maxDt) : 0;
      last = now;

      if (!field) return;
      if (!sim.seeded) {
        for (let i = 0; i < particleCount; i++)
          respawn(sim, field, i, minAge, ageJitter);
        sim.seeded = true;
      }

      for (let i = 0; i < particleCount; i++) {
        sim.age[i] += dt;
        const px = sim.px[i];
        const py = sim.py[i];
        if (sim.age[i] > sim.maxAge[i] || !field.sample(px, py, vel)) {
          respawn(sim, field, i, minAge, ageJitter);
          continue;
        }
        sim.dx[i] = vel[0];
        sim.dy[i] = vel[1];
        const cosLat = Math.max(Math.cos(py * DEG2RAD), 0.01);
        sim.px[i] = px + (vel[0] * flowSpeed * dt) / cosLat;
        sim.py[i] = py + vel[1] * flowSpeed * dt;
      }

      const buf = buffersRef.current![flipRef.current];
      flipRef.current ^= 1;
      const { positions, angles, colors } = buf;
      const [r, g, b] = ICON_COLOR;
      for (let i = 0; i < particleCount; i++) {
        const p3 = i * 3;
        positions[p3] = sim.px[i];
        positions[p3 + 1] = sim.py[i];
        positions[p3 + 2] = 0;
        // 진행 방향으로 회전. 아이콘은 기본 위(↑)를 향하고 deck getAngle은 CCW(+)라
        // 북기준 시계방향 heading θ=atan2(dx,dy)에 대해 -θ로 돌린다.
        // 화면상 90° 시계방향으로 치우쳐, CCW로 90° 보정(아이콘 기준축 오프셋).
        angles[i] = -Math.atan2(sim.dx[i], sim.dy[i]) * RAD2DEG + 90;
        // 수명에 따른 opacity: 스폰 직후 fade-in, 소멸 직전 fade-out.
        const age = sim.age[i];
        const remain = sim.maxAge[i] - age;
        const t = Math.min(
          fadeIn > 0 ? age / fadeIn : 1,
          fadeOut > 0 ? remain / fadeOut : 1,
          1,
        );
        const c4 = i * 4;
        colors[c4] = r;
        colors[c4 + 1] = g;
        colors[c4 + 2] = b;
        colors[c4 + 3] = Math.round(MAX_ALPHA * (t < 0 ? 0 : t));
      }

      cbRef.current({ positions, angles, colors, count: particleCount });
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      cbRef.current(null);
    };
  }, [visible, particleCount]);
}
