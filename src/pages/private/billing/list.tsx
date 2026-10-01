import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  deleteDocument,
  duplicateDocument,
  fetchDocuments,
  fetchIssuer,
  quoteToInvoice,
} from '../../../services/billing/api-request';
import {
  BillingDocument,
  DocLanguage,
  DocumentKind,
  formatDocDate,
  formatMoney,
  Issuer,
  normalizeDocument,
  parseAmount,
} from '../../../lib/billing';
import { downloadPdf } from '../../../lib/billing-pdf';
import { useToast } from '../../../components/toast';
import { ConfirmDialog } from '../../../components/studio';
import Spinner from '../../../components/spinner';
import {
  IconClose,
  IconCopy,
  IconEdit,
  IconPlus,
  IconSearch,
  IconTrash,
  IconArrowRight,
} from '../../../components/icons';
import DownloadMenu from './download-menu';
import './list.scss';

const basePath = (kind: DocumentKind) =>
  kind === 'quote' ? '/private/quotes' : '/private/invoices';

function BillingList({ kind }: { kind: DocumentKind }) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<BillingDocument[]>([]);
  const [issuer, setIssuer] = useState<Issuer | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<BillingDocument | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [list, iss] = await Promise.all([fetchDocuments(kind), fetchIssuer()]);
      setDocs(list.map(normalizeDocument));
      setIssuer(iss);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [kind]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(
      (d) =>
        (d.client_snapshot.name || '').toLowerCase().includes(q) || (d.number || '').includes(q)
    );
  }, [docs, query]);

  const issuerMissing = status === 'ready' && !issuer?.legal_name?.trim();

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch {
      toast.error(t('BILLING.ACTION_FAILED'));
    } finally {
      setBusy(null);
    }
  };

  const onDownload = (d: BillingDocument, lang: DocLanguage) =>
    run(`pdf-${d.id}`, async () => {
      if (issuer) await downloadPdf(d, issuer, lang);
    });

  const onDuplicate = (d: BillingDocument) =>
    run(`dup-${d.id}`, async () => {
      const copy = await duplicateDocument(d.id!);
      toast.success(t('BILLING.DUPLICATED', { n: copy.number }));
      navigate(`${basePath(kind)}/${copy.id}`);
    });

  const onToInvoice = (d: BillingDocument) =>
    run(`inv-${d.id}`, async () => {
      const inv = await quoteToInvoice(d.id!);
      toast.success(t('BILLING.INVOICE_CREATED', { n: inv.number }));
      navigate(`/private/invoices/${inv.id}`);
    });

  const confirmDelete = () =>
    run('delete', async () => {
      if (!toDelete) return;
      await deleteDocument(toDelete.id!);
      setDocs((list) => list.filter((d) => d.id !== toDelete.id));
      setToDelete(null);
      toast.success(t('BILLING.DELETED'));
    });

  return (
    <div className="billing-list">
      <div className="billing-list__toolbar">
        <label className="search">
          <IconSearch size={18} />
          <span className="visually-hidden">{t('BILLING.SEARCH')}</span>
          <input
            type="search"
            className="search__input"
            placeholder={t('BILLING.SEARCH')}
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
        <div className="billing-list__actions">
          {kind === 'quote' ? (
            <>
              <Link to={`${basePath(kind)}/new`} className="btn">
                <IconPlus size={18} /> {t('BILLING.NEW_QUOTE')}
              </Link>
            </>
          ) : (
            <Link to={`${basePath(kind)}/new`} className="btn">
              <IconPlus size={18} /> {t('BILLING.NEW_INVOICE')}
            </Link>
          )}
        </div>
      </div>

      {issuerMissing && (
        <p className="billing-notice">
          {t('BILLING.ISSUER_MISSING')}{' '}
          <Link to="/private?tab=issuer" className="text-link">
            {t('BILLING.ISSUER')} <IconArrowRight size={16} />
          </Link>
        </p>
      )}

      {status === 'loading' && (
        <ul className="doc-rows" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="doc-row doc-row--skeleton">
              <div className="skeleton" />
            </li>
          ))}
        </ul>
      )}

      {status === 'error' && (
        <div className="admin-state">
          <p>{t('BILLING.LOAD_FAILED')}</p>
          <button type="button" className="btn btn--ghost" onClick={load}>
            {t('PRIVATE.RETRY')}
          </button>
        </div>
      )}

      {status === 'ready' && docs.length === 0 && (
        <div className="admin-state">
          <p>{kind === 'quote' ? t('BILLING.EMPTY_QUOTES') : t('BILLING.EMPTY_INVOICES')}</p>
        </div>
      )}

      {status === 'ready' && docs.length > 0 && visible.length === 0 && (
        <div className="admin-state">
          <p>{t('BILLING.NO_RESULTS')}</p>
        </div>
      )}

      {status === 'ready' && visible.length > 0 && (
        <ul className="doc-rows">
          {visible.map((d) => {
            const total = parseAmount(d.total_amount || '0');
            return (
              <li key={d.id} className="doc-row">
                <Link to={`${basePath(kind)}/${d.id}`} className="doc-row__main">
                  <span className="doc-row__number tabular">{d.number}</span>
                  <span className="doc-row__client">{d.client_snapshot.name || '—'}</span>
                  <span className="doc-row__meta">
                    <span className="tabular">{formatDocDate(d.date)}</span>
                    <span className={`doc-status doc-status--${d.status}`}>
                      {t(`BILLING.STATUS_${d.status}`)}
                    </span>
                    {d.source_quote_number ? (
                      <span>{t('BILLING.FROM_QUOTE', { n: d.source_quote_number })}</span>
                    ) : null}
                  </span>
                  <span className="doc-row__total tabular">
                    {formatMoney(Number.isFinite(total) ? total : 0)}
                  </span>
                </Link>
                <div className="doc-row__actions">
                  <DownloadMenu
                    compact
                    current={d.content.language}
                    label={`${t('BILLING.DOWNLOAD')}: ${d.number}`}
                    onDownload={(lang) => onDownload(d, lang)}
                    disabled={!!busy || issuerMissing}
                    busy={busy === `pdf-${d.id}`}
                  />
                  <Link
                    to={`${basePath(kind)}/${d.id}`}
                    className="icon-btn"
                    title={t('BILLING.EDIT')}
                    aria-label={`${t('BILLING.EDIT')}: ${d.number}`}
                  >
                    <IconEdit size={18} />
                  </Link>
                  <button
                    type="button"
                    className="icon-btn"
                    title={t('BILLING.DUPLICATE')}
                    aria-label={`${t('BILLING.DUPLICATE')}: ${d.number}`}
                    onClick={() => onDuplicate(d)}
                    disabled={!!busy}
                  >
                    {busy === `dup-${d.id}` ? <Spinner size={16} /> : <IconCopy size={18} />}
                  </button>
                  {kind === 'quote' && (
                    <button
                      type="button"
                      className="btn btn--quiet btn--sm"
                      onClick={() => onToInvoice(d)}
                      disabled={!!busy}
                    >
                      {busy === `inv-${d.id}` ? <Spinner size={14} /> : null}
                      {t('BILLING.TO_INVOICE')}
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    title={t('BILLING.DELETE')}
                    aria-label={`${t('BILLING.DELETE')}: ${d.number}`}
                    onClick={() => setToDelete(d)}
                    disabled={!!busy}
                  >
                    <IconTrash size={18} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={t(`BILLING.DELETE_TITLE_${kind}`)}
        confirmLabel={t('BILLING.DELETE')}
        cancelLabel={t('PRIVATE.CANCEL')}
        onConfirm={confirmDelete}
        onCancel={() => busy !== 'delete' && setToDelete(null)}
        busy={busy === 'delete'}
      >
        <p>
          {toDelete &&
            t('BILLING.DELETE_TEXT', {
              n: toDelete.number,
              client: toDelete.client_snapshot.name || '—',
            })}
        </p>
      </ConfirmDialog>
    </div>
  );
}

export default BillingList;
