/** Color presets for trying out the look of the app. Applied as CSS variables on <html>. */
export interface Theme {
  id: string;
  name: string;
  scheme: 'dark' | 'light';
  colors: {
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
  };
}

export const THEMES: Theme[] = [
  {
    id: 'pitch',
    name: 'Нічне поле',
    scheme: 'dark',
    colors: {
      bg: '#0b1410', surface: '#12201a', 'surface-2': '#1a2d24', line: '#24392f', fg: '#eaf2ec', muted: '#9bb0a3',
      accent: '#c6f432', 'on-accent': '#0b1410', danger: '#ff6b5e',
      'team-a': '#c6f432', 'team-b': '#5ec8ff', 'team-c': '#ffb547', 'team-d': '#ff7ac3',
    },
  },
  {
    id: 'ocean',
    name: 'Глибокий океан',
    scheme: 'dark',
    colors: {
      bg: '#06101f', surface: '#0c1a30', 'surface-2': '#132540', line: '#1d3354', fg: '#e8f1ff', muted: '#93a9c9',
      accent: '#38bdf8', 'on-accent': '#06101f', danger: '#ff6b7a',
      'team-a': '#38bdf8', 'team-b': '#a3e635', 'team-c': '#fbbf24', 'team-d': '#f472b6',
    },
  },
  {
    id: 'midnight',
    name: 'Північ',
    scheme: 'dark',
    colors: {
      bg: '#0b1020', surface: '#121a33', 'surface-2': '#1a2445', line: '#26325a', fg: '#eef1fb', muted: '#9aa6c8',
      accent: '#6e9bff', 'on-accent': '#0b1020', danger: '#ff7a85',
      'team-a': '#6e9bff', 'team-b': '#5eead4', 'team-c': '#fcd34d', 'team-d': '#f9a8d4',
    },
  },
  {
    id: 'ukraine',
    name: 'Синьо-жовта',
    scheme: 'dark',
    colors: {
      bg: '#0a1230', surface: '#111c42', 'surface-2': '#1a2856', line: '#26366a', fg: '#eef2ff', muted: '#a3b0d6',
      accent: '#ffd500', 'on-accent': '#0a1230', danger: '#ff6b6b',
      'team-a': '#ffd500', 'team-b': '#4ea8ff', 'team-c': '#7ee08a', 'team-d': '#ff8ad1',
    },
  },
  {
    id: 'derby',
    name: 'Дербі',
    scheme: 'dark',
    colors: {
      bg: '#120a0b', surface: '#1d1113', 'surface-2': '#2a181b', line: '#3a2226', fg: '#fbeeee', muted: '#c4a4a7',
      accent: '#ff4d3d', 'on-accent': '#ffffff', danger: '#ff9f43',
      'team-a': '#ff4d3d', 'team-b': '#f5f5f5', 'team-c': '#ffc23d', 'team-d': '#5ec8ff',
    },
  },
  {
    id: 'gold',
    name: 'Чорне золото',
    scheme: 'dark',
    colors: {
      bg: '#0c0c0d', surface: '#161618', 'surface-2': '#202023', line: '#2e2e32', fg: '#f4f1ea', muted: '#a9a497',
      accent: '#f2c14e', 'on-accent': '#0c0c0d', danger: '#ff6b5e',
      'team-a': '#f2c14e', 'team-b': '#8fb8ff', 'team-c': '#e6e6e6', 'team-d': '#e98fff',
    },
  },
  {
    id: 'violet',
    name: 'Неон',
    scheme: 'dark',
    colors: {
      bg: '#0d0b1a', surface: '#161329', 'surface-2': '#211c3a', line: '#2f2850', fg: '#f1eeff', muted: '#a9a2cc',
      accent: '#8b7bff', 'on-accent': '#ffffff', danger: '#ff6b8b',
      'team-a': '#8b7bff', 'team-b': '#3ee6c4', 'team-c': '#ffb547', 'team-d': '#ff6bd5',
    },
  },
  {
    id: 'grass',
    name: 'Світла трава',
    scheme: 'light',
    colors: {
      bg: '#f3f6f1', surface: '#ffffff', 'surface-2': '#eaf0e6', line: '#d8e2d3', fg: '#10201a', muted: '#5c6e63',
      accent: '#15803d', 'on-accent': '#ffffff', danger: '#dc2626',
      'team-a': '#15803d', 'team-b': '#2563eb', 'team-c': '#d97706', 'team-d': '#c026d3',
    },
  },
  {
    id: 'paper',
    name: 'Світла класика',
    scheme: 'light',
    colors: {
      bg: '#f5f5f4', surface: '#ffffff', 'surface-2': '#efefed', line: '#e2e2df', fg: '#18181b', muted: '#63636b',
      accent: '#1d4ed8', 'on-accent': '#ffffff', danger: '#dc2626',
      'team-a': '#1d4ed8', 'team-b': '#dc2626', 'team-c': '#ca8a04', 'team-d': '#059669',
    },
  },
];

const KEY = 'fc-theme';

export function applyTheme(id: string) {
  const theme = THEMES.find((t) => t.id === id) ?? THEMES[0]!;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(theme.colors)) root.style.setProperty(`--color-${k}`, v);
  root.style.colorScheme = theme.scheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors.bg);
  try {
    localStorage.setItem(KEY, theme.id);
  } catch {
    /* private mode */
  }
  return theme.id;
}

export function savedThemeId() {
  try {
    return localStorage.getItem(KEY) ?? THEMES[0]!.id;
  } catch {
    return THEMES[0]!.id;
  }
}
