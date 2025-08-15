import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/main.scss';
import './app.css';
import Header from './components/header';
import Work from './pages/work';
import About from './pages/about';
import Contact from './pages/contact';
import ProjectDetail from './pages/work/project';
import Footer from './components/footer';
import Login from './pages/login';
import ProtectedRoute from './components/protected-route';
import PrivateArea from './pages/private';
import { AuthProvider } from './context/auth-context';
import AddProject from './pages/private/edit-container/projects/add-project';
import EditProject from './pages/private/edit-container/projects/edit-project';
import { LangProvider } from './context/lang-context';

const App = () => {
  return (
    <AuthProvider>
      <LangProvider>
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
            <Footer />
          </div>
        </BrowserRouter>
      </LangProvider>
    </AuthProvider>
  );
};

export default App;
