import { CalendarPlus, ChevronRight, Flag, Snowflake, Sun, UsersRound } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Field, Modal, PageTitle } from '../components/ui';
import { createEvent, defaultSeasonName, startSeason, useEvents, useSeasons } from '../lib/api';
import { shortDate, time, toLocalInput } from '../lib/format';
import { useSession } from '../lib/session';
import type { Season, SeasonType } from '../lib/types';
import { PageSpinner } from './HomePage';

/** Next Sunday at 10:00 — the usual slot. */
function nextSunday() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  d.setHours(10, 0, 0, 0);
  return d.getTime();
}

export function AdminPage() {
  const { seasons, activeSeason, loading } = useSeasons();
  const { events, loading: evLoading } = useEvents();
  if (loading || evLoading) return <PageSpinner />;

  const open = events.filter((e) => e.status === 'open');
  const finished = events.filter((e) => e.status === 'finished').reverse().slice(0, 10);

  return (
    <>
      <PageTitle sub="Сезони, тренування та результати">Керування</PageTitle>
      <div className="space-y-4">
        <SeasonCard active={activeSeason} hasSeasons={seasons.length > 0} />
        <Link to="/admin/users" className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5 transition hover:border-accent/40">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent-ink">
            <UsersRound size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-bold">Гравці та ролі</p>
            <p className="text-sm text-muted">Призначити інших адмінів</p>
          </div>
          <ChevronRight size={20} className="shrink-0 text-muted" />
        </Link>
        {activeSeason && <CreateEventCard seasonId={activeSeason.id} lastLocation={events.at(-1)?.location ?? ''} />}

        {open.length > 0 && (
          <Section title="Активні події">
            {open.map((e) => (
              <EventLink key={e.id} id={e.id} title={`${shortDate(e.startsAt)} · ${time(e.startsAt)}`} sub={e.location}>
                {e.startsAt < Date.now() && <Badge className="bg-team-c/15 text-team-c">Внести результати</Badge>}
              </EventLink>
            ))}
          </Section>
        )}
        {finished.length > 0 && (
          <Section title="Завершені">
            {finished.map((e) => (
              <EventLink key={e.id} id={e.id} title={`${shortDate(e.startsAt)} · ${time(e.startsAt)}`} sub={`${e.location} · ${e.summary?.attendees.length ?? 0} учасн.`} />
            ))}
          </Section>
        )}
      </div>
    </>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="pt-4">
    <h2 className="mb-3 text-sm font-bold tracking-wider text-muted uppercase">{title}</h2>
    <ul className="space-y-2">{children}</ul>
  </section>
);

const EventLink = ({ id, title, sub, children }: { id: string; title: string; sub: string; children?: React.ReactNode }) => (
  <li>
    <Link to={`/admin/event/${id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-accent/40">
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        <p className="truncate text-sm text-muted">{sub}</p>
      </div>
      {children}
      <ChevronRight size={20} className="shrink-0 text-muted" />
    </Link>
  </li>
);

function SeasonCard({ active, hasSeasons }: { active: Season | null; hasSeasons: boolean }) {
  const [open, setOpen] = useState(false);
  const suggested: SeasonType = active ? (active.type === 'summer' ? 'winter' : 'summer') : [3, 4, 5, 6, 7, 8].includes(new Date().getMonth()) ? 'summer' : 'winter';
  const [type, setType] = useState<SeasonType>(suggested);
  const [name, setName] = useState(defaultSeasonName(suggested));
  const [busy, setBusy] = useState(false);

  const pick = (t: SeasonType) => {
    setType(t);
    setName(defaultSeasonName(t));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await startSeason(type, name.trim() || defaultSeasonName(type), active);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const Icon = active?.type === 'winter' ? Snowflake : Sun;
  return (
    <Card>
      <div className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent-ink">
          {active ? <Icon size={24} /> : <Flag size={24} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">Поточний сезон</p>
          <p className="truncate font-display text-base font-bold">{active ? active.name : 'Не розпочато'}</p>
        </div>
        <Button size="sm" variant={active ? 'secondary' : 'primary'} onClick={() => setOpen(true)}>
          {active ? 'Новий' : 'Почати'}
        </Button>
      </div>
      {!active && <p className="mt-4 text-sm text-muted">Щоб створювати тренування, спершу почни сезон.</p>}

      <Modal open={open} onClose={() => setOpen(false)} title="Новий сезон">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['summer', 'winter'] as const).map((t) => (
              <button
                type="button"
                key={t}
                aria-pressed={type === t}
                onClick={() => pick(t)}
                className={`flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border font-bold transition ${
                  type === t ? 'border-accent bg-accent/10 text-accent-ink' : 'border-line text-muted hover:text-fg'
                }`}
              >
                {t === 'summer' ? <Sun size={22} /> : <Snowflake size={22} />}
                {t === 'summer' ? 'Літній' : 'Зимовий'}
              </button>
            ))}
          </div>
          <Field label="Назва сезону" value={name} onChange={(e) => setName(e.target.value)} />
          {active && hasSeasons && (
            <p className="rounded-2xl bg-team-c/10 px-4 py-3 text-sm text-team-c">
              Сезон «{active.name}» буде завершено. Його рейтинг збережеться в історії.
            </p>
          )}
          <Button type="submit" className="w-full" loading={busy}>
            Почати сезон
          </Button>
        </form>
      </Modal>
    </Card>
  );
}

function CreateEventCard({ seasonId, lastLocation }: { seasonId: string; lastLocation: string }) {
  const { user } = useSession();
  const initialDate = useMemo(() => toLocalInput(nextSunday()), []);
  const [date, setDate] = useState(initialDate);
  const [location, setLocation] = useState(lastLocation);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !date || !location.trim()) return;
    setBusy(true);
    try {
      await createEvent({ startsAt: new Date(date).getTime(), location: location.trim(), note: note.trim() || undefined }, seasonId, user.uid);
      setNote('');
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
        <CalendarPlus size={20} className="text-accent-ink" /> Нове тренування
      </h2>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Дата і час" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Field label="Місце" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="вул. Шевченка, 12, стадіон «Колос»" required />
        <Field label="Коментар (необов’язково)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Беріть світлі й темні футболки" />
        <Button type="submit" className="w-full" loading={busy} disabled={!date || !location.trim()}>
          {done ? 'Створено!' : 'Створити подію'}
        </Button>
      </form>
    </Card>
  );
}
