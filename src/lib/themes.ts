/**
 * Color palettes, each with a dark and a light variant, plus the light/dark mode.
 * Applied as CSS variables on <html>.
 */
import { useSyncExternalStore } from 'react';

export interface Colors {
  bg: string;
  surface: string;
  'surface-2': string;
  line: string;
  fg: string;
  muted: string;
  accent: string;
  'on-accent': string;
  danger: string;
  'team-a': string;
  'team-b': string;
  'team-c': string;
  'team-d': string;
}

export interface Theme {
  id: string;
  name: string;
  dark: Colors;
  light: Colors;
}

export type Mode = 'dark' | 'light' | 'system';

// Light variants use darker accents so accent-colored text stays readable on white.
export const THEMES: Theme[] = [
  {
    id: 'pitch',
    name: 'Нічне поле',
    dark: {
      bg: '#0b1410', surface: '#12201a', 'surface-2': '#1a2d24', line: '#24392f', fg: '#eaf2ec', muted: '#9bb0a3',
      accent: '#c6f432', 'on-accent': '#0b1410', danger: '#ff6b5e',
      'team-a': '#c6f432', 'team-b': '#5ec8ff', 'team-c': '#ffb547', 'team-d': '#ff7ac3',
    },
    light: {
      bg: '#f3f6f1', surface: '#ffffff', 'surface-2': '#eaf0e6', line: '#d8e2d3', fg: '#10201a', muted: '#5c6e63',
      accent: '#4d7c0f', 'on-accent': '#ffffff', danger: '#dc2626',
      'team-a': '#4d7c0f', 'team-b': '#0369a1', 'team-c': '#b45309', 'team-d': '#be185d',
    },
  },
  {
    id: 'stadium',
    name: 'Нічний стадіон',
    dark: {
      bg: '#0a1226', surface: '#111c36', 'surface-2': '#192747', line: '#24345a', fg: '#eef2fb', muted: '#9eabc8',
      accent: '#c6f432', 'on-accent': '#0a1226', danger: '#ff6b6b',
      'team-a': '#c6f432', 'team-b': '#5ec8ff', 'team-c': '#ffb547', 'team-d': '#ff7ac3',
    },
    light: {
      bg: '#f2f5fb', surface: '#ffffff', 'surface-2': '#e8edf7', line: '#d5ddec', fg: '#0f1a33', muted: '#5a6785',
      accent: '#4d7c0f', 'on-accent': '#ffffff', danger: '#dc2626',
      'team-a': '#4d7c0f', 'team-b': '#1d4ed8', 'team-c': '#b45309', 'team-d': '#be185d',
    },
  },
  {
    id: 'ocean',
    name: 'Глибокий океан',
    dark: {
      bg: '#06101f', surface: '#0c1a30', 'surface-2': '#132540', line: '#1d3354', fg: '#e8f1ff', muted: '#93a9c9',
      accent: '#38bdf8', 'on-accent': '#06101f', danger: '#ff6b7a',
      'team-a': '#38bdf8', 'team-b': '#a3e635', 'team-c': '#fbbf24', 'team-d': '#f472b6',
    },
    light: {
      bg: '#f1f6fb', surface: '#ffffff', 'surface-2': '#e6eef7', line: '#d3dfec', fg: '#0b1b30', muted: '#56677f',
      accent: '#0369a1', 'on-accent': '#ffffff', danger: '#dc2626',
      'team-a': '#0369a1', 'team-b': '#4d7c0f', 'team-c': '#b45309', 'team-d': '#be185d',
    },
  },
  {
    id: 'midnight',
    name: 'Північ',
    dark: {
      bg: '#0b1020', surface: '#121a33', 'surface-2': '#1a2445', line: '#26325a', fg: '#eef1fb', muted: '#9aa6c8',
      accent: '#6e9bff', 'on-accent': '#0b1020', danger: '#ff7a85',
      'team-a': '#6e9bff', 'team-b': '#5eead4', 'team-c': '#fcd34d', 'team-d': '#f9a8d4',
    },
    light: {
      bg: '#f3f4fa', surface: '#ffffff', 'surface-2': '#e9ecf7', line: '#d7dcee', fg: '#121833', muted: '#5b6384',
      accent: '#2f5bd3', 'on-accent': '#ffffff', danger: '#dc2626',
      'team-a': '#2f5bd3', 'team-b': '#0f766e', 'team-c': '#b45309', 'team-d': '#be185d',
    },
  },
  {
    id: 'ukraine',
    name: 'Синьо-жовта',
    dark: {
      bg: '#0a1230', surface: '#111c42', 'surface-2': '#1a2856', line: '#26366a', fg: '#eef2ff', muted: '#a3b0d6',
      accent: '#ffd500', 'on-accent': '#0a1230', danger: '#ff6b6b',
      'team-a': '#ffd500', 'team-b': '#4ea8ff', 'team-c': '#7ee08a', 'team-d': '#ff8ad1',
    },
    light: {
      bg: '#f4f6fc', surface: '#ffffff', 'surface-2': '#e9edf8', line: '#d6dcef', fg: '#0a1230', muted: '#56618a',
      accent: '#0057b7', 'on-accent': '#ffffff', danger: '#dc2626',
      'team-a': '#0057b7', 'team-b': '#a16207', 'team-c': '#15803d', 'team-d': '#be185d',
    },
  },
  {
    id: 'derby',
    name: 'Дербі',
    dark: {
      bg: '#120a0b', surface: '#1d1113', 'surface-2': '#2a181b', line: '#3a2226', fg: '#fbeeee', muted: '#c4a4a7',
      accent: '#ff4d3d', 'on-accent': '#ffffff', danger: '#ff9f43',
      'team-a': '#ff4d3d', 'team-b': '#f5f5f5', 'team-c': '#ffc23d', 'team-d': '#5ec8ff',
    },
    light: {
      bg: '#fbf4f4', surface: '#ffffff', 'surface-2': '#f6e9ea', line: '#ecd6d8', fg: '#2a0f12', muted: '#7a5a5e',
      accent: '#c8102e', 'on-accent': '#ffffff', danger: '#c2410c',
      'team-a': '#c8102e', 'team-b': '#334155', 'team-c': '#b45309', 'team-d': '#0369a1',
    },
  },
  {
    id: 'gold',
    name: 'Чорне золото',
    dark: {
      bg: '#0c0c0d', surface: '#161618', 'surface-2': '#202023', line: '#2e2e32', fg: '#f4f1ea', muted: '#a9a497',
      accent: '#f2c14e', 'on-accent': '#0c0c0d', danger: '#ff6b5e',
      'team-a': '#f2c14e', 'team-b': '#8fb8ff', 'team-c': '#e6e6e6', 'team-d': '#e98fff',
    },
    light: {
      bg: '#f7f5ef', surface: '#ffffff', 'surface-2': '#efebe0', line: '#e2dccb', fg: '#1a1712', muted: '#6b6455',
      accent: '#a16207', 'on-accent': '#ffffff', danger: '#dc2626',
      'team-a': '#a16207', 'team-b': '#1d4ed8', 'team-c': '#57534e', 'team-d': '#a21caf',
    },
  },
  {
    id: 'violet',
    name: 'Неон',
    dark: {
      bg: '#0d0b1a', surface: '#161329', 'surface-2': '#211c3a', line: '#2f2850', fg: '#f1eeff', muted: '#a9a2cc',
      accent: '#8b7bff', 'on-accent': '#ffffff', danger: '#ff6b8b',
      'team-a': '#8b7bff', 'team-b': '#3ee6c4', 'team-c': '#ffb547', 'team-d': '#ff6bd5',
    },
    light: {
      bg: '#f5f4fd', surface: '#ffffff', 'surface-2': '#ece9fb', line: '#dcd7f5', fg: '#1a1533', muted: '#625b85',
      accent: '#5b4bdb', 'on-accent': '#ffffff', danger: '#dc2626',
      'team-a': '#5b4bdb', 'team-b': '#0f766e', 'team-c': '#b45309', 'team-d': '#be185d',
    },
  },
  {
    id: 'classic',
    name: 'Класика',
    dark: {
      bg: '#111214', surface: '#1a1b1f', 'surface-2': '#232429', line: '#2f3036', fg: '#f4f4f5', muted: '#a1a1aa',
      accent: '#3b82f6', 'on-accent': '#ffffff', danger: '#ef4444',
      'team-a': '#3b82f6', 'team-b': '#ef4444', 'team-c': '#eab308', 'team-d': '#10b981',
    },
    light: {
      bg: '#f5f5f4', surface: '#ffffff', 'surface-2': '#efefed', line: '#e2e2df', fg: '#18181b', muted: '#63636b',
      accent: '#1d4ed8', 'on-accent': '#ffffff', danger: '#dc2626',
      'team-a': '#1d4ed8', 'team-b': '#dc2626', 'team-c': '#ca8a04', 'team-d': '#059669',
    },
  },
];

