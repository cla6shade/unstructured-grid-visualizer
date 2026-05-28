import { useMemo, useRef, type ReactNode } from 'react';
import { useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { DeckLayersContext } from '@/features/map/deck/store/deckLayersContext';
import type { DeckLayersRegistry, LayerGroup } from '@/features/map/deck/types';

/**
 * maplibre 지도 위에 deck.gl 레이어를 얹는 단일 오버레이.
 * <Map>의 자식으로 두고, deck.gl 레이어 컴포넌트들을 children으로 감싼다.
 * 각 레이어 컴포넌트는 useRegisterLayerGroup으로 자신의 레이어 그룹을 등록한다.
 */
export function DeckOverlayProvider({ children }: { children: ReactNode }) {
  const overlay = useControl(
    () => new MapboxOverlay({ interleaved: true, layers: [] }),
  );

  const layerGroupsRef = useRef<Record<string, LayerGroup>>({});
  const pendingRemovalIdsRef = useRef<Record<string, number>>({});

  const registry = useMemo<DeckLayersRegistry>(
    () => {
      const syncOverlayLayers = (reason: string) => {
        const nextLayers = Object.values(layerGroupsRef.current)
          .sort((a, b) => a.zIndex - b.zIndex)
          .flatMap((group) => group.layers);

        console.log('[DeckOverlay] setProps → map re-render', {
          reason,
          layerCount: nextLayers.length,
          groupIds: Object.keys(layerGroupsRef.current),
          timestamp: performance.now().toFixed(2),
        });

        overlay.setProps({ layers: nextLayers });
      };

      return {
        upsertLayerGroup(id, layers, zIndex = 0) {
          console.log('[DeckOverlay] upsertLayerGroup', { id, zIndex, layerCount: layers.length });
          delete pendingRemovalIdsRef.current[id];
          layerGroupsRef.current[id] = { layers, zIndex };
          syncOverlayLayers(`upsert:${id}`);
        },
        removeLayerGroup(id) {
          const removalId = (pendingRemovalIdsRef.current[id] ?? 0) + 1;
          pendingRemovalIdsRef.current[id] = removalId;

          queueMicrotask(() => {
            if (pendingRemovalIdsRef.current[id] !== removalId) return;

            delete pendingRemovalIdsRef.current[id];
            delete layerGroupsRef.current[id];
            syncOverlayLayers(`remove:${id}`);
          });
        },
      };
    },
    [overlay],
  );

  return (
    <DeckLayersContext.Provider value={registry}>
      {children}
    </DeckLayersContext.Provider>
  );
}
