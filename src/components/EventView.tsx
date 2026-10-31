import { Check, Clock, MapPin, Search, Trash2, UserPlus, Users } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { addGuest, joinEvent, removeAttendee, useAttendees, useUsers } from '../lib/api';
import { dayMonth, plural, relativeDay, time, weekday } from '../lib/format';
import { useSession } from '../lib/session';
import type { AppUser, Attendee, FootballEvent } from '../lib/types';
import { Avatar, Badge, Button, Card, Field, IconButton, Modal, Spinner } from './ui';

export function EventView({ event }: { event: FootballEvent }) {
  const { user, isAdmin } = useSession();
  const { attendees, loading } = useAttendees(event.id);
  const [confirm, setConfirm] = useState<'join' | 'leave' | null>(null);
  const [guestOpen, setGuestOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  const me = attendees.find((a) => a.id === user.uid);
  // People I brought: guests without an account and registered players I signed up.
  const myGuests = attendees.filter((a) => a.addedBy === user.uid && a.id !== user.uid);
  const isOpen = event.status === 'open';
  const rel = relativeDay(event.startsAt);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden border-accent/25 bg-gradient-to-br from-surface-2 to-surface p-6">
        {/* center circle of a pitch */}
        <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full border-2 border-accent/10" />
        <div aria-hidden className="pointer-events-none absolute top-0 right-16 h-full w-0.5 bg-accent/5" />
        <div className="relative">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {rel && isOpen && <Badge className="bg-accent text-on-accent">{rel}</Badge>}
            {!isOpen && <Badge className="bg-surface text-muted">Завершено</Badge>}
          </div>
          <p className="font-display text-4xl leading-none font-extrabold tracking-tight">{weekday(event.startsAt)}</p>
          <p className="mt-2 text-lg font-semibold text-muted">{dayMonth(event.startsAt)}</p>
          <div className="mt-6 space-y-3">
            <p className="flex items-center gap-3 text-lg font-bold">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Clock size={20} />
              </span>
              {time(event.startsAt)}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 text-lg font-bold underline-offset-4 hover:underline"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <MapPin size={20} />
              </span>
              {event.location}
            </a>
          </div>
          {event.note && <p className="mt-5 rounded-2xl bg-bg/50 px-4 py-3 text-muted">{event.note}</p>}

          {isOpen && (
            <div className="mt-6">
              {me ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-14 flex-1 items-center gap-2 rounded-2xl bg-accent/15 px-4 font-bold text-accent">
                    <Check size={22} strokeWidth={3} /> Ти в складі!
                  </div>
                  <Button variant="secondary" className="h-14" onClick={() => setConfirm('leave')}>
                    Не зможу
                  </Button>
                </div>
              ) : (
                <Button size="lg" className="w-full" onClick={() => setConfirm('join')}>
                  Приєднатися
                </Button>
              )}
              <Button variant="ghost" className="mt-2 w-full text-muted" onClick={() => setGuestOpen(true)}>
                <UserPlus size={18} /> Додати друзів{myGuests.length > 0 && ` (${myGuests.length})`}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {event.status === 'finished' && event.summary && <ResultsCard event={event} />}

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Users size={20} className="text-accent" /> Склад
          </h2>
          <span className="font-display text-2xl font-extrabold text-accent tabular-nums">{attendees.length}</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-6 text-muted">
            <Spinner />
          </div>
        ) : attendees.length === 0 ? (
          <p className="py-6 text-center text-muted">Поки ніхто не записався. Будь першим!</p>
        ) : (
          <ol className="-mx-2">
            {attendees.map((a, i) => (
              <AttendeeRow
                key={a.id}
                index={i + 1}
                attendee={a}
                isMe={a.id === user.uid}
                canRemove={isOpen && (isAdmin || a.addedBy === user.uid)}
                onRemove={() => removeAttendee(event.id, a.id)}
              />
            ))}
          </ol>
        )}
      </Card>

      <Modal open={confirm === 'join'} onClose={() => setConfirm(null)} title="Підтверджуєш участь?">
        <p className="mb-6 text-muted">
          {weekday(event.startsAt)}, {dayMonth(event.startsAt)} о {time(event.startsAt)}
          <br />
          {event.location}
        </p>
        <Button size="lg" className="w-full" loading={busy} onClick={() => act(() => joinEvent(event.id, user))}>
          Так, я буду!
        </Button>
        <Button variant="ghost" className="mt-2 w-full" onClick={() => setConfirm(null)}>
          Скасувати
        </Button>
      </Modal>

      <Modal open={confirm === 'leave'} onClose={() => setConfirm(null)} title="Скасувати участь?">
        <p className="mb-6 text-muted">Тебе буде прибрано зі списку. Твої гості залишаться.</p>
        <Button variant="danger" className="w-full" loading={busy} onClick={() => act(() => removeAttendee(event.id, user.uid))}>
          Так, не зможу прийти
        </Button>
        <Button variant="ghost" className="mt-2 w-full" onClick={() => setConfirm(null)}>
          Залишитись у списку
        </Button>
      </Modal>

      <GuestsModal open={guestOpen} onClose={() => setGuestOpen(false)} event={event} guests={myGuests} attendees={attendees} />
    </div>
  );
}

