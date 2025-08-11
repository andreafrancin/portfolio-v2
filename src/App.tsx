import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/main.scss';
import './app.css';
import Header from './components/header';
import Work from './pages/work';
import About from './pages/about';
import Contact from './pages/contact';
import ProjectDetail from './pages/work/project';
import Footer from './components/footer';

const App = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/" element={<Navigate to="/work" replace />} />
          <Route path="/work" element={<Work />} />
          <Route path="/work/:id" element={<ProjectDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<div />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
