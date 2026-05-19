import type { CurrentField } from './currentField';
import { sampleCurrentField } from './currentField';
import type { TriangleIndex } from './triangleIndex';
import type { LatLngBound } from '@/features/map/viewport/types';

export interface SimulatorConfig {
  maxAge: number;
  speedFactor: number;
  trailLength: number;
  maxParticles: number;
}

export const DEFAULT_CONFIG: SimulatorConfig = {
  maxAge: 100,
  speedFactor: 0.005,
  trailLength: 40,
  maxParticles: 2500,
};

export interface LineBuffers {
  positions: Float32Array;
  colors: Uint8ClampedArray;
  count: number;
}

export function createLineBuffers(
  numParticles: number,
  trailLength: number,
): LineBuffers {
  const maxLines = numParticles * trailLength;
  return {
    positions: new Float32Array(maxLines * 4),
    colors: new Uint8ClampedArray(maxLines * 4),
    count: 0,
  };
}

export interface ParticleState {
  lng: Float64Array;
  lat: Float64Array;
  age: Float32Array;
  speed: Float32Array;
  trail: Float64Array;
  trailHead: Uint8Array;
  trailLen: Uint8Array;
  dying: Uint8Array;
  dyingAccum: Float32Array;
  count: number;
  trailCapacity: number;
  [key: string]: unknown;
}

export function spawnParticle(
  s: ParticleState,
  i: number,
  bounds: LatLngBound,
  field: CurrentField,
  index: TriangleIndex,
  maxAge: number,
): void {
  let lng = 0;
  let lat = 0;
  for (let tries = 0; tries < 6; tries++) {
    lng = bounds.sw.lng + Math.random() * (bounds.ne.lng - bounds.sw.lng);
    lat = bounds.sw.lat + Math.random() * (bounds.ne.lat - bounds.sw.lat);
    if (sampleCurrentField(field, index, lng, lat) !== null) break;
  }
  s.lng[i] = lng;
  s.lat[i] = lat;
  s.age[i] = Math.floor(Math.random() * maxAge);
  s.speed[i] = 0;
  s.trailHead[i] = 0;
  s.trailLen[i] = 0;
  s.dying[i] = 0;
  s.dyingAccum[i] = 0;
}

export function createParticles(
  config: SimulatorConfig,
  bounds: LatLngBound,
  field: CurrentField,
  index: TriangleIndex,
): ParticleState {
  const n = config.maxParticles;
  const tl = config.trailLength;

  const state: ParticleState = {
    lng: new Float64Array(n),
    lat: new Float64Array(n),
    age: new Float32Array(n),
    speed: new Float32Array(n),
    trail: new Float64Array(n * tl * 3),
    trailHead: new Uint8Array(n),
    trailLen: new Uint8Array(n),
    dying: new Uint8Array(n),
    dyingAccum: new Float32Array(n),
    count: n,
    trailCapacity: tl,
  };

  for (let i = 0; i < n; i++) {
    spawnParticle(state, i, bounds, field, index, config.maxAge);
  }

  return state;
}

// Particle lines are rendered white; alpha fades the trail with age.
function writeColor(
  colors: Uint8ClampedArray,
  offset: number,
  age: number,
  maxAge: number,
): void {
  const fadeFactor = age / maxAge;
  const alpha = 220 * (1 - fadeFactor * fadeFactor);

  colors[offset] = 255;
  colors[offset + 1] = 255;
  colors[offset + 2] = 255;
  colors[offset + 3] = alpha > 0 ? (alpha < 255 ? alpha : 255) : 0;
}

const BASE_DT = 1 / 60;

