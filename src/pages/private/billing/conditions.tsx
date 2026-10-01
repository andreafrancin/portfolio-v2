import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Condition } from '../../../lib/billing';
import { deleteCondition, fetchConditions } from '../../../services/billing/api-request';
import { useToast } from '../../../components/toast';
import { ConfirmDialog } from '../../../components/studio';
import { IconEdit, IconPlus, IconTrash } from '../../../components/icons';
import { ConditionDialog } from './dialogs';
import './list.scss';

function ConditionsTab() {
  const { t } = useTranslation();
  const toast = useToast();
  const [items, setItems] = useState<Condition[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [editing, setEditing] = useState<Condition | null | undefined>(undefined);
  const [toDelete, setToDelete] = useState<Condition | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setItems(await fetchConditions());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSaved = (saved: Condition) => {
    setItems((list) => {
      const exists = list.some((c) => c.id === saved.id);
      const next = exists ? list.map((c) => (c.id === saved.id ? saved : c)) : [...list, saved];
      return next.sort((a, b) => a.title.localeCompare(b.title));
    });
    setEditing(undefined);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteCondition(toDelete.id);
      setItems((list) => list.filter((c) => c.id !== toDelete.id));
      toast.success(t('BILLING.CONDITION_DELETED'));
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
        <p className="billing-list__intro">{t('BILLING.CONDITIONS_INTRO')}</p>
        <button type="button" className="btn" onClick={() => setEditing(null)}>
          <IconPlus size={18} /> {t('BILLING.NEW_CONDITION')}
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
      {status === 'ready' && items.length === 0 && (
        <div className="admin-state">
          <p>{t('BILLING.EMPTY_CONDITIONS')}</p>
        </div>
      )}

      {status === 'ready' && items.length > 0 && (
        <ul className="doc-rows">
          {items.map((c) => (
            <li key={c.id} className="doc-row doc-row--condition">
              <button
                type="button"
                className="doc-row__main doc-row__main--button"
                onClick={() => setEditing(c)}
              >
                <span className="doc-row__client">{c.title}</span>
                <span className="condition-preview">{c.text}</span>
              </button>
              <div className="doc-row__actions">
                <button
                  type="button"
                  className="icon-btn"
                  title={t('BILLING.EDIT')}
                  aria-label={`${t('BILLING.EDIT')}: ${c.title}`}
                  onClick={() => setEditing(c)}
                >
                  <IconEdit size={18} />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  title={t('BILLING.DELETE')}
                  aria-label={`${t('BILLING.DELETE')}: ${c.title}`}
                  onClick={() => setToDelete(c)}
                >
                  <IconTrash size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConditionDialog
        open={editing !== undefined}
        condition={editing}
        onClose={() => setEditing(undefined)}
        onSaved={onSaved}
      />
      <ConfirmDialog
        open={!!toDelete}
        title={t('BILLING.DELETE_CONDITION_TITLE')}
        confirmLabel={t('BILLING.DELETE')}
        cancelLabel={t('PRIVATE.CANCEL')}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setToDelete(null)}
        busy={deleting}
      >
        <p>{toDelete && t('BILLING.DELETE_CONDITION_TEXT', { title: toDelete.title })}</p>
      </ConfirmDialog>
    </div>
  );
}

export default ConditionsTab;
