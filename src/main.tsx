import { lazy, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SessionProvider, useSession } from './lib/session';
import { EventPage, HomePage, PageSpinner } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import './index.css';

// Charts and admin tools are heavy and not needed on first paint.
const RatingPage = lazy(() => import('./pages/RatingPage').then((m) => ({ default: m.RatingPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const AdminEventPage = lazy(() => import('./pages/AdminEventPage').then((m) => ({ default: m.AdminEventPage })));

function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useSession();
  return isAdmin ? children : <Navigate to="/" replace />;
}

function App() {
  const { user, ready } = useSession();
  if (!ready) return <PageSpinner />;
  if (!user) return <LoginPage />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="event/:id" element={<EventPage />} />
        <Route path="rating" element={<RatingPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin" element={<AdminOnly><AdminPage /></AdminOnly>} />
        <Route path="admin/event/:id" element={<AdminOnly><AdminEventPage /></AdminOnly>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <App />
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
