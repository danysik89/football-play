import { ArrowLeft, Minus, Pencil, Plus, Shuffle, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TEAM_COLORS } from '../components/EventView';
import { Avatar, Badge, Button, Card, EmptyState, Field, IconButton, Modal } from '../components/ui';
import { addGuest, computePoints, deleteEvent, joinEvent, reopenEvent, saveResults, updateEvent, useAttendees, useEvent, useUsers } from '../lib/api';
import { newId } from '../lib/backend';
import { dayMonth, plural, time, toLocalInput, weekday } from '../lib/format';
import { useSession } from '../lib/session';
import type { Attendee, FootballEvent, Team } from '../lib/types';
import { PageSpinner } from './HomePage';

const LETTERS = ['A', 'B', 'C', 'D'];
const makeTeams = (n: number, prev: Team[] = []): Team[] =>
  Array.from({ length: n }, (_, i) => prev[i] ?? { id: newId(), name: `Команда ${LETTERS[i]}`, points: 0, playerIds: [] });

export function AdminEventPage() {
  const { id } = useParams();
  const { event, loading } = useEvent(id);
  const { attendees, loading: aLoading } = useAttendees(id);
  if (loading || aLoading) return <PageSpinner />;
  if (!event) return <EmptyState icon={<ArrowLeft />} title="Подію не знайдено" action={<Link to="/admin" className="font-bold text-accent-ink">Назад</Link>} />;
  return <Editor key={event.id} event={event} attendees={attendees} />;
}