export function stepParticles(
  s: ParticleState,
  field: CurrentField,
  index: TriangleIndex,
  bounds: LatLngBound,
  config: SimulatorConfig,
  buf: LineBuffers,
  dt: number,
): void {
  const { maxAge, speedFactor } = config;
  const scale = dt / BASE_DT;
  const n = s.count;
  const tl = s.trailCapacity;
  let lineCount = 0;
  const positions = buf.positions;
  const colors = buf.colors;

  const west = bounds.sw.lng;
  const east = bounds.ne.lng;
  const south = bounds.sw.lat;
  const north = bounds.ne.lat;

  for (let i = 0; i < n; i++) {
    const base = i * tl * 3;

    if (s.dying[i]) {
      s.dyingAccum[i] += scale;
      const drain = Math.floor(s.dyingAccum[i]);
      if (drain > 0) {
        s.dyingAccum[i] -= drain;
        s.trailLen[i] = s.trailLen[i] > drain ? s.trailLen[i] - drain : 0;
      }

      if (s.trailLen[i] === 0) {
        spawnParticle(s, i, bounds, field, index, maxAge);
        continue;
      }

      const len = s.trailLen[i];
      const headNow = s.trailHead[i];
      const startSlot = (headNow - len + tl) % tl;

      for (let seg = 0; seg < len - 1; seg++) {
        const fromSlot = (startSlot + seg) % tl;
        const fromIdx = base + fromSlot * 3;
        const toSlot = (startSlot + seg + 1) % tl;
        const toIdx = base + toSlot * 3;

        const fromLng = s.trail[fromIdx];
        const fromLat = s.trail[fromIdx + 1];
        const toLng = s.trail[toIdx];
        const toLat = s.trail[toIdx + 1];

        const dx = toLng - fromLng;
        const dy = toLat - fromLat;
        if (dx * dx + dy * dy < 1e-14) continue;

        const segmentAge = s.age[i] - (len - seg);
        const pIdx = lineCount * 4;
        positions[pIdx] = fromLng;
        positions[pIdx + 1] = fromLat;
        positions[pIdx + 2] = toLng;
        positions[pIdx + 3] = toLat;
        writeColor(colors, pIdx, segmentAge > 0 ? segmentAge : 0, maxAge);
        lineCount++;
      }

      continue;
    }

    const outOfBounds =
      s.lng[i] < west ||
      s.lng[i] > east ||
      s.lat[i] < south ||
      s.lat[i] > north;
    const isDead = s.age[i] >= maxAge || outOfBounds;

    const sample = isDead
      ? null
      : sampleCurrentField(field, index, s.lng[i], s.lat[i]);

    if (isDead || !sample) {
      if (s.trailLen[i] === 0) {
        spawnParticle(s, i, bounds, field, index, maxAge);
        continue;
      }

      const head = s.trailHead[i];
      const tIdx = base + head * 3;
      s.trail[tIdx] = s.lng[i];
      s.trail[tIdx + 1] = s.lat[i];
      s.trail[tIdx + 2] = s.speed[i];
      s.trailHead[i] = (head + 1) % tl;
      if (s.trailLen[i] < tl) s.trailLen[i]++;

      s.dying[i] = 1;
      s.dyingAccum[i] = 0;

      const len = s.trailLen[i];
      const headNow = s.trailHead[i];
      const startSlot = (headNow - len + tl) % tl;

      for (let seg = 0; seg < len - 1; seg++) {
        const fromSlot = (startSlot + seg) % tl;
        const fromIdx = base + fromSlot * 3;
        const toSlot = (startSlot + seg + 1) % tl;
        const toIdx = base + toSlot * 3;

        const fromLng = s.trail[fromIdx];
        const fromLat = s.trail[fromIdx + 1];
        const toLng = s.trail[toIdx];
        const toLat = s.trail[toIdx + 1];

        const dx = toLng - fromLng;
        const dy = toLat - fromLat;
        if (dx * dx + dy * dy < 1e-14) continue;

        const segmentAge = s.age[i] - (len - seg);
        const pIdx = lineCount * 4;
        positions[pIdx] = fromLng;
        positions[pIdx + 1] = fromLat;
        positions[pIdx + 2] = toLng;
        positions[pIdx + 3] = toLat;
        writeColor(colors, pIdx, segmentAge > 0 ? segmentAge : 0, maxAge);
        lineCount++;
      }

      continue;
    }

    const head = s.trailHead[i];
    const tIdx = base + head * 3;
    s.trail[tIdx] = s.lng[i];
    s.trail[tIdx + 1] = s.lat[i];
    s.trail[tIdx + 2] = s.speed[i];

    s.trailHead[i] = (head + 1) % tl;
    if (s.trailLen[i] < tl) s.trailLen[i]++;

    s.lng[i] += sample.u * speedFactor * scale;
    s.lat[i] += sample.v * speedFactor * scale;
    s.speed[i] = sample.speed;
    s.age[i] += scale;

    const len = s.trailLen[i];
    const headNow = s.trailHead[i];
    const startSlot = (headNow - len + tl) % tl;

    for (let seg = 0; seg < len; seg++) {
      const fromSlot = (startSlot + seg) % tl;
      const fromIdx = base + fromSlot * 3;
      const fromLng = s.trail[fromIdx];
      const fromLat = s.trail[fromIdx + 1];

      let toLng: number, toLat: number;
      if (seg < len - 1) {
        const toSlot = (startSlot + seg + 1) % tl;
        const toIdx = base + toSlot * 3;
        toLng = s.trail[toIdx];
        toLat = s.trail[toIdx + 1];
      } else {
        toLng = s.lng[i];
        toLat = s.lat[i];
      }

      const dx = toLng - fromLng;
      const dy = toLat - fromLat;
      if (dx * dx + dy * dy < 1e-14) continue;

      const segmentAge = s.age[i] - (len - seg);
      const pIdx = lineCount * 4;

      positions[pIdx] = fromLng;
      positions[pIdx + 1] = fromLat;
      positions[pIdx + 2] = toLng;
      positions[pIdx + 3] = toLat;

      writeColor(colors, pIdx, segmentAge > 0 ? segmentAge : 0, maxAge);

      lineCount++;
    }
  }

  buf.count = lineCount;
}
