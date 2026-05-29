// subset.py가 출력하는 .bin 파일 스키마와 파서.
//
// numpy.ndarray.tofile()은 네이티브 바이트 순서로 쓴다. 생성 환경(macOS x86/ARM,
// Rocky Linux x86)이 항상 little-endian이라 파일은 LE로 고정으로 본다.
// 클라이언트가 빅엔디안일 가능성이 있어, 호스트가 BE이면 TypedArray view를 만든 뒤
// byteSwap으로 in-place 변환한다. (LE 호스트에서는 zero-copy view 그대로 사용.)

export interface MeshTile {
  /** 이 타일에 포함된 노드 수 */
  nodeCount: number;
  /** triangles.length === nodeCount 와는 무관. flat conn 길이 / 3 */
  triangleCount: number;
  /** 노드별 경도(EPSG:4326 가정 — 원본 SLF 좌표계에 따라 달라질 수 있음) */
  x: Float32Array;
  /** 노드별 위도 */
  y: Float32Array;
  /** 전역(원본 메쉬) 노드 인덱스 */
  node: Int32Array;
  /** 삼각형 연결성. 길이 = triangleCount * 3, 값은 이 타일 내부의 노드 배열 인덱스 */
  conn: Int32Array;
}

export interface ValuesTile {
  nodeCount: number;
  /** 전역 노드 인덱스. 같은 (z,x,y)의 MeshTile.node와 동일한 순서. */
  node: Int32Array;
  /** value_keys 순서대로 채워진 노드별 값. 각 배열 길이 = nodeCount. */
  values: Record<string, Float32Array>;
}

// subset.py의 DEFAULT_LAYERS와 일치해야 하는 value_keys 정의.
// values 타일을 디코딩할 때 어떤 키 순서로 값을 읽을지를 결정한다.
export const LAYER_VALUE_KEYS = {
  surge: {
    height: ['H'],
    tidal_height: ['S'],
    water_depth: ['H'],
    current: ['U', 'V'],
  },
  wave: {
    wave: ['WH', 'THETAW'],
  },
} as const satisfies Record<string, Record<string, readonly string[]>>;

export type ModelType = keyof typeof LAYER_VALUE_KEYS;
export type LayerName<M extends ModelType = ModelType> =
  keyof (typeof LAYER_VALUE_KEYS)[M];

const HOST_IS_LITTLE_ENDIAN = (() => {
  const probe = new Uint16Array([0x0102]);
  return new Uint8Array(probe.buffer)[0] === 0x02;
})();

// TypedArray view를 만든 뒤, 호스트가 BE이면 4바이트 swap을 in-place로 수행.
// Node 18+/모던 브라우저의 DataView.prototype.getInt32(le=true) 호출과 동등한 결과.
function viewLE<T extends Int32Array | Float32Array>(arr: T): T {
  if (HOST_IS_LITTLE_ENDIAN) return arr;
  const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
  for (let i = 0; i < bytes.length; i += 4) {
    const b0 = bytes[i],
      b1 = bytes[i + 1];
    bytes[i] = bytes[i + 3];
    bytes[i + 1] = bytes[i + 2];
    bytes[i + 2] = b1;
    bytes[i + 3] = b0;
  }
  return arr;
}

export function decodeMeshTile(buffer: ArrayBuffer): MeshTile {
  const view = new DataView(buffer);
  const nodeCount = view.getInt32(0, true);
  const connCount = view.getInt32(4, true);

  let offset = 8;
  const x = viewLE(new Float32Array(buffer, offset, nodeCount));
  offset += nodeCount * 4;
  const y = viewLE(new Float32Array(buffer, offset, nodeCount));
  offset += nodeCount * 4;
  const node = viewLE(new Int32Array(buffer, offset, nodeCount));
  offset += nodeCount * 4;
  const conn = viewLE(new Int32Array(buffer, offset, connCount));

  return { nodeCount, triangleCount: connCount / 3, x, y, node, conn };
}

export function decodeValuesTile(
  buffer: ArrayBuffer,
  valueKeys: readonly string[],
): ValuesTile {
  const view = new DataView(buffer);
  const nodeCount = view.getInt32(0, true);

  let offset = 4;
  const node = viewLE(new Int32Array(buffer, offset, nodeCount));
  offset += nodeCount * 4;

  const values: Record<string, Float32Array> = {};
  for (const k of valueKeys) {
    values[k] = viewLE(new Float32Array(buffer, offset, nodeCount));
    offset += nodeCount * 4;
  }
  return { nodeCount, node, values };
}