// ---------------------------------------------------------------- state

const THEME_KEY = 'fc-theme';
const MODE_KEY = 'fc-mode';
// Palettes that used to be light-only now live inside other palettes.
const LEGACY: Record<string, [string, Mode]> = { grass: ['pitch', 'light'], paper: ['classic', 'light'] };

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

let themeId = read(THEME_KEY) ?? THEMES[0]!.id;
let mode: Mode = (read(MODE_KEY) as Mode | null) ?? 'dark';
if (LEGACY[themeId]) [themeId, mode] = LEGACY[themeId]!;

const media = window.matchMedia('(prefers-color-scheme: light)');
const listeners = new Set<() => void>();
let snapshot = { themeId, mode, resolved: resolve() };

function resolve(): 'dark' | 'light' {
  return mode === 'system' ? (media.matches ? 'light' : 'dark') : mode;
}

function apply() {
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]!;
  const resolved = resolve();
  const colors = theme[resolved];
  const root = document.documentElement;
  for (const [k, v] of Object.entries(colors)) root.style.setProperty(`--color-${k}`, v);
  root.style.colorScheme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.bg);
  snapshot = { themeId: theme.id, mode, resolved };
  listeners.forEach((l) => l());
}

media.addEventListener('change', () => mode === 'system' && apply());

export function initTheme() {
  apply();
}

export function setThemeId(id: string) {
  themeId = id;
  write(THEME_KEY, id);
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