function AttendeeRow({ attendee: a, index, isMe, canRemove, onRemove }: { attendee: Attendee; index: number; isMe: boolean; canRemove: boolean; onRemove: () => void }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl px-2 py-2">
      <span className="w-5 text-right text-sm font-bold text-muted tabular-nums">{index}</span>
      <Avatar name={a.name} photoURL={a.photoURL} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">
          {a.name}
          {isMe && <span className="font-semibold text-accent"> · ти</span>}
        </p>
        {a.kind === 'guest' ? (
          <p className="truncate text-sm text-muted">Гість від {a.addedByName}</p>
        ) : (
          a.addedBy !== a.uid && <p className="truncate text-sm text-muted">Записав(-ла) {a.addedByName}</p>
        )}
      </div>
      {a.kind === 'guest' && <Badge className="bg-team-c/15 text-team-c">Гість</Badge>}
      {canRemove && !isMe && (
        <IconButton label={`Прибрати ${a.name}`} onClick={onRemove}>
          <Trash2 size={18} />
        </IconButton>
      )}
    </li>
  );
}

function GuestsModal({ open, onClose, event, guests, attendees }: { open: boolean; onClose: () => void; event: FootballEvent; guests: Attendee[]; attendees: Attendee[] }) {
  const { user } = useSession();
  const users = useUsers();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const present = new Set(attendees.map((a) => a.id));
  const matches = q
    ? users
        .filter((u) => u.name.toLowerCase().includes(q))
        .sort((a, b) => Number(present.has(a.uid)) - Number(present.has(b.uid)) || a.name.localeCompare(b.name))
        .slice(0, 6)
    : [];
  const available = matches.filter((u) => !present.has(u.uid));

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      setQuery('');
      // Keep the keyboard open for adding the next friend.
      searchRef.current?.querySelector('input')?.focus();
    } finally {
      setBusy(false);
    }
  };
  const addUser = (u: AppUser) => user && run(() => joinEvent(event.id, u, user));
  const addAsGuest = () => user && q && run(() => addGuest(event.id, query, user));

  // Enter picks the first available player, or adds a guest when nobody matches.
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (available[0]) addUser(available[0]);
    else if (!matches.length) addAsGuest();
  };

  return (
    <Modal open={open} onClose={onClose} title="Додати друзів">
      <p className="mb-4 text-muted">Знайди гравця із застосунку або впиши ім’я гостя без акаунта.</p>
      <form onSubmit={submit}>
        <div className="relative" ref={searchRef}>
          <Search size={18} className="pointer-events-none absolute top-[2.85rem] left-4 text-muted" aria-hidden />
          <Field
            label="Ім’я друга"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Почни вводити ім’я…"
            maxLength={40}
            autoComplete="off"
            className="[&_input]:pl-11"
          />
        </div>
      </form>

      {q && (
        <ul className="mt-2 space-y-1" aria-label="Результати пошуку">
          {matches.map((u) => {
            const inList = present.has(u.uid);
            return (
              <li key={u.uid}>
                <button
                  disabled={inList || busy}
                  onClick={() => addUser(u)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-surface-2 disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <Avatar name={u.name} photoURL={u.photoURL} size={36} />
                  <span className={`flex-1 truncate font-semibold ${inList ? 'text-muted' : ''}`}>{u.name}</span>
                  {inList ? (
                    <span className="text-xs font-semibold text-muted">вже в складі</span>
                  ) : (
                    <UserPlus size={18} className="text-accent" />
                  )}
                </button>
              </li>
            );
          })}
          <li>
            <button
              disabled={busy}
              onClick={addAsGuest}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-dashed px-3 py-3 text-left transition ${
                matches.length ? 'border-line text-muted hover:text-fg' : 'border-accent/50 bg-accent/10 text-accent'
              }`}
            >
              <UserPlus size={18} className="shrink-0" />
              <span className="min-w-0 flex-1 font-semibold break-words">
                {matches.length ? 'Інша людина? ' : 'Такого гравця немає. '}Додати «{query.trim()}» як гостя
              </span>
            </button>
          </li>
        </ul>
      )}

      {guests.length > 0 && (
        <>
          <p className="mt-5 mb-2 text-sm font-semibold text-muted">Ти привів</p>
          <ul className="space-y-1">
            {guests.map((g) => (
              <li key={g.id} className="flex items-center gap-3 rounded-2xl bg-bg/50 py-1 pr-1 pl-3">
                <Avatar name={g.name} photoURL={g.photoURL} size={32} />
                <span className="flex-1 truncate font-semibold">{g.name}</span>
                {g.kind === 'guest' && <Badge className="bg-team-c/15 text-team-c">Гість</Badge>}
                <IconButton label={`Прибрати ${g.name}`} onClick={() => removeAttendee(event.id, g.id)}>
                  <Trash2 size={18} />
                </IconButton>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}

export const TEAM_COLORS = ['var(--color-team-a)', 'var(--color-team-b)', 'var(--color-team-c)', 'var(--color-team-d)'];

function ResultsCard({ event }: { event: FootballEvent }) {
  const s = event.summary!;
  const teams = event.teams ?? [];
  const name = (id: string) => s.attendees.find((a) => a.id === id)?.name ?? '—';
  return (
    <Card>
      <h2 className="mb-4 font-display text-lg font-bold">Результати</h2>
      <div className="space-y-3">
        {teams.map((t, i) => (
          <div key={t.id} className="rounded-2xl bg-bg/50 p-4" style={{ borderLeft: `4px solid ${TEAM_COLORS[i % 4]}` }}>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold">{t.name}</span>
              <span className="font-display font-extrabold tabular-nums" style={{ color: TEAM_COLORS[i % 4] }}>
                {t.points} {plural(t.points, 'очко', 'очки', 'очок')}
              </span>
            </div>
            <p className="text-sm text-muted">
              {t.playerIds.map((id) => {
                const adj = event.adjustments?.[id];
                return (
                  <span key={id} className="mr-1 inline-block after:content-[','] last:after:content-none">
                    {name(id)}
                    {adj ? <span className={adj > 0 ? 'text-accent' : 'text-danger'}> {adj > 0 ? `+${adj}` : adj}</span> : null}
                  </span>
                );
              })}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
