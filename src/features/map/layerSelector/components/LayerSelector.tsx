import { Filter } from 'lucide-react';
import { LAYER_DEFS } from '@/features/map/layerSelector/constants/layers';
import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';

export function LayerSelector() {
  const layers = useLayerStore((s) => s.layers);
  const toggle = useLayerStore((s) => s.toggle);

  return (
    <div className="absolute bottom-[91px] left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-5 bg-surface border-2 border-primary rounded-[12px] pl-5 pr-3 py-3 select-none">
      <Filter size={28} className="text-white shrink-0" />
      <div className="flex gap-3 items-start">
        {LAYER_DEFS.map((def) => {
          const active = layers[def.id];
          return (
            <button
              key={def.id}
              onClick={() => toggle(def.id)}
              className={`flex items-center justify-center p-4 rounded-[8px] text-base cursor-pointer transition-all ${
                active
                  ? 'bg-primary shadow-[0px_0px_12px_rgba(88,89,95,0.32)] text-white font-bold'
                  : 'bg-background text-foreground-muted font-medium hover:bg-background-hover'
              }`}
            >
              {def.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
