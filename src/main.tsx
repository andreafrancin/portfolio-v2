import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './components/header';
import Footer from './components/footer';
import RevealObserver from './components/reveal-observer';
import Work from './pages/work';
import About from './pages/about';
import Contact from './pages/contact';
import Services from './pages/services';
import Legal from './pages/legal';
import ProjectDetail from './pages/work/project';
import Login from './pages/login';
import NotFound from './pages/not-found';
import ProtectedRoute from './components/protected-route';
import AdminLayout from './components/admin-layout';
import { findLegacyTabPath } from './components/admin-layout/navigation';
import SectionPage from './pages/private/section-page';
import EditProjectsContainer from './pages/private/edit-container/projects';
import EditAboutContainer from './pages/private/edit-container/about';
import EditContactContainer from './pages/private/edit-container/contact';
import EditCategoriesContainer from './pages/private/edit-container/categories';
import EditServicesContainer from './pages/private/edit-container/services';
import EditAutoReplyContainer from './pages/private/edit-container/auto-reply';
import AnalyticsPage from './pages/private/analytics';
import BillingList from './pages/private/billing/list';
import ClientsTab from './pages/private/billing/clients';
import ConditionsTab from './pages/private/billing/conditions';
import IssuerSettings from './pages/private/billing/issuer';
import AddProject from './pages/private/edit-container/projects/add-project';
import EditProject from './pages/private/edit-container/projects/edit-project';
import DocumentEditor from './pages/private/billing/editor';
import { syncUrl, useLang } from './context/lang-context';
import useSeo from './seo/useSeo';
import { trackPageview } from './lib/analytics';
import { SITE_NAME } from './seo/meta';
import './styles/main.scss';

const isAdminPath = (path: string) => path === '/private' || path.startsWith('/private/');
const isPrivatePath = (path: string) => isAdminPath(path) || path === '/login';

function ProjectsHome() {
  const location = useLocation();
  const legacyPath = findLegacyTabPath(location.search);

  if (legacyPath) {
    return <Navigate to={legacyPath} replace />;
  }

  return (
    <SectionPage titleKey="PRIVATE.TABS.WORK" introKey="ADMIN.PROJECTS_INTRO">
      <EditProjectsContainer />
    </SectionPage>
  );
}

function Main() {
  const { t } = useTranslation();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const isPrivate = isPrivatePath(location.pathname);
  const isAdmin = isAdminPath(location.pathname);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  const { lang } = useLang();
  useSeo(isPrivate ? { title: SITE_NAME, description: '', noindex: true } : null);
  useEffect(() => {
    if (!isPrivate) syncUrl(lang);
  }, [location.pathname, lang, isPrivate]);

  // One page view per page: changing the language or a filter in the address is not a new one.
  const langRef = useRef(lang);
  langRef.current = lang;
  useEffect(() => {
    trackPageview(location.pathname + window.location.search, langRef.current);
  }, [location.pathname]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        {t('HEADER.SKIP')}
      </a>
      <RevealObserver />
      {!isAdmin && <Header variant={isPrivate ? 'studio' : 'public'} />}
      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className={`app-main${isAdmin ? ' app-main--admin' : ''}`}
      >
        <div key={isAdmin ? 'admin' : location.pathname} className="page-enter">
          <Routes location={location}>
            <Route path="/" element={<Navigate to="/work" replace />} />
            <Route path="/work" element={<Work />} />
            <Route path="/work/:id" element={<ProjectDetail />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/private" element={<ProjectsHome />} />
              <Route path="/private/add-project" element={<AddProject />} />
              <Route path="/private/edit-project/:id" element={<EditProject />} />
              <Route
                path="/private/analytics"
                element={
                  <SectionPage titleKey="PRIVATE.TABS.ANALYTICS">
                    <AnalyticsPage />
                  </SectionPage>
                }
              />
              <Route
                path="/private/categories"
                element={
                  <SectionPage titleKey="PRIVATE.TABS.CATEGORIES">
                    <EditCategoriesContainer />
                  </SectionPage>
                }
              />
              <Route
                path="/private/about"
                element={
                  <SectionPage titleKey="PRIVATE.TABS.ABOUT" introKey="ADMIN.ABOUT_INTRO">
                    <EditAboutContainer />
                  </SectionPage>
                }
              />
              <Route
                path="/private/services"
                element={
                  <SectionPage titleKey="PRIVATE.TABS.SERVICES">
                    <EditServicesContainer />
                  </SectionPage>
                }
              />
              <Route
                path="/private/contact"
                element={
                  <SectionPage titleKey="PRIVATE.TABS.CONTACT" introKey="ADMIN.CONTACT_INTRO">
                    <EditContactContainer />
                  </SectionPage>
                }
              />
              <Route
                path="/private/auto-reply"
                element={
                  <SectionPage titleKey="PRIVATE.TABS.AUTO_REPLY" introKey="ADMIN.AUTO_REPLY_INTRO">
                    <EditAutoReplyContainer />
                  </SectionPage>
                }
              />
              <Route
                path="/private/quotes"
                element={
                  <SectionPage titleKey="BILLING.TABS_QUOTES" introKey="ADMIN.QUOTES_INTRO">
                    <BillingList key="quote" kind="quote" />
                  </SectionPage>
                }
              />
              <Route
                path="/private/invoices"
                element={
                  <SectionPage titleKey="BILLING.TABS_INVOICES" introKey="ADMIN.INVOICES_INTRO">
                    <BillingList key="invoice" kind="invoice" />
                  </SectionPage>
                }
              />
              <Route
                path="/private/clients"
                element={
                  <SectionPage titleKey="BILLING.TABS_CLIENTS" introKey="ADMIN.CLIENTS_INTRO">
                    <ClientsTab />
                  </SectionPage>
                }
              />
              <Route
                path="/private/conditions"
                element={
                  <SectionPage titleKey="BILLING.TABS_CONDITIONS">
                    <ConditionsTab />
                  </SectionPage>
                }
              />
              <Route
                path="/private/issuer"
                element={
                  <SectionPage titleKey="BILLING.TABS_ISSUER" introKey="BILLING.ISSUER_HINT">
                    <IssuerSettings />
                  </SectionPage>
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
                <Route key={path} path={path} element={<DocumentEditor key={path} kind={kind} />} />
              ))}
              <Route
                path="/private/billing/issuer"
                element={<Navigate to="/private/issuer" replace />}
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
      {!isPrivate && <Footer showCta={!['/contact', '/services'].includes(location.pathname)} />}
    </div>
  );
}

export default Main;
