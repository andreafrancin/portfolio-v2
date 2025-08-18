import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/auth-context';
import { LangProvider } from './context/lang-context';
import I18nSync from './I18nSync';
import Main from './main';

const App = () => {
  return (
    <AuthProvider>
      <LangProvider>
        <I18nSync />
        <BrowserRouter>
          <Main />
        </BrowserRouter>
      </LangProvider>
    </AuthProvider>
  );
};

export default App;
