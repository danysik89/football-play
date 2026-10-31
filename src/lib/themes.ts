/**
 * App colors: "Нічний стадіон" (dark navy + lime) with a light counterpart,
 * and the light/dark mode. Applied as CSS variables on <html>.
 */
import { useSyncExternalStore } from 'react';

export interface Colors {
  bg: string;
  surface: string;
  'surface-2': string;
  line: string;
  fg: string;
  muted: string;
  /** Fill of primary buttons and highlights. */
  accent: string;
  'on-accent': string;
  /** Accent for text and icons on regular surfaces. */
  'accent-ink': string;
  danger: string;
  'team-a': string;
  'team-b': string;
  'team-c': string;
  'team-d': string;
}

export type Mode = 'dark' | 'light' | 'system';

const DARK: Colors = {
  bg: '#0a1226', surface: '#111c36', 'surface-2': '#192747', line: '#24345a', fg: '#eef2fb', muted: '#9eabc8',
  accent: '#c6f432', 'on-accent': '#0a1226', 'accent-ink': '#c6f432', danger: '#ff6b6b',
  'team-a': '#c6f432', 'team-b': '#5ec8ff', 'team-c': '#ffb547', 'team-d': '#ff7ac3',
};

// Light: the same navy and lime, swapped — navy buttons with lime text.
const LIGHT: Colors = {
  bg: '#f2f5fb', surface: '#ffffff', 'surface-2': '#e8edf7', line: '#d5ddec', fg: '#0f1a33', muted: '#5a6785',
  accent: '#16213f', 'on-accent': '#c6f432', 'accent-ink': '#1e3a8a', danger: '#dc2626',
  'team-a': '#65a30d', 'team-b': '#1d4ed8', 'team-c': '#b45309', 'team-d': '#be185d',
};

// ---------------------------------------------------------------- state

const MODE_KEY = 'fc-mode';

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

let mode: Mode = (read(MODE_KEY) as Mode | null) ?? 'dark';

const media = window.matchMedia('(prefers-color-scheme: light)');
const listeners = new Set<() => void>();
let snapshot = { mode, resolved: resolve() };

function resolve(): 'dark' | 'light' {
  return mode === 'system' ? (media.matches ? 'light' : 'dark') : mode;
}

function apply() {
  const resolved = resolve();
  const colors = resolved === 'dark' ? DARK : LIGHT;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(colors)) root.style.setProperty(`--color-${k}`, v);
  root.style.colorScheme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.bg);
  snapshot = { mode, resolved };
  listeners.forEach((l) => l());
}

media.addEventListener('change', () => mode === 'system' && apply());

export function initTheme() {
  apply();
}

export function setMode(m: Mode) {
  mode = m;
  write(MODE_KEY, m);
  apply();
}

export function useTheme() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => void listeners.delete(cb);
    },
    () => snapshot,
  );
}
