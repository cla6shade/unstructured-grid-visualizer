/** 해류 흐름 파티클 수(density) 슬라이더 범위/기본값. 전국·항구가 영역 크기가 달라 범위를 따로 둔다. */

/** 전국(nationwide) density — 넓은 영역이라 파티클이 많이 필요. */
export const NATIONWIDE_DENSITY_MIN = 500;
export const NATIONWIDE_DENSITY_MAX = 12000;
export const NATIONWIDE_DENSITY_STEP = 500;
/** 현재 동작 유지: useFlowLines의 기존 PARTICLE_COUNT(4000)와 동일. */
export const DEFAULT_NATIONWIDE_DENSITY = 4000;

/** 항구(port) density — 좁은 영역이라 적은 파티클로 충분. */
export const PORT_DENSITY_MIN = 1;
export const PORT_DENSITY_MAX = 400;
export const PORT_DENSITY_STEP = 1;
export const DEFAULT_PORT_DENSITY = 200;
