import { useEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface YearPickerProps {
  /** 선택된 연도. null이면 전체. */
  value: number | null;
  options: number[];
  onChange: (year: number | null) => void;
}

/** 연도 필터 드롭다운(사이드바.svg). 밝은 알약 스타일, 아래로 열린다. */
export function YearPicker({ value, options, onChange }: YearPickerProps) {
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

  const handleSelect = (v: number | null) => {
    onChange(v);
    setOpen(false);
  };

  const label = value === null ? '전체 연도' : `${value}년`;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full h-10 rounded-[8px] bg-surface-light pl-4 pr-3 cursor-pointer text-base font-medium text-map-icon transition-all"
      >
        <span className="truncate">{label}</span>
        {open ? (
          <ChevronUp size={18} className="text-map-icon shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-map-icon shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-surface-light rounded-[8px] shadow-md px-4 py-3 z-50">
          <div className="flex flex-col gap-3">
            {[null, ...options].map((option) => {
              const isSelected = option === value;
              return (
                <button
                  key={option ?? 'all'}
                  onClick={() => handleSelect(option)}
                  className={`text-left text-base cursor-pointer whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'text-map-surface-deep font-bold'
                      : 'text-map-icon font-medium hover:text-map-surface-deep'
                  }`}
                >
                  {option === null ? '전체 연도' : `${option}년`}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
