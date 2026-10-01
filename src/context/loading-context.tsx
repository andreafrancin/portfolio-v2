import { createContext, useCallback, useContext, useMemo, useState } from 'react';
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
  const value = useMemo(() => ({ showLoading, hideLoading }), [showLoading, hideLoading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {count > 0 && (
        <div className="busy" role="progressbar" aria-busy="true" aria-label="Loading">
          <span className="busy__bar" />
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
