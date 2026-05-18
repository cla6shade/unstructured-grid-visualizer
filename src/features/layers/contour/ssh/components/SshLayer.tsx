import { useMemo } from 'react';
import type { Layer } from '@deck.gl/core';
import { useRegisterLayerGroup } from '@/features/map/deck/hooks/useRegisterLayerGroup';
import { useContourSurface } from '../../hooks/useContourSurface';
import { createContourLayer } from '../../lib/createContourLayer';
import { sshFetcher } from '../lib/sshFetcher';

const SSH_LAYER_ID = 'ssh-contour-mesh';
const SSH_Z = 10;

/**
 * SSH(조위) contour 레이어. deck.gl SurfaceMeshLayer로 렌더한다.
 * <Map> 안의 DeckOverlayProvider 자식으로 두어야 한다.
 */
export function SshLayer() {
  const surface = useContourSurface(sshFetcher);

  const layers = useMemo<Layer[]>(
    () => [createContourLayer({ id: SSH_LAYER_ID, surface, visible: true })],
    [surface],
  );

  useRegisterLayerGroup(SSH_LAYER_ID, layers, SSH_Z);

  return null;
}
