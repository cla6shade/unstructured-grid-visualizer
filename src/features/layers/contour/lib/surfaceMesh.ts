import type { TileCoord } from '@/lib/tile';
import type {
  ColoredPoint,
  ContourTileFetcher,
  SurfaceMesh,
  Triangle,
} from '../types';

export const EMPTY_SURFACE: SurfaceMesh = {
  positions: new Float32Array(0),
  colors: new Float32Array(0),
  indices: new Uint32Array(0),
};

function buildSurfaceFromPoints(
  pointsByIndex: Map<number, ColoredPoint>,
  triangles: Triangle[],
): SurfaceMesh {
  const vertexIndexByPointIndex = new Map<number, number>();
  const ordered: ColoredPoint[] = [];

  for (const [idx, point] of pointsByIndex) {
    vertexIndexByPointIndex.set(idx, ordered.length);
    ordered.push(point);
  }

  const positions = new Float32Array(ordered.length * 3);
  const colors = new Float32Array(ordered.length * 4);

  for (let i = 0; i < ordered.length; i++) {
    const p = ordered[i];
    positions[i * 3] = p.lon;
    positions[i * 3 + 1] = p.lat;
    positions[i * 3 + 2] = 0;

    colors[i * 4] = p.color[0] / 255;
    colors[i * 4 + 1] = p.color[1] / 255;
    colors[i * 4 + 2] = p.color[2] / 255;
    colors[i * 4 + 3] = p.color[3] / 255;
  }

  const indices: number[] = [];
  for (const [a, b, c] of triangles) {
    const ia = vertexIndexByPointIndex.get(a);
    const ib = vertexIndexByPointIndex.get(b);
    const ic = vertexIndexByPointIndex.get(c);
    if (ia === undefined || ib === undefined || ic === undefined) continue;
    indices.push(ia, ib, ic);
  }

  return {
    positions,
    colors,
    indices: new Uint32Array(indices),
  };
}

/**
 * 주어진 타일들과 zoom에 대해 표면 메시를 만든다.
 * 캐싱은 브라우저 HTTP 캐시에 위임한다(메모리 캐시 없음).
 * 실패하면 EMPTY_SURFACE를 반환한다(abort는 정상 취소이므로 조용히 무시).
 */
export async function loadSurfaceMesh(
  tiles: TileCoord[],
  effectiveZoom: number,
  timestamp: string,
  fetcher: ContourTileFetcher,
  signal?: AbortSignal,
): Promise<SurfaceMesh> {
  try {
    const [tilePoints, triangles] = await Promise.all([
      Promise.all(tiles.map((t) => fetcher.fetchTile(t, timestamp, signal))),
      fetcher.fetchConnectivity(effectiveZoom, signal),
    ]);

    if (!triangles || triangles.length === 0) return EMPTY_SURFACE;

    const points = tilePoints.flat();
    const pointsByIndex = new Map<number, ColoredPoint>();
    for (const p of points) pointsByIndex.set(p.idx, p);

    return buildSurfaceFromPoints(pointsByIndex, triangles);
  } catch (err) {
    if (!signal?.aborted) {
      console.error('[contour] surface load failed', err);
    }
    return EMPTY_SURFACE;
  }
}
