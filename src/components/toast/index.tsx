import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconAlert, IconCheck, IconClose, IconInfo } from '../icons';
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

const TOAST_DURATION = 4000;
const ERROR_DURATION = 7000;
const EXIT_DURATION = 280;

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
      setToasts((prev) => [...prev.slice(-3), { id, message, description, variant }]);
      setTimeout(() => removeToast(id), variant === 'error' ? ERROR_DURATION : TOAST_DURATION);
    },
    [removeToast]
  );

  const success = useCallback((msg: string) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, 'error'), [addToast]);
  const neutral = useCallback(
    (msg: string, desc?: string) => addToast(msg, 'neutral', desc),
    [addToast]
  );
  const value = useMemo(() => ({ success, error, neutral }), [success, error, neutral]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRegion toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastRegion({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="toast-region" role="region" aria-label="Notifications">
      <div aria-live="polite" className="toast-stack">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast--${toast.variant}${toast.exiting ? ' toast--exit' : ''}`}
            role={toast.variant === 'error' ? 'alert' : 'status'}
          >
            <span className="toast__mark" aria-hidden="true">
              {toast.variant === 'success' && <IconCheck size={16} />}
              {toast.variant === 'error' && <IconAlert size={16} />}
              {toast.variant === 'neutral' && <IconInfo size={16} />}
            </span>
            <div className="toast__text">
              <p className="toast__message">{toast.message}</p>
              {toast.description && <p className="toast__description">{toast.description}</p>}
            </div>
            <button
              type="button"
              className="toast__close"
              aria-label={t('TOAST.DISMISS')}
              onClick={() => onDismiss(toast.id)}
            >
              <IconClose size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
