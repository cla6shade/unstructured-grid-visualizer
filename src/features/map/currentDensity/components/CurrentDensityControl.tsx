import { useLayerStore } from '@/features/map/layerSelector/store/layerStore';
import { useLocationStore } from '@/features/map/locationSelector/store/locationStore';
import { KOREA_LOCATION_ID } from '@/features/map/locationSelector/constants/locations';
import { useCurrentDensityStore } from '@/features/map/currentDensity/store/currentDensityStore';
import {
  NATIONWIDE_DENSITY_MIN,
  NATIONWIDE_DENSITY_MAX,
  NATIONWIDE_DENSITY_STEP,
  PORT_DENSITY_MIN,
  PORT_DENSITY_MAX,
  PORT_DENSITY_STEP,
} from '@/features/map/currentDensity/constants/density';

/**
 * 해류 흐름 파티클 밀도 조정 패널.
 * - 해류 레이어가 켜져 있을 때만 표시.
 * - 전국 density는 항상, 항구 density는 항구 줌(location ≠ korea)일 때만 노출.
 */
export function CurrentDensityControl() {
  const visible = useLayerStore((s) => s.layers.current);
  const isPort = useLocationStore((s) => s.location.id !== KOREA_LOCATION_ID);
  const nationwide = useCurrentDensityStore((s) => s.nationwide);
  const port = useCurrentDensityStore((s) => s.port);
  const setNationwide = useCurrentDensityStore((s) => s.setNationwide);
  const setPort = useCurrentDensityStore((s) => s.setPort);

  if (!visible) return null;

  return (
    <div className="flex flex-col gap-2 bg-[rgba(44,46,52,0.85)] rounded-[8px] px-3 py-2 text-[12px] text-[#e7eaef] font-mono select-none pointer-events-auto">
      <div className="text-[#bcbfc5]">해류 밀도</div>
      <DensityRow
        label="전국"
        value={nationwide}
        onChange={setNationwide}
        min={NATIONWIDE_DENSITY_MIN}
        max={NATIONWIDE_DENSITY_MAX}
        step={NATIONWIDE_DENSITY_STEP}
      />
      {isPort && (
        <DensityRow
          label="항구"
          value={port}
          onChange={setPort}
          min={PORT_DENSITY_MIN}
          max={PORT_DENSITY_MAX}
          step={PORT_DENSITY_STEP}
        />
      )}
    </div>
  );
}

function DensityRow({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-8 text-white">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 accent-[#2b68d6]"
      />
      <span className="w-12 text-right tabular-nums text-[#bcbfc5]">{value}</span>
    </label>
  );
}
