import { useMemo } from 'react';
import { measureNaturalWidth, prepareWithSegments } from '@chenglou/pretext';
import { normalizeValue } from '@/lib/colorMap';
import type { ColorBarSpec } from '@/features/layers/core/colorBar';

// 색상 램프를 균등 샘플해 CSS 그라데이션 stop으로 만든다. 램프 자체는 선형이고
// 비선형성(asinh 등)은 아래 tick 위치 계산에서만 반영된다(값↔색 매핑과 동일 규칙).
const GRADIENT_STEPS = 24;
const BAR_WIDTH = 360;
// 라벨 사이에 둘 최소 여백(px).
const LABEL_GAP_PX = 4;
// 아래 라벨 span(text-[10px] + 상속된 font-mono)과 같은 canvas font.
const LABEL_FONT = '10px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';

// 라벨 픽셀 너비를 pretext로 직접 측정한다(고정 추정 대신). 같은 문자열이
// 반복되므로 캐시한다.
const widthCache = new Map<string, number>();
function labelWidth(text: string): number {
  let w = widthCache.get(text);
  if (w === undefined) {
    w = measureNaturalWidth(prepareWithSegments(text, LABEL_FONT));
    widthCache.set(text, w);
  }
  return w;
}

export function ColorBar({ spec }: { spec: ColorBarSpec }) {
  const { label, colorMap, min, max, ticks } = spec;
  const scale = colorMap.scale;

  const gradient = useMemo(() => {
    const span = max - min;
    const stops: string[] = [];
    for (let i = 0; i < GRADIENT_STEPS; i++) {
      const t = i / (GRADIENT_STEPS - 1);
      const [r, g, b] = colorMap(min + t * span, min, max);
      stops.push(`rgb(${r} ${g} ${b}) ${(t * 100).toFixed(1)}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [colorMap, min, max]);

  const marks = useMemo(() => {
    const items = ticks
      .map((value) => ({ value, t: normalizeValue(value, min, max, scale) }))
      .sort((a, b) => a.t - b.t);
    const last = items.length - 1;

    // 라벨이 화면에서 차지하는 [left,right] px 박스. 끝은 바 밖으로 넘치지
    // 않게 안쪽 정렬하므로 박스도 그에 맞춘다.
    const boxOf = (t: number, w: number, i: number): [number, number] => {
      if (i === 0) return [0, w];
      if (i === last) return [BAR_WIDTH - w, BAR_WIDTH];
      const cx = t * BAR_WIDTH;
      return [cx - w / 2, cx + w / 2];
    };

    const widths = items.map((it) => labelWidth(String(it.value)));
    const lastBox = boxOf(items[last].t, widths[last], last);

    // 양 끝은 항상 라벨을 보이고, 그 사이는 직전에 보인 라벨·끝 라벨과 실제로
    // 안 겹칠 때만 노출한다(측정한 너비 기준).
    const result: {
      value: number;
      t: number;
      showLabel: boolean;
      align: string;
    }[] = [];
    let prevRight = -Infinity;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const [l, r] = boxOf(it.t, widths[i], i);
      const isEdge = i === 0 || i === last;
      const showLabel =
        isEdge ||
        (l >= prevRight + LABEL_GAP_PX && r <= lastBox[0] - LABEL_GAP_PX);
      if (showLabel) prevRight = r;
      const align =
        i === 0
          ? 'translate-x-0'
          : i === last
            ? '-translate-x-full'
            : '-translate-x-1/2';
      result.push({ value: it.value, t: it.t, showLabel, align });
    }
    return result;
  }, [ticks, min, max, scale]);

  return (
    <div className="flex flex-col gap-1 bg-background/85 rounded-[8px] px-3 py-2 text-[11px] text-foreground-muted font-mono select-none pointer-events-none">
      <div className="text-map-content-faint mb-1">{label}</div>
      <div className="relative" style={{ width: BAR_WIDTH }}>
        <div className="h-3 rounded-[3px]" style={{ background: gradient }} />
        <div className="relative h-4">
          {marks.map(({ value, t, showLabel, align }) => (
            <div
              key={value}
              className={`absolute top-0 flex flex-col items-center ${align}`}
              style={{ left: `${t * 100}%` }}
            >
              <span className="w-px h-1.5 bg-map-icon-muted" />
              {showLabel && (
                <span className="mt-0.5 leading-none text-[10px] text-map-control-soft whitespace-nowrap">
                  {value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
