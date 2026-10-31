import type { FootballEvent } from './types';

export interface PlayerRow {
  uid: string;
  name: string;
  points: number;
  games: number;
}

/** Season rating built from finished events. Guests don't take part in the rating. */
export function seasonStats(events: FootballEvent[], seasonId: string | null) {
  const finished = events
    .filter((e) => e.status === 'finished' && e.summary && (!seasonId || e.seasonId === seasonId))
    .sort((a, b) => a.startsAt - b.startsAt);

  const players = new Map<string, PlayerRow>();
  let totalAttendance = 0;

  const perEvent = finished.map((e) => {
    const s = e.summary!;
    totalAttendance += s.attendees.length;
    for (const a of s.attendees) {
      if (!a.uid) continue;
      const row = players.get(a.uid) ?? { uid: a.uid, name: a.name, points: 0, games: 0 };
      row.name = a.name;
      row.points += s.points[a.id] ?? 0;
      row.games += 1;
      players.set(a.uid, row);
    }
    return {
      id: e.id,
      label: new Date(e.startsAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }),
      count: s.attendees.length,
      guests: s.attendees.filter((a) => !a.uid).length,
    };
  });

  const rating = [...players.values()].sort((a, b) => b.points - a.points || b.games - a.games || a.name.localeCompare(b.name));
  const mostActive = [...players.values()].sort((a, b) => b.games - a.games || b.points - a.points).slice(0, 8);

  return {
    eventsCount: finished.length,
    avgAttendance: finished.length ? Math.round((totalAttendance / finished.length) * 10) / 10 : 0,
    playersCount: players.size,
    perEvent,
    rating,
    mostActive,
  };
}