function Editor({ event, attendees }: { event: FootballEvent; attendees: Attendee[] }) {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>(() =>
    event.teams?.length ? event.teams : makeTeams(attendees.length >= 15 ? 3 : 2),
  );
  const [adjustments, setAdjustments] = useState<Record<string, number>>(event.adjustments ?? {});
  const [saving, setSaving] = useState<'save' | 'finish' | null>(null);
  const [saved, setSaved] = useState(false);
  const [modal, setModal] = useState<'details' | 'add' | 'finish' | 'delete' | null>(null);
  const finished = event.status === 'finished';

  const teamOf = useMemo(() => {
    const m: Record<string, number> = {};
    teams.forEach((t, i) => t.playerIds.forEach((p) => (m[p] = i)));
    return m;
  }, [teams]);
  const points = computePoints(teams, adjustments, attendees);
  const unassigned = attendees.filter((a) => teamOf[a.id] === undefined);

  // Mark unsaved changes.
  useEffect(() => setSaved(false), [teams, adjustments]);

  const assign = (playerId: string, teamIdx: number) =>
    setTeams((ts) =>
      ts.map((t, i) => {
        const without = t.playerIds.filter((p) => p !== playerId);
        // Tapping the current team again removes the player from it.
        return i === teamIdx && teamOf[playerId] !== teamIdx ? { ...t, playerIds: [...without, playerId] } : { ...t, playerIds: without };
      }),
    );

  const setCount = (n: number) =>
    setTeams((ts) => {
      const next = makeTeams(n, ts);
      return next.map((t, i) => (i < ts.length ? t : { ...t, playerIds: [] }));
    });

  const shuffle = () => {
    const ids = attendees.map((a) => a.id).sort(() => Math.random() - 0.5);
    setTeams((ts) => ts.map((t, i) => ({ ...t, playerIds: ids.filter((_, j) => j % ts.length === i) })));
  };

  const patchTeam = (i: number, patch: Partial<Team>) => setTeams((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const adjust = (pid: string, delta: number) => setAdjustments((a) => ({ ...a, [pid]: (a[pid] ?? 0) + delta }));

  const save = async (finish: boolean) => {
    setSaving(finish ? 'finish' : 'save');
    try {
      await saveResults(event.id, teams, adjustments, attendees, finish || finished);
      setSaved(true);
      setModal(null);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <IconButton label="Назад" onClick={() => navigate('/admin')} className="-ml-3">
          <ArrowLeft size={22} />
        </IconButton>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg font-extrabold">
            {weekday(event.startsAt)}, {dayMonth(event.startsAt)}
          </h1>
          <p className="truncate text-sm text-muted">
            {time(event.startsAt)} · {event.location}
          </p>
        </div>
        <IconButton label="Редагувати подію" onClick={() => setModal('details')}>
          <Pencil size={20} />
        </IconButton>
      </div>

      {finished && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-accent/10 px-4 py-3 text-sm font-semibold text-accent-ink">
          Подію завершено, очки в рейтингу.
          <button className="cursor-pointer underline underline-offset-2" onClick={() => reopenEvent(event.id)}>
            Відкрити знову
          </button>
        </div>
      )}

      {/* Teams */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold">Команди</h2>
          <div className="flex items-center gap-1 rounded-xl bg-bg p-1" role="group" aria-label="Кількість команд">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                aria-pressed={teams.length === n}
                onClick={() => setCount(n)}
                className={`size-9 cursor-pointer rounded-lg font-bold transition ${teams.length === n ? 'bg-surface-2 text-fg' : 'text-muted'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {teams.map((t, i) => (
            <div key={t.id} className="rounded-2xl border p-3" style={{ borderColor: `color-mix(in srgb, ${TEAM_COLORS[i]} 40%, transparent)` }}>
              <input
                aria-label={`Назва команди ${LETTERS[i]}`}
                value={t.name}
                onChange={(e) => patchTeam(i, { name: e.target.value })}
                className="w-full bg-transparent font-bold outline-none"
                style={{ color: TEAM_COLORS[i] }}
              />
              <p className="mb-2 text-xs text-muted">
                {t.playerIds.length} {plural(t.playerIds.length, 'гравець', 'гравці', 'гравців')}
              </p>
              <Stepper label={`Очки команди ${t.name}`} value={t.points} onChange={(v) => patchTeam(i, { points: v })} />
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="mt-3 w-full text-muted" onClick={shuffle} disabled={!attendees.length}>
          <Shuffle size={16} /> Розподілити випадково
        </Button>
      </Card>

      {/* Players */}
      <Card className="px-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <h2 className="font-display text-lg font-bold">
            Гравці <span className="text-muted">{attendees.length}</span>
          </h2>
          <Button size="sm" variant="secondary" onClick={() => setModal('add')}>
            <UserPlus size={16} /> Додати
          </Button>
        </div>
        <p className="mb-3 px-2 text-sm text-muted">Обери команду для кожного. ± — бонус чи штраф окремому гравцю.</p>
        {attendees.length === 0 ? (
          <p className="py-6 text-center text-muted">На цю подію ще ніхто не записався.</p>
        ) : (
          <ul className="divide-y divide-line">
            {attendees.map((a) => {
              const ti = teamOf[a.id];
              return (
                <li key={a.id} className="px-2 py-3">
                  <div className="mb-2 flex items-center gap-3">
                    <Avatar name={a.name} photoURL={a.photoURL} size={32} />
                    <p className="min-w-0 flex-1 truncate font-bold">
                      {a.name} {a.kind === 'guest' && <Badge className="bg-team-c/15 text-team-c">Гість</Badge>}
                    </p>
                    <span className="font-display font-extrabold tabular-nums" style={{ color: ti !== undefined ? TEAM_COLORS[ti] : 'var(--color-muted)' }}>
                      {points[a.id] ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pl-11">
                    <div className="flex gap-1" role="group" aria-label={`Команда для ${a.name}`}>
                      {teams.map((t, i) => (
                        <button
                          key={t.id}
                          aria-pressed={ti === i}
                          aria-label={t.name}
                          onClick={() => assign(a.id, i)}
                          className="size-11 cursor-pointer rounded-xl border font-display font-bold transition"
                          style={
                            ti === i
                              ? { background: TEAM_COLORS[i], borderColor: TEAM_COLORS[i], color: 'var(--color-surface)' }
                              : { borderColor: 'var(--color-line)', color: 'var(--color-muted)' }
                          }
                        >
                          {LETTERS[i]}
                        </button>
                      ))}
                    </div>
                    <div className="ml-auto">
                      <Stepper compact label={`Бонус/штраф для ${a.name}`} value={adjustments[a.id] ?? 0} onChange={(v) => adjust(a.id, v - (adjustments[a.id] ?? 0))} signed />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Sticky actions */}
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[5] -mx-4 bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pt-6 pb-2">
        {unassigned.length > 0 && attendees.length > 0 && (
          <p className="mb-2 text-center text-sm text-team-c">
            Без команди: {unassigned.length} {plural(unassigned.length, 'гравець', 'гравці', 'гравців')}
          </p>
        )}
        <div className="flex gap-2">
          {!finished && (
            <Button variant="secondary" className="flex-1" loading={saving === 'save'} onClick={() => save(false)}>
              {saved ? 'Збережено' : 'Зберегти'}
            </Button>
          )}
          <Button className="flex-[2]" disabled={!attendees.length} loading={finished && saving !== null} onClick={() => (finished ? save(true) : setModal('finish'))}>
            {finished ? (saved ? 'Оновлено' : 'Оновити результати') : 'Завершити подію'}
          </Button>
        </div>
      </div>

      <Modal open={modal === 'finish'} onClose={() => setModal(null)} title="Завершити подію?">
        <ul className="mb-4 space-y-1">
          {teams.map((t, i) => (
            <li key={t.id} className="flex justify-between rounded-xl bg-bg/50 px-4 py-2 font-semibold">
              <span style={{ color: TEAM_COLORS[i] }}>{t.name}</span>
              <span className="tabular-nums">
                {t.playerIds.length} гр. · {t.points} оч.
              </span>
            </li>
          ))}
        </ul>
        {unassigned.length > 0 && (
          <p className="mb-4 rounded-2xl bg-team-c/10 px-4 py-3 text-sm text-team-c">
            {unassigned.map((a) => a.name).join(', ')} без команди — отримають лише бонуси.
          </p>
        )}
        <p className="mb-6 text-muted">Очки потраплять у рейтинг сезону. Змінити їх можна буде й пізніше.</p>
        <Button className="w-full" loading={saving === 'finish'} onClick={() => save(true)}>
          Так, завершити
        </Button>
      </Modal>

      <DetailsModal open={modal === 'details'} onClose={() => setModal(null)} event={event} onDelete={() => setModal('delete')} />

      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Видалити подію?">
        <p className="mb-6 text-muted">Список учасників і очки цієї події буде втрачено. Цю дію не можна скасувати.</p>
        <Button
          variant="danger"
          className="w-full"
          onClick={async () => {
            await deleteEvent(event.id);
            navigate('/admin');
          }}
        >
          <Trash2 size={18} /> Видалити
        </Button>
      </Modal>

      <AddPlayerModal open={modal === 'add'} onClose={() => setModal(null)} event={event} attendees={attendees} />
    </div>
  );
}

function Stepper({ value, onChange, label, compact, signed }: { value: number; onChange: (v: number) => void; label: string; compact?: boolean; signed?: boolean }) {
  const size = compact ? 'size-9' : 'size-10';
  const color = !signed || value === 0 ? '' : value > 0 ? 'text-accent-ink' : 'text-danger';
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <button aria-label="Мінус" onClick={() => onChange(value - 1)} className={`${size} flex cursor-pointer items-center justify-center rounded-xl bg-bg text-muted transition hover:text-fg`}>
        <Minus size={16} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={`w-10 bg-transparent text-center font-display font-bold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none ${color}`}
      />
      <button aria-label="Плюс" onClick={() => onChange(value + 1)} className={`${size} flex cursor-pointer items-center justify-center rounded-xl bg-bg text-muted transition hover:text-fg`}>
        <Plus size={16} />
      </button>
    </div>
  );
}

function DetailsModal({ open, onClose, event, onDelete }: { open: boolean; onClose: () => void; event: FootballEvent; onDelete: () => void }) {
  const [date, setDate] = useState(toLocalInput(event.startsAt));
  const [location, setLocation] = useState(event.location);
  const [note, setNote] = useState(event.note ?? '');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateEvent(event.id, { startsAt: new Date(date).getTime(), location: location.trim(), note: note.trim() });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Деталі події">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Дата і час" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Field label="Місце" value={location} onChange={(e) => setLocation(e.target.value)} required />
        <Field label="Коментар" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button type="submit" className="w-full" loading={busy}>
          Зберегти
        </Button>
        <Button type="button" variant="danger" className="w-full" onClick={onDelete}>
          <Trash2 size={18} /> Видалити подію
        </Button>
      </form>
    </Modal>
  );
}

function AddPlayerModal({ open, onClose, event, attendees }: { open: boolean; onClose: () => void; event: FootballEvent; attendees: Attendee[] }) {
  const { user } = useSession();
  const users = useUsers();
  const [guest, setGuest] = useState('');
  const present = new Set(attendees.map((a) => a.id));
  const missing = users.filter((u) => !present.has(u.uid)).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Modal open={open} onClose={onClose} title="Додати учасника">
      <p className="mb-3 text-sm text-muted">Хтось прийшов, але не записався? Додай його вручну.</p>
      <form
        className="mb-4 flex items-end gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!guest.trim() || !user) return;
          await addGuest(event.id, guest, user);
          setGuest('');
        }}
      >
        <Field label="Гість (без акаунта)" className="flex-1" value={guest} onChange={(e) => setGuest(e.target.value)} placeholder="Ім’я" />
        <Button type="submit" disabled={!guest.trim()} aria-label="Додати гостя">
          <UserPlus size={20} />
        </Button>
      </form>
      {missing.length > 0 && (
        <>
          <p className="mb-2 text-sm font-semibold text-muted">Гравці з акаунтом</p>
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {missing.map((u) => (
              <li key={u.uid}>
                <button onClick={() => joinEvent(event.id, u)} className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-surface-2">
                  <Avatar name={u.name} photoURL={u.photoURL} size={36} />
                  <span className="flex-1 truncate font-semibold">{u.name}</span>
                  <Plus size={18} className="text-accent-ink" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}
