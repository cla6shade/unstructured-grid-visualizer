import { useMemo, useState, type ReactNode } from 'react';
import { useControl } from 'react-map-gl/maplibre';
import { useStore } from 'zustand';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { createDeckLayersStore } from '@/features/map/deck/store/deckLayersStore';
import { DeckLayersContext } from '@/features/map/deck/store/deckLayersContext';

/**
 * maplibre 지도 위에 deck.gl 레이어를 얹는 단일 오버레이.
 * <Map>의 자식으로 두고, deck.gl 레이어 컴포넌트들을 children으로 감싼다.
 * 각 레이어 컴포넌트는 useDeckLayers로 자신의 레이어 그룹을 등록한다.
 */
export function DeckOverlayProvider({ children }: { children: ReactNode }) {
  const overlay = useControl(
    () => new MapboxOverlay({ interleaved: true, layers: [] }),
  );

  const [store] = useState(() => createDeckLayersStore());
  const layerGroups = useStore(store, (s) => s.layerGroups);

  const layers = useMemo(
    () =>
      Object.values(layerGroups)
        .sort((a, b) => a.zIndex - b.zIndex)
        .flatMap((group) => group.layers),
    [layerGroups],
  );

  overlay.setProps({ layers });

  return (
    <DeckLayersContext.Provider value={store}>
      {children}
    </DeckLayersContext.Provider>
  );
}
