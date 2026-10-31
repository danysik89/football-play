/**
 * Hardcoded sample data for demo mode: two seasons, a dozen finished trainings
 * with teams and points, and upcoming events. Overwrites the local demo DB.
 */
import type { AppUser, Attendee, FootballEvent, Season, Team } from './types';

const PLAYERS = [
  'Андрій Ярмоленко', 'Олександр Зінченко', 'Руслан Малиновський', 'Віталій Миколенко',
  'Михайло Мудрик', 'Ілля Забарний', 'Георгій Судаков', 'Артем Довбик',
  'Микола Матвієнко', 'Анатолій Трубін', 'Тарас Степаненко', 'Олександр Караваєв',
  'Сергій Сидорчук', 'Владислав Ванат', 'Богдан Михайліченко', 'Назар Волошин',
];
const GUESTS = ['Олег', 'Тарас', 'Дмитро', 'Ігор', 'Максим', 'Роман'];

const SUMMER_PLACE = 'Стадіон «Колос», вул. Січових Стрільців, 37';
const WINTER_PLACE = 'Манеж «Арена», вул. Городоцька, 85';

/** Small deterministic PRNG so the demo looks the same every time. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h, 0).getTime();

export function buildDemoData(me: { uid: string; name: string; email: string }) {
  const rand = rng(42);
  const docs: Record<string, object> = {};

  const users: AppUser[] = [
    { uid: me.uid, name: me.name, email: me.email, photoURL: null, role: 'admin', createdAt: at(2026, 5, 20) },
    ...PLAYERS.map((name, i) => ({ uid: `p${i}`, name, email: `player${i}@demo.ua`, photoURL: null, role: 'user' as const, createdAt: at(2026, 5, 20) })),
  ];
  for (const { uid, ...u } of users) docs[`users/${uid}`] = u;

  // How likely each player is to show up — makes "most active" chart interesting.
  const regularity = users.map((u, i) => (u.uid === me.uid ? 0.85 : 0.35 + ((i * 37) % 60) / 100));

  const seasons: Season[] = [
    { id: 'summer26', name: 'Літо 2026', type: 'summer', active: false, startedAt: at(2026, 6, 1), endedAt: at(2026, 9, 30) },
    { id: 'winter26', name: 'Зима 2026/27', type: 'winter', active: true, startedAt: at(2026, 10, 1), endedAt: null },
  ];
  for (const { id, ...s } of seasons) docs[`seasons/${id}`] = s;

  const finishedDates = [
    ...[[7, 5], [7, 12], [7, 19], [7, 26], [8, 2], [8, 9], [8, 16], [8, 30], [9, 6], [9, 13], [9, 20], [9, 27]].map(([m, d]) => ({ ts: at(2026, m!, d!), season: 'summer26', place: SUMMER_PLACE })),
    ...[[10, 4], [10, 11], [10, 18], [10, 25]].map(([m, d]) => ({ ts: at(2026, m!, d!), season: 'winter26', place: WINTER_PLACE })),
  ];

  finishedDates.forEach(({ ts, season, place }, n) => {
    const id = `ev${n}`;
    const attendees: Attendee[] = [];
    for (const [i, u] of users.entries()) {
      if (rand() < regularity[i]!) attendees.push(userAttendee(u, ts));
    }
    const guestCount = Math.floor(rand() * 3);
    for (let g = 0; g < guestCount; g++) {
      const host = attendees[Math.floor(rand() * attendees.length)]!;
      attendees.push(guestAttendee(`g${n}_${g}`, GUESTS[(n + g) % GUESTS.length]!, host, ts));
    }

    // 15+ people → three teams of 5, otherwise two teams.
    const teamCount = attendees.length >= 15 ? 3 : 2;
    const shuffled = [...attendees].sort(() => rand() - 0.5);
    const scores = teamCount === 3 ? [[6, 3, 1], [4, 4, 2], [7, 2, 0]] : [[3, 0], [1, 1], [3, 0], [2, 1]];
    const pick = scores[Math.floor(rand() * scores.length)]!;
    const teams: Team[] = Array.from({ length: teamCount }, (_, t) => ({
      id: `${id}_t${t}`,
      name: `Команда ${'ABC'[t]}`,
      points: pick[t]!,
      playerIds: shuffled.filter((_, j) => j % teamCount === t).map((a) => a.id),
    }));

    // Occasional MVP bonus and late-comer penalty.
    const adjustments: Record<string, number> = {};
    if (rand() < 0.6) adjustments[shuffled[0]!.id] = 2;
    if (rand() < 0.3) adjustments[shuffled[shuffled.length - 1]!.id] = -1;

    const points: Record<string, number> = {};
    for (const a of attendees) points[a.id] = adjustments[a.id] ?? 0;
    for (const t of teams) for (const p of t.playerIds) points[p]! += t.points;

    const event: Omit<FootballEvent, 'id'> = {
      seasonId: season,
      startsAt: ts,
      location: place,
      status: 'finished',
      createdBy: me.uid,
      createdAt: ts - 5 * 86400_000,
      teams,
      adjustments,
      summary: { attendees: attendees.map((a) => ({ id: a.id, name: a.name, uid: a.uid })), points },
      finishedAt: ts + 3 * 3600_000,
    };
    docs[`events/${id}`] = event;
    for (const { id: aid, ...a } of attendees) docs[`events/${id}/attendees/${aid}`] = a;
  });

  // Upcoming: tomorrow with a filled roster (without you — try "Приєднатися"), and next week.
  const sunday = new Date();
  sunday.setDate(sunday.getDate() + ((7 - sunday.getDay()) % 7 || 7));
  sunday.setHours(10, 0, 0, 0);
  const upcoming = [
    { id: 'next1', ts: sunday.getTime(), count: 11, note: 'Беріть світлі й темні футболки. Після гри — фото на рейтинг!' },
    { id: 'next2', ts: sunday.getTime() + 7 * 86400_000, count: 4, note: '' },
  ];
  for (const { id, ts, count, note } of upcoming) {
    docs[`events/${id}`] = {
      seasonId: 'winter26', startsAt: ts, location: WINTER_PLACE, note, status: 'open',
      createdBy: me.uid, createdAt: Date.now(), teams: [], adjustments: {}, summary: null, finishedAt: null,
    };
    users.slice(1, count + 1).forEach((u, i) => {
      const { id: aid, ...a } = userAttendee(u, Date.now() - (count - i) * 3600_000);
      docs[`events/${id}/attendees/${aid}`] = a;
    });
  }
  const host = users[2]!;
  for (const [i, name] of ['Дмитро', 'Максим'].entries()) {
    const { id: aid, ...a } = guestAttendee(`gnext${i}`, name, userAttendee(host, 0), Date.now() - 600_000 + i);
    docs[`events/next1/attendees/${aid}`] = a;
  }

  return docs;
}

function userAttendee(u: AppUser, ts: number): Attendee {
  return { id: u.uid, kind: 'user', uid: u.uid, name: u.name, photoURL: null, addedBy: u.uid, addedByName: u.name, createdAt: ts - 86400_000 };
}

function guestAttendee(id: string, name: string, host: Attendee, ts: number): Attendee {
  return { id, kind: 'guest', uid: null, name, photoURL: null, addedBy: host.uid!, addedByName: host.name, createdAt: ts - 3600_000 };
}

export function loadDemoData(me: { uid: string; name: string; email: string }) {
  localStorage.setItem('fc-demo-db', JSON.stringify(buildDemoData(me)));
  localStorage.setItem(SEEDED_KEY, '1');
  location.assign(import.meta.env.BASE_URL);
}

const SEEDED_KEY = 'fc-demo-seeded';

/** First visit in demo mode: fill the app so it doesn't look empty. Runs once per browser. */
export function seedOnFirstVisit(me: { uid: string; name: string; email: string }) {
  try {
    if (localStorage.getItem(SEEDED_KEY)) return;
    const db = JSON.parse(localStorage.getItem('fc-demo-db') || '{}') as Record<string, unknown>;
    if (Object.keys(db).some((p) => p.startsWith('events/'))) {
      localStorage.setItem(SEEDED_KEY, '1');
      return;
    }
    loadDemoData(me);
  } catch {
    /* storage unavailable — leave the app empty */
  }
}
