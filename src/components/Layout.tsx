import { CalendarDays, Settings2, Trophy, UserRound } from 'lucide-react';
import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { isDemo } from '../lib/backend';
import { useSession } from '../lib/session';
import { PageSpinner } from '../pages/HomePage';

export function Layout() {
  const { isAdmin } = useSession();
  const items = [
    { to: '/', label: 'Тренування', icon: CalendarDays },
    { to: '/rating', label: 'Рейтинг', icon: Trophy },
    ...(isAdmin ? [{ to: '/admin', label: 'Керування', icon: Settings2 }] : []),
    { to: '/profile', label: 'Профіль', icon: UserRound },
  ];

  return (
    <div className="pitch-bg min-h-dvh">
      {isDemo && (
        <div className="bg-accent/10 px-4 py-1.5 text-center text-xs font-semibold text-accent-ink">
          Демо-режим: дані зберігаються лише в цьому браузері
        </div>
      )}
      <main className="mx-auto max-w-xl px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <Suspense fallback={<PageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
      <nav
        aria-label="Головна навігація"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg"
      >
        <ul className="mx-auto flex max-w-xl">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold transition ${isActive ? 'text-accent-ink' : 'text-muted hover:text-fg'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${isActive ? 'bg-accent/15' : ''}`}>
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
