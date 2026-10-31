import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { initials } from '../lib/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:brightness-110 active:brightness-95 shadow-[0_8px_30px_-8px_rgb(198_244_50/0.5)]',
  secondary: 'bg-surface-2 text-fg hover:bg-line border border-line',
  ghost: 'text-fg hover:bg-surface-2',
  danger: 'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/30',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; loading?: boolean }) {
  const sizes = { sm: 'h-9 px-3 text-sm rounded-xl', md: 'h-12 px-5 rounded-2xl', lg: 'h-16 px-6 text-lg rounded-2xl' };
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 font-bold transition duration-150 select-none disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

export function IconButton({ label, className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={`inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export const Spinner = ({ className = '' }: { className?: string }) => (
  <span
    role="status"
    aria-label="Завантаження"
    className={`inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
  />
);

export const Card = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <section className={`rounded-3xl border border-line bg-surface p-5 ${className}`}>{children}</section>
);

export function Avatar({ name, photoURL, size = 40, className = '' }: { name: string; photoURL?: string | null; size?: number; className?: string }) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (photoURL)
    return <img src={photoURL} alt="" style={style} referrerPolicy="no-referrer" className={`shrink-0 rounded-full object-cover ${className}`} />;
  // Stable hue from the name so the same person always gets the same color.
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
  return (
    <span
      aria-hidden
      style={{ ...style, background: `hsl(${hue} 45% 28%)`, color: `hsl(${hue} 80% 85%)` }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${className}`}
    >
      {initials(name)}
    </span>
  );
}

export function Field({ label, hint, error, className = '', ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        {...rest}
        aria-invalid={!!error}
        className="h-12 w-full rounded-2xl border border-line bg-bg px-4 text-base text-fg placeholder:text-muted/60 transition outline-none focus:border-accent aria-invalid:border-danger [color-scheme:dark]"
      />
      {error ? <p className="mt-1.5 text-sm text-danger">{error}</p> : hint && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
    </div>
  );
}

/** Bottom sheet on phones, centered dialog on wider screens. */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 mt-auto w-full max-w-none bg-transparent p-0 text-fg backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:m-auto sm:max-w-md"
    >
      {open && (
        <div className="animate-pop-in rounded-t-3xl border border-line bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="font-display text-xl font-bold">{title}</h2>
            <IconButton label="Закрити" onClick={onClose} className="-mt-2 -mr-2">
              <X size={20} />
            </IconButton>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export const Badge = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${className}`}>{children}</span>
);

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-3xl bg-surface-2 text-accent">{icon}</div>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {text && <p className="mt-2 max-w-xs text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export const PageTitle = ({ children, sub }: { children: ReactNode; sub?: ReactNode }) => (
  <header className="mb-5">
    <h1 className="font-display text-2xl font-extrabold tracking-tight">{children}</h1>
    {sub && <p className="mt-1 text-muted">{sub}</p>}
  </header>
);
