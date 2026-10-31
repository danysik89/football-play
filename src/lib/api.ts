import { useEffect, useState } from 'react';
import { newId, store } from './backend';
import type { AppUser, Attendee, EventSummary, FootballEvent, Season, SeasonType, Team } from './types';

// ---------------------------------------------------------------- hooks

function useWatch<T>(subscribe: ((cb: (v: T) => void) => () => void) | null, deps: unknown[], initial: T) {
  const [state, setState] = useState<{ value: T; loading: boolean }>({ value: initial, loading: true });
  useEffect(() => {
    if (!subscribe) {
      setState({ value: initial, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    return subscribe((value) => setState({ value, loading: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export function useSeasons() {
  const { value, loading } = useWatch<Season[]>(
    (cb) => store.watchCollection<Season>('seasons', (s) => cb(s.sort((a, b) => b.startedAt - a.startedAt))),
    [],
    [],
  );
  return { seasons: value, activeSeason: value.find((s) => s.active) ?? null, loading };
}

export function useEvents() {
  const { value, loading } = useWatch<FootballEvent[]>(
    (cb) => store.watchCollection<FootballEvent>('events', (e) => cb(e.sort((a, b) => a.startsAt - b.startsAt))),
    [],
    [],
  );
  return { events: value, loading };
}

export function useEvent(id: string | undefined) {
  const { value, loading } = useWatch<FootballEvent | null>(
    id ? (cb) => store.watchDoc<FootballEvent>(`events/${id}`, cb) : null,
    [id],
    null,
  );
  return { event: value, loading };
}

export function useAttendees(eventId: string | undefined) {
  const { value, loading } = useWatch<Attendee[]>(
    eventId
      ? (cb) =>
          store.watchCollection<Attendee>(`events/${eventId}/attendees`, (a) =>
            cb(a.sort((x, y) => x.createdAt - y.createdAt)),
          )
      : null,
    [eventId],
    [],
  );
  return { attendees: value, loading };
}

export function useUsers() {
  const { value } = useWatch<AppUser[]>(
    (cb) => store.watchCollection<AppUser & { id: string }>('users', (u) => cb(u.map((x) => ({ ...x, uid: x.id })))),
    [],
    [],
  );
  return value;
}

/** The nearest event that hasn't finished yet. Stays visible ~3h after kick-off. */
export function pickCurrentEvent(events: FootballEvent[], now = Date.now()) {
  return events.find((e) => e.status === 'open' && e.startsAt > now - 3 * 3600_000) ?? null;
}

// ---------------------------------------------------------------- seasons

export async function startSeason(type: SeasonType, name: string, current: Season | null) {
  if (current) await store.update(`seasons/${current.id}`, { active: false, endedAt: Date.now() });
  const id = newId();
  await store.set(`seasons/${id}`, { name, type, active: true, startedAt: Date.now(), endedAt: null });
  return id;
}

export function defaultSeasonName(type: SeasonType, date = new Date()) {
  const y = date.getFullYear();
  if (type === 'summer') return `Літо ${y}`;
  // Winter spans two years: Nov 2026 → "Зима 2026/27".
  const start = date.getMonth() < 6 ? y - 1 : y;
  return `Зима ${start}/${String(start + 1).slice(2)}`;
}

// ---------------------------------------------------------------- events

export async function createEvent(input: { startsAt: number; location: string; note?: string }, seasonId: string, uid: string) {
  const id = newId();
  await store.set(`events/${id}`, {
    ...input,
    seasonId,
    status: 'open',
    createdBy: uid,
    createdAt: Date.now(),
    teams: [],
    adjustments: {},
    summary: null,
    finishedAt: null,
  });
  return id;
}

export const updateEvent = (id: string, data: Partial<Omit<FootballEvent, 'id'>>) => store.update(`events/${id}`, data);

export const deleteEvent = (id: string) => store.remove(`events/${id}`);

// ---------------------------------------------------------------- attendance

export function joinEvent(eventId: string, user: AppUser) {
  return store.set(`events/${eventId}/attendees/${user.uid}`, {
    kind: 'user',
    uid: user.uid,
    name: user.name,
    photoURL: user.photoURL ?? null,
    addedBy: user.uid,
    addedByName: user.name,
    createdAt: Date.now(),
  });
}

export function addGuest(eventId: string, name: string, host: AppUser) {
  return store.set(`events/${eventId}/attendees/${newId()}`, {
    kind: 'guest',
    uid: null,
    name: name.trim(),
    photoURL: null,
    addedBy: host.uid,
    addedByName: host.name,
    createdAt: Date.now(),
  });
}

export const removeAttendee = (eventId: string, attendeeId: string) =>
  store.remove(`events/${eventId}/attendees/${attendeeId}`);

// ---------------------------------------------------------------- results

export function computePoints(teams: Team[], adjustments: Record<string, number>, attendees: Attendee[]) {
  const points: Record<string, number> = {};
  for (const a of attendees) points[a.id] = adjustments[a.id] ?? 0;
  for (const t of teams) for (const pid of t.playerIds) if (pid in points) points[pid] += t.points;
  return points;
}

export async function saveResults(
  eventId: string,
  teams: Team[],
  adjustments: Record<string, number>,
  attendees: Attendee[],
  finish: boolean,
) {
  const ids = new Set(attendees.map((a) => a.id));
  const cleanTeams = teams.map((t) => ({ ...t, playerIds: t.playerIds.filter((p) => ids.has(p)) }));
  const cleanAdj = Object.fromEntries(Object.entries(adjustments).filter(([k, v]) => ids.has(k) && v !== 0));
  const data: Partial<FootballEvent> = { teams: cleanTeams, adjustments: cleanAdj };
  if (finish) {
    const summary: EventSummary = {
      attendees: attendees.map((a) => ({ id: a.id, name: a.name, uid: a.uid })),
      points: computePoints(cleanTeams, cleanAdj, attendees),
    };
    Object.assign(data, { status: 'finished', summary, finishedAt: Date.now() });
  }
  await updateEvent(eventId, data);
}

export const reopenEvent = (eventId: string) =>
  updateEvent(eventId, { status: 'open', summary: null, finishedAt: null });

// ---------------------------------------------------------------- profile

export const updateUser = (uid: string, data: Partial<Omit<AppUser, 'uid'>>) => store.update(`users/${uid}`, data);
