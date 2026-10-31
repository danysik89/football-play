import { CalendarPlus, ChevronRight, Goal } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EventView } from '../components/EventView';
import { Button, EmptyState, Spinner } from '../components/ui';
import { pickCurrentEvent, useEvent, useEvents } from '../lib/api';
import { shortDate, time } from '../lib/format';
import { useSession } from '../lib/session';
import type { FootballEvent } from '../lib/types';

export function HomePage() {
  const { user, isAdmin } = useSession();
  const navigate = useNavigate();
  const { events, loading } = useEvents();
  if (loading) return <PageSpinner />;

  const current = pickCurrentEvent(events);
  const upcoming = events.filter((e) => e.status === 'open' && e !== current && e.startsAt > Date.now());
  const past = events.filter((e) => e.status === 'finished').slice(-3).reverse();

  return (
    <>
      <p className="mb-4 text-muted">
        Привіт, <span className="font-bold text-fg">{user?.name.split(' ')[0]}</span>
      </p>
      {current ? (
        <EventView event={current} />
      ) : (
        <EmptyState
          icon={<Goal size={30} />}
          title="Найближчих тренувань немає"
          text={isAdmin ? 'Створи нову подію, щоб гравці могли записатися.' : 'Адміністратор ще не створив наступне тренування. Зазирни пізніше.'}
          action={
            isAdmin && (
              <Button onClick={() => navigate('/admin')}>
                <CalendarPlus size={20} /> Створити тренування
              </Button>
            )
          }
        />
      )}
      {upcoming.length > 0 && <EventList title="Далі в розкладі" events={upcoming} />}
      {past.length > 0 && <EventList title="Минулі тренування" events={past} />}
    </>
  );
}

function EventList({ title, events }: { title: string; events: FootballEvent[] }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-bold tracking-wider text-muted uppercase">{title}</h2>
      <ul className="space-y-2">
        {events.map((e) => (
          <li key={e.id}>
            <Link to={`/event/${e.id}`} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-accent/40">
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {shortDate(e.startsAt)} · {time(e.startsAt)}
                </p>
                <p className="truncate text-sm text-muted">{e.location}</p>
              </div>
              <ChevronRight size={20} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EventPage() {
  const { id } = useParams();
  const { event, loading } = useEvent(id);
  if (loading) return <PageSpinner />;
  if (!event) return <EmptyState icon={<Goal size={30} />} title="Подію не знайдено" action={<Link to="/" className="font-bold text-accent">На головну</Link>} />;
  return <EventView event={event} />;
}

export const PageSpinner = () => (
  <div className="flex justify-center py-24 text-accent">
    <Spinner className="size-8" />
  </div>
);
