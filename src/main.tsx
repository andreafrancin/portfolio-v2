import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './components/header';
import Footer from './components/footer';
import RevealObserver from './components/reveal-observer';
import Work from './pages/work';
import About from './pages/about';
import Contact from './pages/contact';
import Legal from './pages/legal';
import ProjectDetail from './pages/work/project';
import Login from './pages/login';
import NotFound from './pages/not-found';
import ProtectedRoute from './components/protected-route';
import PrivateArea from './pages/private';
import AddProject from './pages/private/edit-container/projects/add-project';
import EditProject from './pages/private/edit-container/projects/edit-project';
import DocumentEditor from './pages/private/billing/editor';
import './styles/main.scss';

const isPrivatePath = (path: string) => path.startsWith('/private') || path === '/login';

function Main() {
  const { t } = useTranslation();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const isPrivate = isPrivatePath(location.pathname);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        {t('HEADER.SKIP')}
      </a>
      <RevealObserver />
      <Header variant={isPrivate ? 'studio' : 'public'} />
      <main id="main" ref={mainRef} tabIndex={-1} className="app-main">
        <div key={location.pathname} className="page-enter">
          <Routes location={location}>
            <Route path="/" element={<Navigate to="/work" replace />} />
            <Route path="/work" element={<Work />} />
            <Route path="/work/:id" element={<ProjectDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/private"
              element={
                <ProtectedRoute>
                  <PrivateArea />
                </ProtectedRoute>
              }
            />
            <Route
              path="/private/add-project"
              element={
                <ProtectedRoute>
                  <AddProject />
                </ProtectedRoute>
              }
            />
            <Route
              path="/private/edit-project/:id"
              element={
                <ProtectedRoute>
                  <EditProject />
                </ProtectedRoute>
              }
            />
            {(
              [
                ['/private/quotes/new', 'quote'],
                ['/private/quotes/:id', 'quote'],
                ['/private/invoices/new', 'invoice'],
                ['/private/invoices/:id', 'invoice'],
              ] as const
            ).map(([path, kind]) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute>
                    <DocumentEditor key={path} kind={kind} />
                  </ProtectedRoute>
                }
              />
            ))}
            <Route
              path="/private/billing/issuer"
              element={<Navigate to="/private?tab=issuer" replace />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
      {!isPrivate && <Footer showCta={location.pathname !== '/contact'} />}
    </div>
  );
}

export default Main;
