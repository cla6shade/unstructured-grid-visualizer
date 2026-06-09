import type { VariableSeries } from '@/features/timeseries/hooks/useTimeseriesSeries';

export interface VectorPair {
  /** 그리드 key. `${model}:${base}` */
  key: string;
  label: string;
  u: VariableSeries;
  v: VariableSeries;
}

export interface Partitioned {
  pairs: VectorPair[];
  singles: VariableSeries[];
}

/** 벡터 쌍 base → 표시 라벨. (현재는 유속만) */
const PAIR_LABEL: Record<string, string> = {
  VELOCITY: '유속 (m/s)',
};

/**
 * 변수 목록을 U/V 벡터 쌍과 나머지로 분리한다. `variable.variable`이 `${base}_U`/`${base}_V`이고
 * 같은 model이면 한 쌍. 짝이 없으면 single로 남긴다(원래 순서 유지).
 */
export function partitionVectorPairs(series: VariableSeries[]): Partitioned {
  const byKey = new Map<string, VariableSeries>();
  for (const s of series) byKey.set(`${s.variable.model}|${s.variable.variable}`, s);

  const consumed = new Set<VariableSeries>();
  const pairs: VectorPair[] = [];

  for (const s of series) {
    const name = s.variable.variable;
    if (!name.endsWith('_U')) continue;
    const base = name.slice(0, -2);
    const v = byKey.get(`${s.variable.model}|${base}_V`);
    if (!v) continue;
    consumed.add(s);
    consumed.add(v);
    pairs.push({
      key: `${s.variable.model}:${base}`,
      label: PAIR_LABEL[base] ?? `${base} (벡터)`,
      u: s,
      v,
    });
  }

  const singles = series.filter((s) => !consumed.has(s));
  return { pairs, singles };
}
