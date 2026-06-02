import { MaskExtension } from '@deck.gl/extensions';

/**
 * coastline 마스크를 적용할 deck.gl 레이어가 extensions로 사용한다.
 * 함께 registry에서 파생한 coastline mask layerName을 maskId로 지정해야 한다.
 */
export const MASK_EXTENSIONS = [new MaskExtension()];
