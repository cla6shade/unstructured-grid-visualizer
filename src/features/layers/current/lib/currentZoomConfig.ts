import { pickZoomThreshold } from '@/lib/zoom';
import type { SimulatorConfig } from './particleSimulator';

export const CURRENT_MIN_ZOOM = 6;
export const CURRENT_MAX_ZOOM = 10;

/** current 데이터가 존재하는 타일 zoom 단계 (지도 zoom은 연속값이라 여기로 스냅). */
export const CURRENT_ZOOMS = [6, 7, 8, 9, 10] as const;

/** 지도 zoom을 데이터 타일 zoom으로 스냅한다. */
export function getDataZoom(zoom: number): number {
  return pickZoomThreshold(zoom, CURRENT_ZOOMS) ?? CURRENT_MIN_ZOOM;
}

export function getConfigForZoom(zoom: number): SimulatorConfig {
  if (zoom <= 7) {
    return { maxAge: 100, speedFactor: 0.02, trailLength: 80, maxParticles: 1500 };
  }
  if (zoom <= 8) {
    return { maxAge: 100, speedFactor: 0.01, trailLength: 60, maxParticles: 2000 };
  }
  if (zoom <= 9) {
    return { maxAge: 100, speedFactor: 0.006, trailLength: 40, maxParticles: 2000 };
  }
  if (zoom <= 11) {
    return { maxAge: 100, speedFactor: 0.004, trailLength: 38, maxParticles: 1500 };
  }
  if (zoom <= 12) {
    return { maxAge: 100, speedFactor: 0.002, trailLength: 28, maxParticles: 800 };
  }
  if (zoom <= 14) {
    return { maxAge: 100, speedFactor: 0.0008, trailLength: 15, maxParticles: 200 };
  }
  return { maxAge: 100, speedFactor: 0.0005, trailLength: 10, maxParticles: 100 };
}
