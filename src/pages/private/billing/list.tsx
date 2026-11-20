import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  DOC_LANGUAGES,
  DocLanguage,
  DocumentKind,
  DocumentStatus,
  documentSummary,
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
  IconArrowRight,
  IconClose,
  IconCopy,
  IconDownload,
  IconInvoice,
  IconMore,
  IconPlus,
  IconSearch,
  IconTrash,
} from '../../../components/icons';
import './list.scss';
import {
  inPeriod,
  loadPeriod,
  Period,
  PERIOD_PRESETS,
  PeriodChoice,
  periodRange,
  savePeriod,
} from './period';

const basePath = (kind: DocumentKind) =>
  kind === 'quote' ? '/private/quotes' : '/private/invoices';

const STATUS_ORDER: DocumentStatus[] = ['draft', 'sent', 'accepted', 'rejected', 'paid'];

// The totals worth watching for each kind of document.
const SUMMARY_STATUSES: Record<DocumentKind, DocumentStatus[]> = {
  quote: ['sent', 'accepted', 'paid', 'draft'],
  invoice: ['sent', 'paid', 'draft'],
};

const totalOf = (doc: BillingDocument) => {
  const total = parseAmount(doc.total_amount || '0');
  return Number.isFinite(total) ? total : 0;
};

interface RowMenuProps {
  doc: BillingDocument;
  kind: DocumentKind;
  disabled: boolean;
  canDownload: boolean;
  busy: string | null;
  onDownload: (lang: DocLanguage) => void;
  onDuplicate: () => void;
  onToInvoice: () => void;
  onDelete: () => void;
}

