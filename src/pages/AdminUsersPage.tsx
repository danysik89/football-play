import { ArrowLeft, Search, Shield, ShieldPlus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Card, Field, IconButton, Modal } from '../components/ui';
import { updateUser, useUsers } from '../lib/api';
import { plural } from '../lib/format';
import { useSession } from '../lib/session';
import type { AppUser } from '../lib/types';

export function AdminUsersPage() {
  const navigate = useNavigate();
  const { user: me } = useSession();
  const users = useUsers();
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState<AppUser | null>(null);
  const [busy, setBusy] = useState(false);

  const q = query.trim().toLowerCase();
  const list = users
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .sort((a, b) => Number(b.role === 'admin') - Number(a.role === 'admin') || a.name.localeCompare(b.name));
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const makingAdmin = target?.role !== 'admin';

  const confirm = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await updateUser(target.uid, { role: makingAdmin ? 'admin' : 'user' });
      setTarget(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <IconButton label="Назад" onClick={() => navigate('/admin')} className="-ml-3">
          <ArrowLeft size={22} />
        </IconButton>
        <div>
          <h1 className="font-display text-xl font-extrabold">Гравці та ролі</h1>
          <p className="text-sm text-muted">
            {users.length} {plural(users.length, 'гравець', 'гравці', 'гравців')} · {adminCount}{' '}
            {plural(adminCount, 'адмін', 'адміни', 'адмінів')}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute top-[2.85rem] left-4 text-muted" aria-hidden />
        <Field
          label="Пошук"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ім’я або пошта"
          autoComplete="off"
          className="[&_input]:pl-11"
        />
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <ShieldPlus size={16} className="text-accent-ink" aria-hidden /> — призначити гравця адміном
        </p>
      </div>

      <Card className="px-3 py-2">
        {list.length === 0 ? (
          <p className="py-6 text-center text-muted">Нікого не знайдено</p>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((u) => {
              const isMe = u.uid === me?.uid;
              const isAdmin = u.role === 'admin';
              return (
                <li key={u.uid} className="flex items-center gap-3 px-1 py-3">
                  <Avatar name={u.name} photoURL={u.photoURL} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">
                      {u.name}
                      {isMe && <span className="text-accent-ink"> · ти</span>}
                    </p>
                    <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
                      {isAdmin && (
                        <Badge className="shrink-0 bg-accent/15 px-2 text-accent-ink">
                          <Shield size={11} /> Адмін
                        </Badge>
                      )}
                      <span className="truncate">{u.email}</span>
                    </p>
                  </div>
                  {/* You can't remove your own admin role — avoids locking yourself out. */}
                  {!isMe && (
                    isAdmin ? (
                      <Button size="sm" variant="ghost" className="shrink-0 text-muted" aria-label={`Забрати права адміна в ${u.name}`} onClick={() => setTarget(u)}>
                        Забрати
                      </Button>
                    ) : (
                      <IconButton label={`Зробити ${u.name} адміном`} className="border border-line bg-surface-2 text-accent-ink" onClick={() => setTarget(u)}>
                        <ShieldPlus size={20} />
                      </IconButton>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal open={!!target} onClose={() => setTarget(null)} title={makingAdmin ? 'Зробити адміном?' : 'Забрати права адміна?'}>
        {target && (
          <>
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-bg/50 p-3">
              <Avatar name={target.name} photoURL={target.photoURL} size={40} />
              <div className="min-w-0">
                <p className="truncate font-bold">{target.name}</p>
                <p className="truncate text-sm text-muted">{target.email}</p>
              </div>
            </div>
            <p className="mb-6 text-muted">
              {makingAdmin
                ? 'Адмін може створювати тренування, починати сезони, ставити очки та керувати ролями інших гравців.'
                : 'Гравець залишиться в застосунку, але більше не матиме доступу до керування.'}
            </p>
            <Button variant={makingAdmin ? 'primary' : 'danger'} className="w-full" loading={busy} onClick={confirm}>
              {makingAdmin ? 'Так, зробити адміном' : 'Так, забрати права'}
            </Button>
          </>
        )}
      </Modal>
    </div>
  );
}
