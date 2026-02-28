import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/auth-context';
import { LangProvider } from './context/lang-context';
import { LoadingProvider } from './context/loading-context';
import { ToastProvider } from './components/toast';
import I18nSync from './I18nSync';
import Main from './main';

const App = () => {
  return (
    <AuthProvider>
      <LangProvider>
        <ToastProvider>
          <LoadingProvider>
            <I18nSync />
            <BrowserRouter>
              <Main />
            </BrowserRouter>
          </LoadingProvider>
        </ToastProvider>
      </LangProvider>
    </AuthProvider>
  );
};

export default App;
