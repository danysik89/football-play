import { Check, Palette, X } from 'lucide-react';
import { useState } from 'react';
import { THEMES, applyTheme, savedThemeId } from '../lib/themes';

/** Floating side panel for previewing color palettes. */
export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(savedThemeId);

  return (
    <div className="fixed top-1/2 right-0 z-30 flex -translate-y-1/2 items-center">
      {open && (
        <div className="animate-pop-in mr-2 w-56 rounded-2xl border border-line bg-surface p-2 shadow-2xl shadow-black/40">
          <div className="mb-1 flex items-center justify-between pl-2">
            <span className="text-xs font-bold tracking-wider text-muted uppercase">Кольорова гама</span>
            <button aria-label="Закрити" onClick={() => setOpen(false)} className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:text-fg">
              <X size={16} />
            </button>
          </div>
          <ul>
            {THEMES.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setCurrent(applyTheme(t.id))}
                  aria-pressed={current === t.id}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left text-sm font-semibold transition ${current === t.id ? 'bg-surface-2' : 'hover:bg-surface-2'}`}
                >
                  <span className="flex shrink-0 overflow-hidden rounded-full border" style={{ borderColor: t.colors.line }}>
                    {[t.colors.bg, t.colors.surface, t.colors.accent, t.colors['team-b']].map((c, i) => (
                      <span key={i} className="h-6 w-3" style={{ background: c }} />
                    ))}
                  </span>
                  <span className="flex-1">{t.name}</span>
                  {current === t.id && <Check size={16} className="text-accent" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        aria-label="Змінити кольорову гаму"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 w-10 cursor-pointer items-center justify-center rounded-l-2xl border border-r-0 border-line bg-surface-2 text-accent shadow-lg transition hover:w-12"
      >
        <Palette size={20} />
      </button>
    </div>
  );
}
