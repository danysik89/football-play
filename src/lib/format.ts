const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const weekday = (ts: number) => capitalize(new Date(ts).toLocaleDateString('uk-UA', { weekday: 'long' }));

export const dayMonth = (ts: number) => new Date(ts).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });

export const time = (ts: number) => new Date(ts).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

export const shortDate = (ts: number) =>
  capitalize(new Date(ts).toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'short' }));

/** "Сьогодні", "Завтра", "Через 3 дні", or null. */
export function relativeDay(ts: number, now = Date.now()) {
  const d0 = new Date(now);
  d0.setHours(0, 0, 0, 0);
  const d1 = new Date(ts);
  d1.setHours(0, 0, 0, 0);
  const diff = Math.round((d1.getTime() - d0.getTime()) / 86400_000);
  if (diff === 0) return 'Сьогодні';
  if (diff === 1) return 'Завтра';
  if (diff > 1 && diff < 7) return `Через ${diff} ${plural(diff, 'день', 'дні', 'днів')}`;
  return null;
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('') || '?';

/** Value for <input type="datetime-local"> */
export function toLocalInput(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
