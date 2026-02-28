import { createContext, useCallback, useContext, useState } from 'react';
import Spinner from '../components/spinner';
import './loading-context.scss';

interface LoadingContextValue {
  showLoading: () => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);

  const showLoading = useCallback(() => setCount((c) => c + 1), []);
  const hideLoading = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      {count > 0 && (
        <div className="loading-overlay">
          <Spinner />
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextValue {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within <LoadingProvider>');
  return ctx;
}
