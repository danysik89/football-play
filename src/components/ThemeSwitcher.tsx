import { Check, Monitor, Moon, Palette, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { THEMES, setMode, setThemeId, useTheme, type Mode } from '../lib/themes';

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

/** Floating side panel for previewing color palettes. */
export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const { themeId, resolved } = useTheme();

  return (
    <div className="fixed top-1/2 right-0 z-30 flex -translate-y-1/2 items-center">
      {open && (
        <div className="animate-pop-in mr-2 w-60 rounded-2xl border border-line bg-surface p-2 shadow-2xl shadow-black/40">
          <div className="mb-1 flex items-center justify-between pl-2">
            <span className="text-xs font-bold tracking-wider text-muted uppercase">Тема</span>
            <button aria-label="Закрити" onClick={() => setOpen(false)} className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:text-fg">
              <X size={16} />
            </button>
          </div>
          <ModeToggle className="mb-2" />
          <ul className="max-h-[55dvh] overflow-y-auto">
            {THEMES.map((t) => {
              const c = t[resolved];
              return (
                <li key={t.id}>
                  <button
                    onClick={() => setThemeId(t.id)}
                    aria-pressed={themeId === t.id}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left text-sm font-semibold transition ${themeId === t.id ? 'bg-surface-2' : 'hover:bg-surface-2'}`}
                  >
                    <span className="flex shrink-0 overflow-hidden rounded-full border" style={{ borderColor: c.line }}>
                      {[c.bg, c.surface, c.accent, c['team-b']].map((col, i) => (
                        <span key={i} className="h-6 w-3" style={{ background: col }} />
                      ))}
                    </span>
                    <span className="flex-1">{t.name}</span>
                    {themeId === t.id && <Check size={16} className="text-accent" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <button
        aria-label="Змінити тему"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 w-10 cursor-pointer items-center justify-center rounded-l-2xl border border-r-0 border-line bg-surface-2 text-accent shadow-lg transition hover:w-12"
      >
        <Palette size={20} />
      </button>
    </div>
  );
}
