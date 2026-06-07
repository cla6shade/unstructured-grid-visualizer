import { useEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ScenarioIdPickerProps {
  value: string;
  options: string[];
  onChange: (scenarioId: string) => void;
}

export function ScenarioIdPicker({
  value,
  options,
  onChange,
}: ScenarioIdPickerProps) {
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

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-35 rounded-[8px] bg-map-icon pl-3 pr-2 py-2 cursor-pointer text-base font-medium text-foreground-muted transition-all"
      >
        <span className="truncate">{value || '시나리오 선택'}</span>
        {open ? (
          <ChevronUp size={16} className="text-foreground-muted shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-foreground-muted shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 min-w-full w-max bg-map-icon/90 rounded-[8px] shadow-[0px_0px_12px_rgba(29,29,29,0.2)] px-3 py-4 z-50">
          <div className="flex flex-col gap-3">
            {options.map((option) => {
              const isSelected = option === value;
              return (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`text-left text-base font-medium cursor-pointer whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'text-white'
                      : 'text-map-content-faint hover:text-white'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
