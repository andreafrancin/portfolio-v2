import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/main.scss';
import './App.css';
import Header from './components/header';
import Work from './pages/work';
import About from './pages/about';
import Contact from './pages/contact';
import ProjectDetail from './pages/work/project';
import Login from './pages/login';
import ProtectedRoute from './components/protected-route';
import PrivateArea from './pages/private';
import { AuthProvider } from './context/auth-context';
import AddProject from './pages/private/edit-container/projects/add-project';
import EditProject from './pages/private/edit-container/projects/edit-project';
import { LangProvider } from './context/lang-context';
import I18nSync from './I18nSync';
import LinkedinIcon from './components/icons/icon-linkedin';
import useIsMobile from './hooks/useIsMobile';

const App = () => {
  const isMobile = useIsMobile(1000);

  return (
    <AuthProvider>
      <LangProvider>
        <I18nSync />
        <BrowserRouter>
          <div className="app">
            <Header />
            <Routes>
              <Route path="/" element={<Navigate to="/work" replace />} />
              <Route path="/work" element={<Work />} />
              <Route path="/work/:id" element={<ProjectDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
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
              <Route path="*" element={<div />} />
            </Routes>
            {isMobile && (
              <div className="social-container">
                <ul className="social-list-container">
                  <a
                    href="https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://es.linkedin.com/in/andrea-franc%25C3%25ADn-pedrola-730aa910a&ved=2ahUKEwjh8KGDlJSPAxWRRaQEHWEAFhsQFnoECBcQAQ&usg=AOvVaw2yKoOmk0oiPl0i2CGKB6Pz"
                    target="_blank"
                    className="social-icon"
                  >
                    <LinkedinIcon width={20} height={20} color="#141516" />
                  </a>
                </ul>
              </div>
            )}
          </div>
        </BrowserRouter>
      </LangProvider>
    </AuthProvider>
  );
};

export default App;
