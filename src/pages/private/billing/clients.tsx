import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Client } from '../../../lib/billing';
import { deleteClient, fetchClients } from '../../../services/billing/api-request';
import { useToast } from '../../../components/toast';
import { ConfirmDialog } from '../../../components/studio';
import { IconClose, IconEdit, IconPlus, IconSearch, IconTrash } from '../../../components/icons';
import { ClientDialog } from './dialogs';
import './list.scss';

function ClientsTab() {
  const { t } = useTranslation();
  const toast = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Client | null | undefined>(undefined);
  const [toDelete, setToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setClients(await fetchClients());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? clients.filter((c) => [c.name, c.tax_id, c.email].join(' ').toLowerCase().includes(q))
      : clients;
  }, [clients, query]);

  const onSaved = (saved: Client) => {
    setClients((list) => {
      const exists = list.some((c) => c.id === saved.id);
      const next = exists ? list.map((c) => (c.id === saved.id ? saved : c)) : [...list, saved];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    setEditing(undefined);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteClient(toDelete.id);
      setClients((list) => list.filter((c) => c.id !== toDelete.id));
      toast.success(t('BILLING.CLIENT_DELETED'));
      setToDelete(null);
    } catch {
      toast.error(t('BILLING.ACTION_FAILED'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="billing-list">
      <div className="billing-list__toolbar">
        <label className="search">
          <IconSearch size={18} />
          <span className="visually-hidden">{t('BILLING.SEARCH_CLIENTS')}</span>
          <input
            type="search"
            className="search__input"
            placeholder={t('BILLING.SEARCH_CLIENTS')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="search__clear"
              aria-label={t('TOAST.DISMISS')}
              onClick={() => setQuery('')}
            >
              <IconClose size={16} />
            </button>
          )}
        </label>
        <button type="button" className="btn" onClick={() => setEditing(null)}>
          <IconPlus size={18} /> {t('BILLING.NEW_CLIENT')}
        </button>
      </div>

      {status === 'loading' && <div className="skeleton" style={{ height: 160 }} />}
      {status === 'error' && (
        <div className="admin-state">
          <p>{t('BILLING.LOAD_FAILED')}</p>
          <button type="button" className="btn btn--ghost" onClick={load}>
            {t('PRIVATE.RETRY')}
          </button>
        </div>
      )}
      {status === 'ready' && clients.length === 0 && (
        <div className="admin-state">
          <p>{t('BILLING.EMPTY_CLIENTS')}</p>
        </div>
      )}
      {status === 'ready' && clients.length > 0 && visible.length === 0 && (
        <div className="admin-state">
          <p>{t('BILLING.NO_RESULTS')}</p>
        </div>
      )}

      {status === 'ready' && visible.length > 0 && (
        <ul className="doc-rows">
          {visible.map((c) => (
            <li key={c.id} className="doc-row">
              <button
                type="button"
                className="doc-row__main doc-row__main--button"
                onClick={() => setEditing(c)}
              >
                <span className="doc-row__client">{c.name}</span>
                <span className="doc-row__meta">
                  {c.tax_id && <span>{c.tax_id}</span>}
                  {c.email && <span>{c.email}</span>}
                  {c.address && <span>{c.address.split('\n')[0]}</span>}
                </span>
              </button>
              <div className="doc-row__actions">
                <button
                  type="button"
                  className="icon-btn"
                  title={t('BILLING.EDIT')}
                  aria-label={`${t('BILLING.EDIT')}: ${c.name}`}
                  onClick={() => setEditing(c)}
                >
                  <IconEdit size={18} />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  title={t('BILLING.DELETE')}
                  aria-label={`${t('BILLING.DELETE')}: ${c.name}`}
                  onClick={() => setToDelete(c)}
                >
                  <IconTrash size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ClientDialog
        open={editing !== undefined}
        client={editing}
        onClose={() => setEditing(undefined)}
        onSaved={onSaved}
      />
      <ConfirmDialog
        open={!!toDelete}
        title={t('BILLING.DELETE_CLIENT_TITLE')}
        confirmLabel={t('BILLING.DELETE')}
        cancelLabel={t('PRIVATE.CANCEL')}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setToDelete(null)}
        busy={deleting}
      >
        <p>{toDelete && t('BILLING.DELETE_CLIENT_TEXT', { name: toDelete.name })}</p>
      </ConfirmDialog>
    </div>
  );
}

export default ClientsTab;
