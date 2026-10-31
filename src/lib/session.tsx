import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { auth, isDemo, store, type AuthUser } from './backend';
import type { AppUser } from './types';

interface Session {
  /** null while loading or signed out (see `ready`). */
  user: AppUser | null;
  ready: boolean;
  isAdmin: boolean;
  register(name: string, email: string, password: string): Promise<void>;
}

const Ctx = createContext<Session>(null!);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null | undefined>(undefined);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  // Name typed on the registration form; the auth user may not carry it yet.
  const pendingName = useRef<string | null>(null);

  useEffect(() => auth.onChange(setAuthUser), []);

  useEffect(() => {
    setProfileReady(false);
    setUser(null);
    if (!authUser) return;
    let creating = false;
    return store.watchDoc<Omit<AppUser, 'uid'>>(`users/${authUser.uid}`, (doc) => {
      if (doc) {
        setUser({ ...doc, uid: authUser.uid });
        setProfileReady(true);
        return;
      }
      if (creating) return;
      creating = true;
      store
        .set(`users/${authUser.uid}`, {
          name: pendingName.current || authUser.name,
          email: authUser.email,
          photoURL: authUser.photoURL,
          // In demo mode everyone can try the admin panel.
          role: isDemo ? 'admin' : 'user',
          createdAt: Date.now(),
        })
        .catch((e) => {
          console.error('Не вдалося створити профіль', e);
          setProfileReady(true);
        });
      pendingName.current = null;
    });
  }, [authUser]);

  const value: Session = {
    user,
    ready: authUser === null || (authUser !== undefined && profileReady),
    isAdmin: user?.role === 'admin',
    register: async (name, email, password) => {
      pendingName.current = name.trim();
      await auth.registerWithEmail(name.trim(), email, password);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
