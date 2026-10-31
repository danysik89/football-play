import { Monitor, Moon, Sun } from 'lucide-react';
import { setMode, useTheme, type Mode } from '../lib/themes';

const MODES: { id: Mode; label: string; icon: typeof Sun }[] = [
  { id: 'dark', label: 'Темна', icon: Moon },
  { id: 'light', label: 'Світла', icon: Sun },
  { id: 'system', label: 'Авто', icon: Monitor },
];

/** Light / dark / system segmented control. */
export function ModeToggle({ className = '' }: { className?: string }) {
  const { mode } = useTheme();
  return (
    <div role="radiogroup" aria-label="Режим теми" className={`grid grid-cols-3 gap-1 rounded-xl bg-bg p-1 ${className}`}>
      {MODES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          role="radio"
          aria-checked={mode === id}
          onClick={() => setMode(id)}
          className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition ${
            mode === id ? 'bg-surface-2 text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg'
          }`}
        >
          <Icon size={14} /> {label}
        </button>
      ))}
    </div>
  );
}
