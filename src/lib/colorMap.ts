export type RGBA = [number, number, number, number];

// --- sRGB <-> linear RGB ---

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, v)) * 255);
}

// --- linear RGB <-> OKLab ---

function linearRgbToOklab(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

function oklabToLinearRgb(
  L: number,
  a: number,
  b: number,
): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

// --- OKLab <-> OKLCH ---

function oklabToOklch(L: number, a: number, b: number): [number, number, number] {
  return [L, Math.sqrt(a * a + b * b), Math.atan2(b, a)];
}

function oklchToOklab(L: number, C: number, h: number): [number, number, number] {
  return [L, C * Math.cos(h), C * Math.sin(h)];
}

// --- hex <-> OKLCH ---

function hexToOklch(hex: string): [number, number, number] {
  const v = parseInt(hex.replace('#', ''), 16);
  const r = srgbToLinear((v >> 16) & 0xff);
  const g = srgbToLinear((v >> 8) & 0xff);
  const b = srgbToLinear(v & 0xff);
  const [L, a, b_] = linearRgbToOklab(r, g, b);
  return oklabToOklch(L, a, b_);
}

function oklchToRgba(L: number, C: number, h: number, alpha: number): RGBA {
  const [Lk, a, b] = oklchToOklab(L, C, h);
  const [lr, lg, lb] = oklabToLinearRgb(Lk, a, b);
  return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb), alpha];
}

// --- lerp with hue shortest-path ---

function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return a + d * t;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// --- public API ---

export function createColorMap(colors: string[], alpha = 200) {
  const stops = colors.map(hexToOklch);

  return (value: number, min: number, max: number): RGBA => {
    const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const idx = t * (stops.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, stops.length - 1);
    const f = idx - lo;

    const L = lerp(stops[lo][0], stops[hi][0], f);
    const C = lerp(stops[lo][1], stops[hi][1], f);
    const h = lerpAngle(stops[lo][2], stops[hi][2], f);

    return oklchToRgba(L, C, h, alpha);
  };
}

// Precompute a `size`-step RGB lookup table from a color map. Each entry is
// 4 floats (R, G, B, A) in 0..1, ready to feed into deck.gl color buffers.
// 모든 sRGB↔OKLCH 변환을 여기서 끝내고, 핫 루프에서는 인덱스 조회만 한다.
export interface ColorLut {
  rgba: Float32Array;
  size: number;
  min: number;
  max: number;
}

export function buildColorLut(
  colorMap: (value: number, min: number, max: number) => RGBA,
  min: number,
  max: number,
  size = 256,
): ColorLut {
  const rgba = new Float32Array(size * 4);
  for (let i = 0; i < size; i++) {
    const value = min + (i / (size - 1)) * (max - min);
    const [r, g, b, a] = colorMap(value, min, max);
    rgba[i * 4] = r / 255;
    rgba[i * 4 + 1] = g / 255;
    rgba[i * 4 + 2] = b / 255;
    rgba[i * 4 + 3] = a / 255;
  }
  return { rgba, size, min, max };
}

/**
 * 값 배열을 LUT로 deck.gl용 Float32 RGBA 버퍼로 변환한다.
 * `transparentValue`(기본 0)인 노드는 alpha 0으로 남겨 렌더링되지 않게 한다.
 */
export function valuesToRgbaFloat32(
  values: Float32Array,
  lut: ColorLut,
  transparentValue: number | null = 0,
): Float32Array {
  const out = new Float32Array(values.length * 4);
  const span = lut.max - lut.min;
  const lastIdx = lut.size - 1;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (transparentValue !== null && v === transparentValue) continue;
    let t = (v - lut.min) / span;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const idx = (t * lastIdx) | 0;
    const o = i * 4;
    const l = idx * 4;
    out[o] = lut.rgba[l];
    out[o + 1] = lut.rgba[l + 1];
    out[o + 2] = lut.rgba[l + 2];
    out[o + 3] = lut.rgba[l + 3];
  }
  return out;
}

const OCEAN_STOPS = [
  '#E4E521',
  '#D2E826',
  '#B9E92E',
  '#99EA3E',
  '#74EB57',
  '#4DEA78',
  '#2BE79F',
  '#21DFC9',
  '#1FD3EC',
  '#24C5FA',
  '#2FB5FF',
  '#3AA3FF',
  '#4490FF',
  '#4D7DFF',
  '#5670FF',
  '#5F63FF',
];

export const oceanColorMap = createColorMap(OCEAN_STOPS);

// 수심용: 낮은 값=파랑, 높은 값=노랑
export const depthColorMap = createColorMap([...OCEAN_STOPS].reverse());
