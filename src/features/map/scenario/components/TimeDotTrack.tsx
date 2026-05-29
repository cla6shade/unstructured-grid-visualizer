interface TimeDotTrackProps {
  slots: Date[];
  selectedTime: Date;
  disabledBefore: number;
  disabledAfter: number;
  onSelect: (slot: Date) => void;
}

export function TimeDotTrack({
  slots,
  selectedTime,
  disabledBefore,
  disabledAfter,
  onSelect,
}: TimeDotTrackProps) {
  return (
    <div className="relative flex-1 h-full ml-4 flex items-center">
      <div className="pointer-events-none absolute top-1/2 left-2 right-2 h-0.5 bg-white/30 -translate-y-1/2" />
      <div className="relative flex w-full justify-between items-center">
        {slots.map((slot, i) => {
          const t = slot.getTime();
          const disabled = t < disabledBefore || t > disabledAfter;
          const active = t === selectedTime.getTime();
          const showLabel = i % 2 === 0;
          const dotColor = disabled
            ? 'bg-[#979a9d] cursor-not-allowed'
            : 'bg-[#c5c9ce] cursor-pointer';
          const labelColor = disabled ? 'text-[#7b7f84]' : 'text-[#e1e5ed]';

          const hoverTimeLabel = `${String(slot.getHours()).padStart(2, '0')}:00`;

          return (
            <button
              key={slot.getTime()}
              disabled={disabled}
              onClick={() => onSelect(slot)}
              className="group relative flex flex-col items-center"
            >
              <span
                className={`size-4 rounded-full transition-all ${dotColor} ${active ? 'ring-2 ring-white' : ''} ${!disabled ? 'group-hover:ring-2 group-hover:ring-[#2b68d6] group-hover:bg-[#2b68d6] group-hover:ring-offset-2 group-hover:ring-offset-[#2c2e34]' : ''}`}
              />
              {showLabel && (
                <span
                  className={`absolute top-[20px] font-code text-[12px] leading-none ${labelColor}`}
                >
                  {slot.getHours()}
                </span>
              )}
              {!disabled && (
                <span className="absolute bottom-full mb-3 rounded-md bg-[#d8e8ff] px-2 py-1 text-[12px] leading-none text-[#2b68d6] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {hoverTimeLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
