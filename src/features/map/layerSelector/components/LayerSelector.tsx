import { Filter } from 'lucide-react';
import { LAYER_DEFS } from '@/features/map/layerSelector/constants/layers';
import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';

export function LayerSelector() {
  const layers = useLayerStore((s) => s.layers);
  const toggle = useLayerStore((s) => s.toggle);

  return (
    <div className="absolute bottom-[91px] left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-5 bg-[rgba(44,46,52,0.8)] border-2 border-[#2b68d6] rounded-[12px] pl-5 pr-3 py-3 select-none">
      <Filter size={28} className="text-white shrink-0" />
      <div className="flex gap-3 items-start">
        {LAYER_DEFS.map((def) => {
          const active = layers[def.id];
          return (
            <button
              key={def.id}
              onClick={() => toggle(def.id)}
              className={`flex items-center justify-center p-4 rounded-[8px] text-[16px] cursor-pointer transition-all ${
                active
                  ? 'bg-[#2b68d6] shadow-[0px_0px_12px_rgba(88,89,95,0.32)] text-white font-bold'
                  : 'bg-[#2c2e34] text-[#e7eaef] font-medium hover:bg-[#3a3c42]'
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
