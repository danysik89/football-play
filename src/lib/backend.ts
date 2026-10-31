/**
 * Thin backend abstraction: Firebase when configured, otherwise a localStorage
 * "demo" backend so the app can be tried without any setup.
 */
import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  initializeFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
}

type Data = Record<string, unknown>;
type Unsub = () => void;

export interface Store {
  watchCollection<T>(path: string, cb: (docs: T[]) => void): Unsub;
  watchDoc<T>(path: string, cb: (doc: T | null) => void): Unsub;
  set(path: string, data: Data): Promise<void>;
  update(path: string, data: Data): Promise<void>;
  remove(path: string): Promise<void>;
}

export interface Auth {
  onChange(cb: (user: AuthUser | null) => void): Unsub;
  signInWithGoogle(): Promise<void>;
  signInWithEmail(email: string, password: string): Promise<void>;
  registerWithEmail(name: string, email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const env = import.meta.env;
export const isDemo = !env.VITE_FIREBASE_API_KEY;

export const newId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 20);

// ---------------------------------------------------------------- Firebase

function createFirebase(): { store: Store; auth: Auth } {
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });
  const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  const fbAuth = getAuth(app);

  const store: Store = {
    watchCollection: (path, cb) =>
      onSnapshot(
        collection(db, path),
        (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as never)),
        (err) => console.error(path, err),
      ),
    watchDoc: (path, cb) =>
      onSnapshot(
        doc(db, path),
        (snap) => cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as never) : null),
        (err) => console.error(path, err),
      ),
    set: (path, data) => setDoc(doc(db, path), data),
    update: (path, data) => updateDoc(doc(db, path), data),
    remove: (path) => deleteDoc(doc(db, path)),
  };

  const auth: Auth = {
    onChange: (cb) =>
      onAuthStateChanged(fbAuth, (u) =>
        cb(
          u && {
            uid: u.uid,
            name: u.displayName || u.email?.split('@')[0] || 'Гравець',
            email: u.email ?? '',
            photoURL: u.photoURL,
          },
        ),
      ),
    signInWithGoogle: async () => {
      await signInWithPopup(fbAuth, new GoogleAuthProvider());
    },
    signInWithEmail: async (email, password) => {
      await signInWithEmailAndPassword(fbAuth, email, password);
    },
    registerWithEmail: async (name, email, password) => {
      const cred = await createUserWithEmailAndPassword(fbAuth, email, password);
      await updateProfile(cred.user, { displayName: name });
    },
    signOut: () => fbSignOut(fbAuth),
  };

  return { store, auth };
}

// ---------------------------------------------------------------- Demo (localStorage)

const DB_KEY = 'fc-demo-db';
const ACCOUNTS_KEY = 'fc-demo-accounts';
const SESSION_KEY = 'fc-demo-session';

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || '') as T;
  } catch {
    return fallback;
  }
}

function createDemo(): { store: Store; auth: Auth } {
  let docs = readJson<Record<string, Data>>(DB_KEY, {});
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  const persist = () => {
    localStorage.setItem(DB_KEY, JSON.stringify(docs));
    emit();
  };
  window.addEventListener('storage', (e) => {
    if (e.key === DB_KEY) {
      docs = readJson(DB_KEY, {});
      emit();
    }
  });

  const parentOf = (path: string) => path.slice(0, path.lastIndexOf('/'));
  const idOf = (path: string) => path.slice(path.lastIndexOf('/') + 1);
  const subscribe = (fn: () => void) => {
    listeners.add(fn);
    queueMicrotask(fn);
    return () => void listeners.delete(fn);
  };

  const store: Store = {
    watchCollection: (path, cb) =>
      subscribe(() =>
        cb(
          Object.entries(docs)
            .filter(([p]) => parentOf(p) === path)
            .map(([p, d]) => ({ id: idOf(p), ...d }) as never),
        ),
      ),
    watchDoc: (path, cb) =>
      subscribe(() => cb(docs[path] ? ({ id: idOf(path), ...docs[path] } as never) : null)),
    set: async (path, data) => {
      docs = { ...docs, [path]: data };
      persist();
    },
    update: async (path, data) => {
      if (!docs[path]) throw new Error('Документ не знайдено');
      docs = { ...docs, [path]: { ...docs[path], ...data } };
      persist();
    },
    remove: async (path) => {
      const next = { ...docs };
      // Also drop sub-collections, like Firestore's recursive delete would.
      for (const p of Object.keys(next)) if (p === path || p.startsWith(path + '/')) delete next[p];
      docs = next;
      persist();
    },
  };

  type Account = AuthUser & { password: string };
  const authListeners = new Set<(u: AuthUser | null) => void>();
  const current = (): AuthUser | null => {
    const uid = localStorage.getItem(SESSION_KEY);
    const acc = readJson<Account[]>(ACCOUNTS_KEY, []).find((a) => a.uid === uid);
    if (!acc) return null;
    const { password: _, ...user } = acc;
    return user;
  };
  const login = (uid: string | null) => {
    if (uid) localStorage.setItem(SESSION_KEY, uid);
    else localStorage.removeItem(SESSION_KEY);
    const u = current();
    authListeners.forEach((l) => l(u));
  };
  const accounts = () => readJson<Account[]>(ACCOUNTS_KEY, []);
  const saveAccount = (a: Account) => localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts(), a]));

  const auth: Auth = {
    onChange: (cb) => {
      authListeners.add(cb);
      queueMicrotask(() => cb(current()));
      return () => void authListeners.delete(cb);
    },
    signInWithGoogle: async () => {
      const email = 'google.demo@gmail.com';
      let acc = accounts().find((a) => a.email === email);
      if (!acc) {
        acc = { uid: newId(), name: 'Google Гравець', email, photoURL: null, password: '' };
        saveAccount(acc);
      }
      login(acc.uid);
    },
    signInWithEmail: async (email, password) => {
      const acc = accounts().find((a) => a.email === email.trim().toLowerCase());
      if (!acc || acc.password !== password) throw new Error('auth/invalid-credential');
      login(acc.uid);
    },
    registerWithEmail: async (name, email, password) => {
      email = email.trim().toLowerCase();
      if (accounts().some((a) => a.email === email)) throw new Error('auth/email-already-in-use');
      if (password.length < 6) throw new Error('auth/weak-password');
      const acc = { uid: newId(), name, email, photoURL: null, password };
      saveAccount(acc);
      login(acc.uid);
    },
    signOut: async () => login(null),
  };

  return { store, auth };
}

export const { store, auth } = isDemo ? createDemo() : createFirebase();

export function authErrorMessage(err: unknown): string {
  const msg = String((err as { code?: string })?.code || (err as Error)?.message || err);
  if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found'))
    return 'Невірна пошта або пароль';
  if (msg.includes('email-already-in-use')) return 'Ця пошта вже зареєстрована';
  if (msg.includes('weak-password')) return 'Пароль має містити щонайменше 6 символів';
  if (msg.includes('invalid-email')) return 'Некоректна адреса пошти';
  if (msg.includes('popup-closed')) return 'Вікно входу закрито';
  if (msg.includes('too-many-requests')) return 'Забагато спроб. Спробуйте пізніше';
  if (msg.includes('network')) return 'Немає з’єднання з мережею';
  return 'Щось пішло не так. Спробуйте ще раз';
}
