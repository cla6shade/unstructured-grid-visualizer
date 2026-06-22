import { LOCAL_MASK_ID } from '../constants';

export interface LocalMaskProps {
  maskId?: string;
  maskInverted?: boolean;
}

/**
 * 항구 boundary 마스크 props를 만든다.
 * - `active`가 false면 빈 객체 → maskId 미부여(레이어 전체 렌더).
 * - base(z=6)는 `inverted: true`로 boundary 바깥만, detail(z=11)은 `inverted: false`로
 *   boundary 안쪽만 렌더. createContourLayer/createFlowLayer/createFlowIconLayer가
 *   maskId가 있을 때만 MASK_EXTENSIONS를 붙인다.
 */
export function localMaskProps(
  active: boolean,
  inverted: boolean,
): LocalMaskProps {
  return active ? { maskId: LOCAL_MASK_ID, maskInverted: inverted } : {};
}
