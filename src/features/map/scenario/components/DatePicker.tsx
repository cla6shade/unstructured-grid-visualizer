import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface DatePickerProps {
  value: Date;
  options: Date[];
  onChange: (date: Date) => void;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateLabel(d: Date) {
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayOfWeek = DAY_NAMES[d.getDay()];
  return `${month}월 ${day}일 (${dayOfWeek})`;
}

function formatDateShort(d: Date) {
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}월 ${day}일`;
}

export function DatePicker({ value, options, onChange }: DatePickerProps) {
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

  const selected = useMemo(
    () => options.some((d) => isSameDay(d, value)),
    [options, value],
  );

  const handleSelect = (date: Date) => {
    onChange(date);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-29 rounded-[8px] pl-3 pr-2 py-2 cursor-pointer text-base font-medium text-foreground-muted bg-map-icon transition-all"
      >
        <span>{selected ? formatDateShort(value) : '일자 선택'}</span>
        {open ? (
          <ChevronUp size={16} className="text-foreground-muted" />
        ) : (
          <ChevronDown size={16} className="text-foreground-muted" />
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-max min-w-full bg-map-icon/90 rounded-[8px] shadow-[0px_0px_12px_rgba(29,29,29,0.2)] px-4 py-4 z-50">
          <div className="flex flex-col gap-3">
            {options.map((date) => {
              const isSelected = isSameDay(date, value);
              return (
                <button
                  key={date.getTime()}
                  onClick={() => handleSelect(date)}
                  className={`text-left text-base font-medium cursor-pointer whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'text-white'
                      : 'text-map-content-faint hover:text-white'
                  }`}
                >
                  {formatDateLabel(date)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
