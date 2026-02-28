import { createContext, useCallback, useContext, useRef, useState } from 'react';
import './index.scss';

type ToastVariant = 'success' | 'error' | 'neutral';

interface ToastItem {
  id: number;
  message: string;
  description?: string;
  variant: ToastVariant;
  exiting?: boolean;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  neutral: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 3500;
const EXIT_DURATION = 300;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_DURATION);
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant, description?: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, description, variant }]);
      setTimeout(() => removeToast(id), TOAST_DURATION);
    },
    [removeToast]
  );

  const value: ToastContextValue = {
    success: useCallback((msg: string) => addToast(msg, 'success'), [addToast]),
    error: useCallback((msg: string) => addToast(msg, 'error'), [addToast]),
    neutral: useCallback((msg: string, desc?: string) => addToast(msg, 'neutral', desc), [addToast]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast toast--${t.variant}${t.exiting ? ' toast--exit' : ''}`}
              onClick={() => removeToast(t.id)}
            >
              <span className="toast-icon">
                {t.variant === 'success' && '✓'}
                {t.variant === 'error' && '✕'}
                {t.variant === 'neutral' && 'ℹ'}
              </span>
              <div className="toast-text">
                <p className="toast-message">{t.message}</p>
                {t.description && <p className="toast-description">{t.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
