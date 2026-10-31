import { LogOut, Shield } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ModeToggle } from '../components/ModeToggle';
import { Avatar, Badge, Button, Card, Field, PageTitle } from '../components/ui';
import { updateUser, useEvents, useSeasons } from '../lib/api';
import { auth, isDemo } from '../lib/backend';
import { loadDemoData } from '../lib/demoSeed';
import { plural } from '../lib/format';
import { useSession } from '../lib/session';
import { seasonStats } from '../lib/stats';

export function ProfilePage() {
  const { user, isAdmin } = useSession();
  const { activeSeason } = useSeasons();
  const { events } = useEvents();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);

  const stats = useMemo(() => seasonStats(events, activeSeason?.id ?? null), [events, activeSeason]);
  if (!user) return null;
  const place = stats.rating.findIndex((r) => r.uid === user.uid);
  const me = stats.rating[place];

  const saveName = async () => {
    setSaving(true);
    try {
      await updateUser(user.uid, { name: name.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageTitle>Профіль</PageTitle>
      <div className="space-y-4">
        <Card className="flex items-center gap-4">
          <Avatar name={user.name} photoURL={user.photoURL} size={64} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold">{user.name}</p>
            <p className="truncate text-sm text-muted">{user.email}</p>
            {isAdmin && (
              <Badge className="mt-2 bg-accent/15 text-accent-ink">
                <Shield size={12} /> Адміністратор
              </Badge>
            )}
          </div>
        </Card>

        {activeSeason && (
          <Card>
            <p className="mb-3 text-sm text-muted">{activeSeason.name}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="font-display text-2xl font-extrabold text-accent-ink tabular-nums">{place >= 0 ? place + 1 : '—'}</p>
                <p className="text-xs text-muted">місце</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold tabular-nums">{me?.points ?? 0}</p>
                <p className="text-xs text-muted">{plural(me?.points ?? 0, 'очко', 'очки', 'очок')}</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold tabular-nums">{me?.games ?? 0}</p>
                <p className="text-xs text-muted">{plural(me?.games ?? 0, 'гра', 'гри', 'ігор')}</p>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <Field label="Ім’я в списках" value={name} onChange={(e) => setName(e.target.value)} hint="Нове ім’я з’явиться в наступних записах" />
          <Button variant="secondary" className="mt-3 w-full" loading={saving} disabled={!name.trim() || name.trim() === user.name} onClick={saveName}>
            Зберегти ім’я
          </Button>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-muted">Оформлення</p>
          <ModeToggle />
        </Card>

        {isDemo && (
          <Card>
            <p className="mb-3 text-sm text-muted">Демо: перемкни роль, щоб побачити застосунок очима звичайного гравця чи адміна.</p>
            <Button variant="secondary" className="w-full" onClick={() => updateUser(user.uid, { role: isAdmin ? 'user' : 'admin' })}>
              Зробити мене {isAdmin ? 'гравцем' : 'адміном'}
            </Button>
            <Button variant="secondary" className="mt-2 w-full" onClick={() => loadDemoData(user)}>
              Скинути до прикладових даних
            </Button>
            <p className="mt-2 text-xs text-muted">Замінить усі поточні демо-дані: 2 сезони, 18 тренувань, 16 гравців.</p>
          </Card>
        )}

        <Button variant="danger" className="w-full" onClick={() => auth.signOut()}>
          <LogOut size={18} /> Вийти
        </Button>
      </div>
    </>
  );
}
