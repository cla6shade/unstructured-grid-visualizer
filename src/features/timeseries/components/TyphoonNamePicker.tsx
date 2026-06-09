import { useEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { TyphoonOption } from '@/features/timeseries/hooks/useTimeseriesScenario';

interface TyphoonNamePickerProps {
  value: string;
  options: TyphoonOption[];
  onChange: (typhoonId: string) => void;
}

/**
 * 시계열 모달용 태풍 선택 드롭다운. ScenarioIdPicker 마크업/테마를 본떠 만들되,
 * 화면에는 태풍 이름을 보여주고 onChange로는 typhoon_id를 넘긴다.
 */
export function TyphoonNamePicker({
  value,
  options,
  onChange,
}: TyphoonNamePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const selectedName =
    options.find((o) => o.id === value)?.name ?? (value || '태풍 선택');

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-36 h-9 rounded-[8px] bg-surface-light pl-3 pr-2 cursor-pointer text-base font-medium text-map-icon transition-all"
      >
        <span className="truncate">{selectedName}</span>
        {open ? (
          <ChevronUp size={16} className="text-map-icon shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-map-icon shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-full w-max bg-surface-light rounded-[8px] shadow-md px-3 py-4 z-50">
          <div className="flex flex-col gap-3">
            {options.map((option) => {
              const isSelected = option.id === value;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`text-left text-base cursor-pointer whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'text-map-surface-deep font-bold'
                      : 'text-map-icon font-medium hover:text-map-surface-deep'
                  }`}
                >
                  {option.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
