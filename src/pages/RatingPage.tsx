import { Snowflake, Sun, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Avatar, Card, EmptyState, PageTitle } from '../components/ui';
import { useEvents, useSeasons } from '../lib/api';
import { plural } from '../lib/format';
import { useSession } from '../lib/session';
import { seasonStats } from '../lib/stats';
import { PageSpinner } from './HomePage';

const tooltipStyle = {
  contentStyle: { background: 'var(--color-surface-2)', border: '1px solid var(--color-line)', borderRadius: 12, color: 'var(--color-fg)' },
  labelStyle: { color: 'var(--color-muted)', fontWeight: 600 },
  cursor: { fill: 'color-mix(in srgb, var(--color-fg) 4%, transparent)' },
};
const axis = { stroke: 'var(--color-muted)', fontSize: 12, tickLine: false, axisLine: false } as const;

export function RatingPage() {
  const { user } = useSession();
  const { seasons, activeSeason, loading } = useSeasons();
  const { events, loading: evLoading } = useEvents();
  const [seasonId, setSeasonId] = useState<string | null>(null);

  useEffect(() => {
    if (!seasonId && seasons.length) setSeasonId(activeSeason?.id ?? seasons[0]!.id);
  }, [seasons, activeSeason, seasonId]);

  const stats = useMemo(() => seasonStats(events, seasonId), [events, seasonId]);

  if (loading || evLoading) return <PageSpinner />;
  if (!seasons.length)
    return (
      <>
        <PageTitle>Рейтинг</PageTitle>
        <EmptyState icon={<Trophy size={30} />} title="Сезон ще не розпочато" text="Рейтинг з’явиться, коли адміністратор почне сезон і завершить перше тренування." />
      </>
    );

  return (
    <>
      <PageTitle>Рейтинг</PageTitle>

      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Сезон">
        {seasons.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={s.id === seasonId}
            onClick={() => setSeasonId(s.id)}
            className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-bold whitespace-nowrap transition ${
              s.id === seasonId ? 'bg-accent text-on-accent' : 'bg-surface text-muted hover:text-fg'
            }`}
          >
            {s.type === 'summer' ? <Sun size={16} /> : <Snowflake size={16} />} {s.name}
            {s.active && ' · зараз'}
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat value={stats.eventsCount} label={plural(stats.eventsCount, 'тренування', 'тренування', 'тренувань')} />
        <Stat value={stats.avgAttendance} label="середня явка" />
        <Stat value={stats.playersCount} label={plural(stats.playersCount, 'гравець', 'гравці', 'гравців')} />
      </div>

      {stats.eventsCount === 0 ? (
        <Card>
          <p className="py-6 text-center text-muted">У цьому сезоні ще немає завершених тренувань.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="px-2 pb-2">
            <h2 className="mb-1 px-3 font-display text-lg font-bold">Таблиця сезону</h2>
            <p className="mb-3 px-3 text-sm text-muted">Очки за всі тренування сезону</p>
            <ol>
              {stats.rating.map((r, i) => {
                const me = r.uid === user?.uid;
                const medal = ['#f5c542', '#c9d1d9', '#d08c5b'][i];
                return (
                  <li key={r.uid} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${me ? 'bg-accent/10' : ''}`}>
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold tabular-nums"
                      style={medal ? { background: medal, color: '#1a1a1a' } : { color: 'var(--color-muted)' }}
                    >
                      {i + 1}
                    </span>
                    <Avatar name={r.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">
                        {r.name}
                        {me && <span className="text-accent"> · ти</span>}
                      </p>
                      <p className="text-xs text-muted">
                        {r.games} {plural(r.games, 'гра', 'гри', 'ігор')}
                      </p>
                    </div>
                    <span className="font-display text-lg font-extrabold text-accent tabular-nums">{r.points}</span>
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card>
            <h2 className="mb-1 font-display text-lg font-bold">Явка на тренуваннях</h2>
            <p className="mb-4 text-sm text-muted">Скільки людей прийшло, включно з гостями</p>
            <div className="h-52">
              <ResponsiveContainer>
                <BarChart data={stats.perEvent} margin={{ left: -24, right: 4, top: 4 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-line)" />
                  <XAxis dataKey="label" {...axis} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} {...axis} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [v, 'Учасників']} />
                  <Bar dataKey="count" fill="var(--color-accent)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h2 className="mb-1 font-display text-lg font-bold">Найчастіше приходять</h2>
            <p className="mb-4 text-sm text-muted">Кількість відвіданих тренувань</p>
            <div style={{ height: Math.max(120, stats.mostActive.length * 40) }}>
              <ResponsiveContainer>
                <BarChart data={stats.mostActive.map((p) => ({ ...p, short: shortName(p.name) }))} layout="vertical" margin={{ left: 0, right: 24 }}>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis type="category" dataKey="short" width={100} {...axis} tick={{ fill: 'var(--color-fg)', fontSize: 13 }} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [v, 'Тренувань']} />
                  <Bar dataKey="games" fill="var(--color-team-b)" radius={[0, 6, 6, 0]} barSize={20} label={{ position: 'right', fill: 'var(--color-muted)', fontSize: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

/** "Олександр Зінченко" → "Олександр З." */
const shortName = (name: string) => {
  const [first, last] = name.split(/\s+/);
  return last ? `${first} ${last[0]}.` : name;
};

const Stat = ({ value, label }: { value: number; label: string }) => (
  <div className="rounded-2xl border border-line bg-surface p-3 text-center">
    <p className="font-display text-2xl font-extrabold tabular-nums">{value}</p>
    <p className="mt-0.5 text-xs leading-tight text-muted">{label}</p>
  </div>
);
