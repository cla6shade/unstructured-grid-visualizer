import { MaskExtension } from '@deck.gl/extensions';

/**
 * coastline 마스크를 적용할 deck.gl 레이어가 extensions로 사용한다.
 * 함께 maskId: COASTLINE_MASK_ID 를 지정해야 한다.
 */
export const MASK_EXTENSIONS = [new MaskExtension()];
