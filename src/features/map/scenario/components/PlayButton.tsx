import { Play, Square } from 'lucide-react';

interface PlayButtonProps {
  playing: boolean;
  onToggle: () => void;
}

export function PlayButton({ playing, onToggle }: PlayButtonProps) {
  const Icon = playing ? Square : Play;
  const label = playing ? '정지' : '재생';
  const colorClass = playing
    ? 'bg-primary text-white'
    : 'bg-map-icon text-foreground-muted hover:bg-primary hover:text-white';

  return (
    <button
      onClick={onToggle}
      className={`flex items-center justify-center gap-1 rounded-[8px] p-2 cursor-pointer text-base font-medium shrink-0 transition-all ${colorClass}`}
    >
      <Icon size={16} fill="currentColor" />
      {label}
    </button>
  );
}