function RowMenu({
  doc,
  kind,
  disabled,
  canDownload,
  busy,
  onDownload,
  onDuplicate,
  onToInvoice,
  onDelete,
}: RowMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const working = busy !== null && busy.endsWith(`-${doc.id}`);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  const languages = [
    doc.content.language,
    ...DOC_LANGUAGES.filter((lang) => lang !== doc.content.language),
  ];

  return (
    <div className="row-menu" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t('BILLING.MORE_ACTIONS')}: ${doc.number}`}
        title={t('BILLING.MORE_ACTIONS')}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        {working ? <Spinner size={16} /> : <IconMore size={20} />}
      </button>
      {open && (
        <div className="download-menu__list row-menu__list" role="menu">
          <p className="download-menu__title">{t('BILLING.DOWNLOAD_IN')}</p>
          {languages.map((lang) => (
            <button
              key={lang}
              type="button"
              role="menuitem"
              className="download-menu__item"
              disabled={!canDownload}
              onClick={choose(() => onDownload(lang))}
            >
              <IconDownload size={16} />
              {t(`BILLING.LANG_${lang}`)}
              {lang === doc.content.language && (
                <span className="download-menu__dot" aria-hidden="true" />
              )}
            </button>
          ))}
          <span className="row-menu__divider" role="separator" />
          {kind === 'quote' && (
            <button
              type="button"
              role="menuitem"
              className="download-menu__item"
              onClick={choose(onToInvoice)}
            >
              <IconInvoice size={16} /> {t('BILLING.TO_INVOICE')}
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className="download-menu__item"
            onClick={choose(onDuplicate)}
          >
            <IconCopy size={16} /> {t('BILLING.DUPLICATE')}
          </button>
          <button
            type="button"
            role="menuitem"
            className="download-menu__item download-menu__item--danger"
            onClick={choose(onDelete)}
          >
            <IconTrash size={16} /> {t('BILLING.DELETE')}
          </button>
        </div>
      )}
    </div>
  );
}

function BillingList({ kind }: { kind: DocumentKind }) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<BillingDocument[]>([]);
  const [issuer, setIssuer] = useState<Issuer | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [period, setPeriodState] = useState<Period>(() => loadPeriod(kind));
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

  const setPeriod = (next: Period) => {
    setPeriodState(next);
    savePeriod(kind, next);
  };

  const choosePeriod = (choice: PeriodChoice) => setPeriod({ ...period, choice });

  // Years before last year get their own option once there are documents from them.
  const olderYears = useMemo(() => {
    const lastYear = new Date().getFullYear() - 1;
    return Array.from(new Set(docs.map((d) => Number(d.date.slice(0, 4)))))
      .filter((y) => Number.isFinite(y) && y < lastYear)
      .sort((a, b) => b - a);
  }, [docs]);

  const inYear = useMemo(() => {
    const range = periodRange(period);
    return docs.filter((d) => inPeriod(d.date, range));
  }, [docs, period]);

  const periodTotal = useMemo(
    () => ({ count: inYear.length, amount: inYear.reduce((sum, d) => sum + totalOf(d), 0) }),
    [inYear]
  );

  const summary = useMemo(
    () =>
      SUMMARY_STATUSES[kind].map((key) => {
        const matching = inYear.filter((d) => d.status === key);
        return {
          key,
          count: matching.length,
          amount: matching.reduce((sum, d) => sum + totalOf(d), 0),
        };
      }),
    [inYear, kind]
  );

  const presentStatuses = STATUS_ORDER.filter((s) => inYear.some((d) => d.status === s));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inYear.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (d.client_snapshot.name || '').toLowerCase().includes(q) ||
        (d.number || '').includes(q) ||
        documentSummary(d).toLowerCase().includes(q)
      );
    });
  }, [inYear, query, statusFilter]);

  const issuerMissing = status === 'ready' && !issuer?.legal_name?.trim();
  const filtering = query.trim() !== '' || statusFilter !== 'all' || period.choice !== 'all';

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
      {issuerMissing && (
        <p className="billing-notice">
          {t('BILLING.ISSUER_MISSING')}{' '}
          <Link to="/private/issuer" className="text-link">
            {t('BILLING.ISSUER')} <IconArrowRight size={16} />
          </Link>
        </p>
      )}

      {status === 'ready' && docs.length > 0 && (
        <div className="ledger-period" role="group" aria-label={t('BILLING.PERIOD_LABEL')}>
          <div className="ledger-period__presets">
            {PERIOD_PRESETS.map((choice) => (
              <button
                key={choice}
                type="button"
                className="ledger-period__option"
                aria-pressed={period.choice === choice}
                onClick={() => choosePeriod(choice)}
              >
                {t(`BILLING.PERIOD_${choice}`)}
              </button>
            ))}
            {olderYears.map((year) => (
              <button
                key={year}
                type="button"
                className="ledger-period__option"
                aria-pressed={period.choice === `year-${year}`}
                onClick={() => choosePeriod(`year-${year}`)}
              >
                {year}
              </button>
            ))}
            <button
              type="button"
              className="ledger-period__option"
              aria-pressed={period.choice === 'custom'}
              onClick={() => choosePeriod('custom')}
            >
              {t('BILLING.PERIOD_custom')}
            </button>
          </div>
          {period.choice === 'custom' && (
            <div className="ledger-period__range">
              <label className="ledger-period__date">
                <span>{t('BILLING.PERIOD_FROM')}</span>
                <input
                  type="date"
                  value={period.from}
                  max={period.to || undefined}
                  onChange={(e) => setPeriod({ ...period, from: e.target.value })}
                />
              </label>
              <label className="ledger-period__date">
                <span>{t('BILLING.PERIOD_TO')}</span>
                <input
                  type="date"
                  value={period.to}
                  min={period.from || undefined}
                  onChange={(e) => setPeriod({ ...period, to: e.target.value })}
                />
              </label>
            </div>
          )}
        </div>
      )}

      {status === 'ready' && docs.length > 0 && (
        <div className="ledger-summary">
          <button
            type="button"
            className="ledger-summary__tile ledger-summary__tile--total"
            aria-pressed={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          >
            <span className="ledger-summary__label">{t('BILLING.LEDGER_TOTAL')}</span>
            <span className="ledger-summary__amount tabular">
              {formatMoney(periodTotal.amount)}
            </span>
            <span className="ledger-summary__count">
              {t('BILLING.LEDGER_COUNT', { count: periodTotal.count })}
            </span>
          </button>
          {summary.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`ledger-summary__tile ledger-summary__tile--${item.key}`}
              aria-pressed={statusFilter === item.key}
              onClick={() => setStatusFilter((f) => (f === item.key ? 'all' : item.key))}
            >
              <span className="ledger-summary__label">
                {t(`BILLING.LEDGER_${kind}_${item.key}`)}
              </span>
              <span className="ledger-summary__amount tabular">{formatMoney(item.amount)}</span>
              <span className="ledger-summary__count">
                {t('BILLING.LEDGER_COUNT', { count: item.count })}
              </span>
            </button>
          ))}
        </div>
      )}

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
        <Link to={`${basePath(kind)}/new`} className="btn">
          <IconPlus size={18} />{' '}
          {kind === 'quote' ? t('BILLING.NEW_QUOTE') : t('BILLING.NEW_INVOICE')}
        </Link>
      </div>

      {status === 'ready' && docs.length > 0 && (
        <div className="ledger-filters" role="group" aria-label={t('BILLING.STATUS')}>
          <button
            type="button"
            className="ledger-chip"
            aria-pressed={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          >
            {t('BILLING.LEDGER_ALL')}
            <span className="ledger-chip__count">{inYear.length}</span>
          </button>
          {presentStatuses.map((s) => (
            <button
              key={s}
              type="button"
              className="ledger-chip"
              aria-pressed={statusFilter === s}
              onClick={() => setStatusFilter(s)}
            >
              <span className={`ledger-dot ledger-dot--${s}`} aria-hidden="true" />
              {t(`BILLING.STATUS_${s}`)}
            </button>
          ))}
        </div>
      )}

      {status === 'loading' && (
        <div className="ledger" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="ledger__row ledger__row--skeleton">
              <div className="skeleton" />
            </div>
          ))}
        </div>
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
          {filtering && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setQuery('');
                setStatusFilter('all');
                setPeriod({ ...period, choice: 'all' });
              }}
            >
              {t('BILLING.LEDGER_CLEAR')}
            </button>
          )}
        </div>
      )}

      {status === 'ready' && visible.length > 0 && (
        <div className="ledger">
          <div className="ledger__head" aria-hidden="true">
            <span>{t('BILLING.LEDGER_COL_NUMBER')}</span>
            <span>{t('BILLING.LEDGER_COL_CLIENT')}</span>
            <span>{t('BILLING.DATE')}</span>
            <span>{t('BILLING.STATUS')}</span>
            <span className="ledger__amount">{t('BILLING.LEDGER_COL_TOTAL')}</span>
          </div>
          <ul className="ledger__rows">
            {visible.map((d) => {
              const summaryText = documentSummary(d);
              return (
                <li key={d.id} className="ledger__row">
                  <Link to={`${basePath(kind)}/${d.id}`} className="ledger__link">
                    <span className="ledger__number tabular">{d.number}</span>
                    <span className="ledger__client">
                      <strong>{d.client_snapshot.name || '—'}</strong>
                      {(summaryText || d.source_quote_number) && (
                        <span>
                          {d.source_quote_number
                            ? t('BILLING.FROM_QUOTE', { n: d.source_quote_number })
                            : summaryText}
                        </span>
                      )}
                    </span>
                    <span className="ledger__date tabular">{formatDocDate(d.date)}</span>
                    <span className="ledger__status">
                      <span className={`doc-status doc-status--${d.status}`}>
                        {t(`BILLING.STATUS_${d.status}`)}
                      </span>
                    </span>
                    <span className="ledger__amount tabular">{formatMoney(totalOf(d))}</span>
                  </Link>
                  <RowMenu
                    doc={d}
                    kind={kind}
                    busy={busy}
                    disabled={!!busy}
                    canDownload={!issuerMissing}
                    onDownload={(lang) => onDownload(d, lang)}
                    onDuplicate={() => onDuplicate(d)}
                    onToInvoice={() => onToInvoice(d)}
                    onDelete={() => setToDelete(d)}
                  />
                </li>
              );
            })}
          </ul>
        </div>
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
