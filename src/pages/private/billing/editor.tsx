import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  createDocument,
  fetchClients,
  fetchConditions,
  fetchDocument,
  fetchIssuer,
  fetchNextNumber,
  quoteToInvoice,
  updateDocument,
} from '../../../services/billing/api-request';
import {
  BillingDocument,
  Client,
  Condition,
  computeTotals,
  documentNumber,
  DEFAULT_LEAD,
  DOC_LANGUAGES,
  DocLanguage,
  DocumentKind,
  DocumentLayout,
  DocumentLine,
  DocumentSection,
  emptyLine,
  emptySection,
  formatMoney,
  Issuer,
  newDocument,
  normalizeDocument,
} from '../../../lib/billing';
import { downloadPdf, renderPdf } from '../../../lib/billing-pdf';
import { Panel, StudioPageHeader } from '../../../components/studio';
import { useToast } from '../../../components/toast';
import Spinner from '../../../components/spinner';
import {
  IconArrowLeft,
  IconChevronDown,
  IconChevronUp,
  IconClose,
  IconCopy,
  IconPlus,
} from '../../../components/icons';
import useUnsavedWarning from '../../../hooks/useUnsavedWarning';
import DownloadMenu from './download-menu';
import { ClientDialog, ConditionDialog } from './dialogs';
import './list.scss';
import './editor.scss';
import RichField from './rich-field';

const STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'paid'] as const;
const listPath = (kind: DocumentKind) => `/private?tab=${kind === 'quote' ? 'quotes' : 'invoices'}`;
const basePath = (kind: DocumentKind) =>
  kind === 'quote' ? '/private/quotes' : '/private/invoices';

const snapshotOf = (c: Client) => ({ name: c.name, tax_id: c.tax_id, address: c.address });
const serialize = (d: BillingDocument | null) =>
  d
    ? JSON.stringify({
        ...d,
        updated_at: undefined,
        number: undefined,
        base_amount: undefined,
        iva_amount: undefined,
        irpf_amount: undefined,
        total_amount: undefined,
      })
    : '';

const AUTOSAVE_MS = 30_000;

function DocumentEditor({ kind }: { kind: DocumentKind }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const params = useParams();
  const [search] = useSearchParams();
  const isNew = !params.id || params.id === 'new';
  const id = isNew ? null : Number(params.id);

  const [doc, setDoc] = useState<BillingDocument | null>(null);
  const [issuer, setIssuer] = useState<Issuer | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [clientDialog, setClientDialog] = useState<'new' | 'edit' | null>(null);
  const [conditionDialog, setConditionDialog] = useState(false);
  const saved = useRef('');
  const pristine = useRef('');
  const [autosave, setAutosave] = useState<{ state: 'idle' | 'saved' | 'failed'; at?: Date }>({
    state: 'idle',
  });

  const [preview, setPreview] = useState<{
    url: string | null;
    state: 'idle' | 'working' | 'error';
  }>({
    url: null,
    state: 'idle',
  });

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [iss, cls, conds] = await Promise.all([
        fetchIssuer(),
        fetchClients(),
        fetchConditions(),
      ]);
      setIssuer(iss);
      setClients(cls);
      setConditions(conds);
      let next: BillingDocument;
      if (id) {
        next = normalizeDocument(await fetchDocument(id));
      } else {
        const layoutParam = search.get('layout');
        const layout: DocumentLayout | undefined =
          layoutParam === 'numbered' || layoutParam === 'concept' ? layoutParam : undefined;
        next = newDocument(kind, iss, layout);
        if (kind === 'quote' && conds.length > 0) next.conditions_text = conds[0].text;
        const num = await fetchNextNumber(kind, next.year);
        next.sequence = num.sequence;
      }
      setDoc(next);
      saved.current = isNew ? '' : serialize(next);
      pristine.current = isNew ? serialize(next) : '';
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [id, kind]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = status === 'ready' && serialize(doc) !== saved.current;
  useUnsavedWarning(dirty && !saving);

  useEffect(() => {
    if (!doc || !issuer) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPreview((p) => ({ ...p, state: 'working' }));
      try {
        const blob = await renderPdf(doc, issuer);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setPreview((p) => {
          if (p.url) URL.revokeObjectURL(p.url);
          return { url, state: 'idle' };
        });
      } catch {
        if (!cancelled) setPreview((p) => ({ ...p, state: 'error' }));
      }
    }, 550);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [doc, issuer]);

  useEffect(
    () => () => {
      setPreview((p) => {
        if (p.url) URL.revokeObjectURL(p.url);
        return p;
      });
    },
    []
  );

  const totals = useMemo(() => (doc ? computeTotals(doc) : null), [doc]);

  const update = (patch: Partial<BillingDocument>) => setDoc((d) => (d ? { ...d, ...patch } : d));
  const updateContent = (patch: Partial<BillingDocument['content']>) =>
    setDoc((d) => (d ? { ...d, content: { ...d.content, ...patch } } : d));
  const updateSection = (sid: string, patch: Partial<DocumentSection>) =>
    setDoc((d) =>
      d
        ? {
            ...d,
            content: {
              ...d.content,
              sections: d.content.sections.map((s) => (s.id === sid ? { ...s, ...patch } : s)),
            },
          }
        : d
    );
  const moveSection = (index: number, delta: number) =>
    setDoc((d) => {
      if (!d) return d;
      const list = [...d.content.sections];
      const to = index + delta;
      if (to < 0 || to >= list.length) return d;
      [list[index], list[to]] = [list[to], list[index]];
      return { ...d, content: { ...d.content, sections: list } };
    });
  const addSection = () =>
    setDoc((d) =>
      d
        ? {
            ...d,
            content: {
              ...d.content,
              sections: [
                ...d.content.sections,
                d.kind === 'invoice' ? { ...emptySection(), lines: [emptyLine()] } : emptySection(),
              ],
            },
          }
        : d
    );
  const removeSection = (sid: string) =>
    setDoc((d) =>
      d
        ? {
            ...d,
            content: { ...d.content, sections: d.content.sections.filter((s) => s.id !== sid) },
          }
        : d
    );
  const updateLine = (sid: string, lid: string, patch: Partial<DocumentLine>) =>
    setDoc((d) =>
      d
        ? {
            ...d,
            content: {
              ...d.content,
              sections: d.content.sections.map((s) =>
                s.id === sid
                  ? { ...s, lines: s.lines.map((l) => (l.id === lid ? { ...l, ...patch } : l)) }
                  : s
              ),
            },
          }
        : d
    );

  const pickClient = (value: string) => {
    if (!doc) return;
    if (!value) {
      update({ client: null });
      return;
    }
    const c = clients.find((x) => x.id === Number(value));
    if (!c) return;
    update({
      client: c.id,
      client_snapshot: snapshotOf(c),
      authorization_text: doc.authorization_text.trim()
        ? doc.authorization_text
        : c.authorization_text,
    });
  };

  const onClientSaved = (c: Client) => {
    setClients((list) => {
      const exists = list.some((x) => x.id === c.id);
      return (exists ? list.map((x) => (x.id === c.id ? c : x)) : [...list, c]).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });
    setDoc((d) =>
      d
        ? {
            ...d,
            client: c.id,
            client_snapshot: snapshotOf(c),
            authorization_text:
              d.authorization_text.trim() && d.client === c.id
                ? d.authorization_text
                : c.authorization_text,
          }
        : d
    );
    setClientDialog(null);
  };

  const onConditionSaved = (c: Condition) => {
    setConditions((list) =>
      [...list.filter((x) => x.id !== c.id), c].sort((a, b) => a.title.localeCompare(b.title))
    );
    update({ conditions_text: c.text });
    setConditionDialog(false);
  };

  const changeLanguage = (language: DocLanguage) =>
    setDoc((d) => {
      if (!d || d.content.language === language) return d;
      const lead =
        d.content.lead === DEFAULT_LEAD[d.content.language]
          ? DEFAULT_LEAD[language]
          : d.content.lead;
      return { ...d, content: { ...d.content, language, lead } };
    });

  const changeLayout = (layout: DocumentLayout) =>
    setDoc((d) => {
      if (!d || d.layout === layout) return d;
      const numbered = layout === 'numbered';
      return {
        ...d,
        layout,
        totals_style: d.totals_style === 'base' ? 'base' : numbered ? 'summary' : 'table',
        irpf_rate: numbered ? '0' : d.irpf_rate === '0' ? '15' : d.irpf_rate,
        content: {
          ...d.content,
          lead:
            !numbered && !d.content.lead.trim()
              ? DEFAULT_LEAD[d.content.language]
              : numbered && d.content.lead === DEFAULT_LEAD[d.content.language]
                ? ''
                : d.content.lead,
        },
      };
    });

  const save = async ({ silent = false } = {}): Promise<BillingDocument | null> => {
    if (!doc) return null;
    setSaving(true);
    try {
      const working = doc;
      const tt = computeTotals(working);
      const body: Partial<BillingDocument> = {
        ...working,
        base_amount: tt.base.toFixed(2),
        iva_amount: tt.iva.toFixed(2),
        irpf_amount: tt.irpf.toFixed(2),
        total_amount: tt.total.toFixed(2),
      };
      const result = normalizeDocument(
        working.id ? await updateDocument(working.id, body) : await createDocument(body)
      );
      setDoc((current) =>
        !current || serialize(current) === serialize(working)
          ? result
          : {
              ...current,
              id: result.id,
              year: result.year,
              sequence: result.sequence,
              number: result.number,
              updated_at: result.updated_at,
            }
      );
      saved.current = serialize(result);
      if (silent) setAutosave({ state: 'saved', at: new Date() });
      else {
        toast.success(t('BILLING.SAVED'));
        setAutosave({ state: 'idle' });
      }
      if (!working.id) {
        window.history.replaceState(window.history.state, '', `${basePath(kind)}/${result.id}`);
      }
      return result;
    } catch (err: any) {
      const message = String(err?.message || '');
      if (silent) setAutosave({ state: 'failed' });
      if (message.includes('400') && message.includes('sequence')) {
        try {
          const num = await fetchNextNumber(kind, doc.year);
          update({ sequence: num.sequence });
          toast.error(t('BILLING.NUMBER_TAKEN'));
        } catch {
          toast.error(t('BILLING.SAVE_FAILED'));
        }
      } else if (!silent) {
        toast.error(t('BILLING.SAVE_FAILED'));
      }
      return null;
    } finally {
      setSaving(false);
    }
  };

  const onDownload = async (lang: DocLanguage) => {
    if (!doc || !issuer) return;
    setBusy('pdf');
    try {
      await downloadPdf(doc, issuer, lang);
    } catch {
      toast.error(t('BILLING.PREVIEW_FAILED'));
    } finally {
      setBusy(null);
    }
  };

  const onToInvoice = async () => {
    if (!doc) return;
    setBusy('invoice');
    try {
      const current = dirty || !doc.id ? await save() : doc;
      if (!current?.id) return;
      const inv = await quoteToInvoice(current.id);
      toast.success(t('BILLING.INVOICE_CREATED', { n: inv.number }));
      navigate(`/private/invoices/${inv.id}`);
    } catch {
      toast.error(t('BILLING.ACTION_FAILED'));
    } finally {
      setBusy(null);
    }
  };

  const autosaveTick = useRef<() => void>(() => {});
  autosaveTick.current = () => {
    if (!doc || saving || busy || !dirty) return;
    if (!doc.id && serialize(doc) === pristine.current) return;
    save({ silent: true });
  };
  useEffect(() => {
    const timer = window.setInterval(() => autosaveTick.current(), AUTOSAVE_MS);
    return () => window.clearInterval(timer);
  }, []);

  const back = (
    <Link to={listPath(kind)} className="text-link">
      <IconArrowLeft size={18} />{' '}
      {kind === 'quote' ? t('BILLING.TABS_QUOTES') : t('BILLING.TABS_INVOICES')}
    </Link>
  );

  if (status !== 'ready' || !doc) {
    return (
      <div className="studio">
        <StudioPageHeader
          back={back}
          title={kind === 'quote' ? t('BILLING.NEW_QUOTE') : t('BILLING.NEW_INVOICE')}
        />
        {status === 'loading' ? (
          <div className="doc-editor">
            <div className="skeleton" style={{ height: 520 }} />
            <div className="skeleton doc-preview__sheet" />
          </div>
        ) : (
          <div className="admin-state">
            <p>{t('BILLING.LOAD_FAILED')}</p>
            <button type="button" className="btn btn--ghost" onClick={load}>
              {t('PRIVATE.RETRY')}
            </button>
          </div>
        )}
      </div>
    );
  }

  const number = documentNumber(doc.year, doc.sequence);
  const isInvoice = kind === 'invoice';
  const layout = doc.layout;
  const issuerMissing = !issuer?.legal_name?.trim();

  return (
    <div className="studio studio--wide">
      <StudioPageHeader
        back={back}
        title={
          isInvoice
            ? t('BILLING.EDIT_INVOICE', { n: number })
            : t('BILLING.EDIT_QUOTE', { n: number })
        }
        meta={
          <>
            <span className={`doc-status doc-status--${doc.status}`}>
              {t(`BILLING.STATUS_${doc.status}`)}
            </span>
            {doc.source_quote_number ? (
              <span>{t('BILLING.FROM_QUOTE', { n: doc.source_quote_number })}</span>
            ) : null}
            <span className={dirty && !saving ? 'doc-dirty' : ''} aria-live="polite">
              {saving
                ? t('BILLING.AUTOSAVING')
                : autosave.state === 'failed' && dirty
                  ? t('BILLING.AUTOSAVE_FAILED')
                  : dirty
                    ? t('PRIVATE.UNSAVED')
                    : autosave.state === 'saved' && autosave.at
                      ? t('BILLING.AUTOSAVED', {
                          time: autosave.at.toLocaleTimeString(i18n.language, {
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                        })
                      : t('PRIVATE.ALL_SAVED')}
            </span>
          </>
        }
        actions={
          <>
            {!isInvoice && (
              <button
                type="button"
                className="btn btn--quiet btn--sm"
                onClick={onToInvoice}
                disabled={!!busy || saving}
              >
                {busy === 'invoice' ? <Spinner size={14} /> : <IconCopy size={16} />}
                {t('BILLING.TO_INVOICE')}
              </button>
            )}
            <DownloadMenu
              current={doc.content.language}
              onDownload={onDownload}
              disabled={!!busy || issuerMissing}
              busy={busy === 'pdf'}
            />
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => save()}
              disabled={saving || !doc.client_snapshot.name.trim()}
            >
              {saving ? <Spinner size={14} /> : null}
              {t('BILLING.SAVE')}
            </button>
          </>
        }
      />

      {issuerMissing && (
        <p className="billing-notice">
          {t('BILLING.ISSUER_MISSING')}{' '}
          <Link to="/private?tab=issuer" className="text-link">
            {t('BILLING.ISSUER')}
          </Link>
        </p>
      )}

      <div className="doc-editor">
        <form
          className="doc-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          noValidate
        >
          <Panel title={t('BILLING.NUMBER')}>
            <div className="form-grid form-grid--4">
              <div className="field">
                <label className="field__label" htmlFor="doc-year">
                  {t('BILLING.YEAR')}
                </label>
                <input
                  id="doc-year"
                  className="input"
                  type="number"
                  inputMode="numeric"
                  value={doc.year}
                  onChange={(e) => update({ year: Number(e.target.value) || doc.year })}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="doc-seq">
                  {t('BILLING.SEQUENCE')}
                </label>
                <input
                  id="doc-seq"
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={doc.sequence}
                  onChange={(e) => update({ sequence: Math.max(1, Number(e.target.value) || 1) })}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="doc-date">
                  {t('BILLING.DATE')}
                </label>
                <input
                  id="doc-date"
                  className="input"
                  type="date"
                  value={doc.date}
                  onChange={(e) => update({ date: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="doc-status">
                  {t('BILLING.STATUS')}
                </label>
                <select
                  id="doc-status"
                  className="input select"
                  value={doc.status}
                  onChange={(e) => update({ status: e.target.value as BillingDocument['status'] })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`BILLING.STATUS_${s}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <span className="field__label" id="doc-lang-label">
                {t('BILLING.PDF_LANGUAGE')}
              </span>
              <div
                className="lang-switch lang-switch--doc"
                role="group"
                aria-labelledby="doc-lang-label"
              >
                {DOC_LANGUAGES.map((l) => (
                  <button
                    key={l}
                    type="button"
                    className="lang-switch__btn"
                    aria-pressed={doc.content.language === l}
                    onClick={() => changeLanguage(l)}
                  >
                    {t(`BILLING.LANG_${l}`)}
                  </button>
                ))}
              </div>
              <span className="field__hint">{t('BILLING.PDF_LANGUAGE_HINT')}</span>
            </div>
            {!isInvoice && (
              <div className="layout-pick" role="radiogroup" aria-label={t('BILLING.LAYOUT')}>
                {(['concept', 'numbered'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    role="radio"
                    aria-checked={layout === l}
                    className="layout-pick__opt"
                    onClick={() => changeLayout(l)}
                  >
                    <strong>
                      {t(l === 'concept' ? 'BILLING.LAYOUT_CONCEPT' : 'BILLING.LAYOUT_NUMBERED')}
                    </strong>
                    <span>
                      {t(
                        l === 'concept'
                          ? 'BILLING.LAYOUT_CONCEPT_HINT'
                          : 'BILLING.LAYOUT_NUMBERED_HINT'
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <Panel title={t('BILLING.CLIENT')}>
            <div className="pick-row">
              <div className="field">
                <label className="field__label" htmlFor="doc-client">
                  {t('BILLING.CLIENT_SAVED')}
                </label>
                <select
                  id="doc-client"
                  className="input select"
                  value={doc.client ?? ''}
                  onChange={(e) => pickClient(e.target.value)}
                >
                  <option value="">{t('BILLING.CLIENT_PICK_NONE')}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn btn--quiet"
                onClick={() => setClientDialog('new')}
              >
                <IconPlus size={16} /> {t('BILLING.NEW_CLIENT')}
              </button>
            </div>
            {doc.client_snapshot.name ? (
              <div className="client-card">
                <div>
                  <strong>{doc.client_snapshot.name}</strong>
                  {[doc.client_snapshot.tax_id, ...doc.client_snapshot.address.split('\n')]
                    .filter((l) => l && l.trim())
                    .map((l, i) => (
                      <span key={i}>{l}</span>
                    ))}
                </div>
                {doc.client && (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setClientDialog('edit')}
                  >
                    {t('BILLING.EDIT_CLIENT')}
                  </button>
                )}
              </div>
            ) : (
              <p className="field__hint">{t('BILLING.CLIENT_REQUIRED')}</p>
            )}
          </Panel>

          {!isInvoice && (
            <Panel title={t('BILLING.INTRO')}>
              <div className="field">
                <label className="field__label" htmlFor="doc-lead">
                  {t(`BILLING.LEAD_${layout}`)}
                </label>
                <RichField
                  id="doc-lead"
                  label={t(`BILLING.LEAD_${layout}`)}
                  value={doc.content.lead}
                  onChange={(lead) => updateContent({ lead })}
                  defaultColor={layout === 'numbered' ? 'pink' : 'black'}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="doc-concept">
                  {t(`BILLING.CONCEPT_${layout}`)}
                </label>
                <RichField
                  id="doc-concept"
                  label={t(`BILLING.CONCEPT_${layout}`)}
                  multiline
                  rows={2}
                  value={doc.content.concept}
                  onChange={(concept) => updateContent({ concept })}
                  defaultBold
                  defaultColor="pink"
                  italic={layout === 'numbered'}
                />
              </div>
            </Panel>
          )}

          <Panel title={t('BILLING.ITEMS')}>
            <ol className="doc-sections">
              {doc.content.sections.map((s, i) => (
                <li key={s.id} className="doc-section">
                  <div className="doc-section__head">
                    <span className="doc-section__index tabular">
                      {layout === 'numbered' ? `${i + 1}.` : i + 1}
                    </span>
                    <div className="doc-section__tools">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => moveSection(i, -1)}
                        disabled={i === 0}
                        aria-label={`${t('BILLING.MOVE_ITEM', { n: i + 1 })} ↑`}
                      >
                        <IconChevronUp size={18} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => moveSection(i, 1)}
                        disabled={i === doc.content.sections.length - 1}
                        aria-label={`${t('BILLING.MOVE_ITEM', { n: i + 1 })} ↓`}
                      >
                        <IconChevronDown size={18} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        onClick={() => removeSection(s.id)}
                        disabled={doc.content.sections.length === 1}
                        aria-label={t('BILLING.REMOVE_ITEM')}
                      >
                        <IconClose size={18} />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`form-grid ${isInvoice ? 'form-grid--item-invoice' : 'form-grid--item'}`}
                  >
                    {isInvoice && (
                      <div className="field">
                        <label className="field__label" htmlFor={`qty-${s.id}`}>
                          {t('BILLING.ITEM_QTY')}
                        </label>
                        <input
                          id={`qty-${s.id}`}
                          className="input"
                          inputMode="numeric"
                          placeholder={t('BILLING.ITEM_QTY_HINT')}
                          value={s.quantity}
                          onChange={(e) => updateSection(s.id, { quantity: e.target.value })}
                        />
                      </div>
                    )}
                    <div className="field">
                      <label className="field__label" htmlFor={`title-${s.id}`}>
                        {t('BILLING.ITEM_TITLE')}
                      </label>
                      <RichField
                        id={`title-${s.id}`}
                        label={t('BILLING.ITEM_TITLE')}
                        value={s.title}
                        onChange={(title) => updateSection(s.id, { title })}
                        defaultBold
                        defaultColor={layout === 'numbered' ? 'black' : 'pink'}
                      />
                    </div>
                    <div className="field">
                      <label className="field__label" htmlFor={`price-${s.id}`}>
                        {t('BILLING.ITEM_PRICE')}
                      </label>
                      <input
                        id={`price-${s.id}`}
                        className="input"
                        inputMode="decimal"
                        placeholder={isInvoice ? t('BILLING.ITEM_PRICE_HINT') : '0,00'}
                        value={s.price}
                        onChange={(e) => updateSection(s.id, { price: e.target.value })}
                      />
                    </div>
                  </div>

                  {(layout === 'numbered' || isInvoice) && (
                    <div className="field">
                      <label className="field__label" htmlFor={`sub-${s.id}`}>
                        {t('BILLING.ITEM_SUBTITLE')}
                      </label>
                      <RichField
                        id={`sub-${s.id}`}
                        label={t('BILLING.ITEM_SUBTITLE')}
                        multiline
                        rows={isInvoice ? 1 : 2}
                        value={s.subtitle}
                        onChange={(subtitle) => updateSection(s.id, { subtitle })}
                        defaultBold
                        defaultColor="pink"
                        italic={!isInvoice}
                      />
                    </div>
                  )}

                  <div className="field">
                    <label className="field__label" htmlFor={`body-${s.id}`}>
                      {t(`BILLING.ITEM_BODY_${isInvoice ? 'concept' : layout}`)}
                    </label>
                    <RichField
                      id={`body-${s.id}`}
                      label={t(`BILLING.ITEM_BODY_${isInvoice ? 'concept' : layout}`)}
                      multiline
                      rows={isInvoice ? 2 : 4}
                      value={s.body}
                      onChange={(body) => updateSection(s.id, { body })}
                    />
                    {layout !== 'numbered' && (
                      <span className="field__hint">{t('BILLING.ITEM_BODY_HINT')}</span>
                    )}
                  </div>

                  {isInvoice && (
                    <div className="doc-lines">
                      <div className="doc-lines__head" aria-hidden="true">
                        <span>{t('BILLING.LINE_QTY')}</span>
                        <span>{t('BILLING.LINE_TEXT')}</span>
                        <span>{t('BILLING.LINE_AMOUNT')}</span>
                        <span />
                      </div>
                      {s.lines.map((l, j) => (
                        <div key={l.id} className="doc-lines__row">
                          <input
                            className="input"
                            inputMode="numeric"
                            aria-label={`${t('BILLING.LINE_QTY')} ${j + 1}`}
                            value={l.quantity}
                            onChange={(e) => updateLine(s.id, l.id, { quantity: e.target.value })}
                          />
                          <RichField
                            id={`line-${l.id}`}
                            label={`${t('BILLING.LINE_TEXT')} ${j + 1}`}
                            value={l.text}
                            onChange={(text) => updateLine(s.id, l.id, { text })}
                          />
                          <input
                            className="input"
                            inputMode="decimal"
                            aria-label={`${t('BILLING.LINE_AMOUNT')} ${j + 1}`}
                            value={l.amount}
                            onChange={(e) => updateLine(s.id, l.id, { amount: e.target.value })}
                          />
                          <button
                            type="button"
                            className="icon-btn icon-btn--danger"
                            aria-label={`${t('BILLING.REMOVE_LINE')} ${j + 1}`}
                            onClick={() =>
                              updateSection(s.id, { lines: s.lines.filter((x) => x.id !== l.id) })
                            }
                          >
                            <IconClose size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn--quiet btn--sm"
                        onClick={() => updateSection(s.id, { lines: [...s.lines, emptyLine()] })}
                      >
                        <IconPlus size={16} /> {t('BILLING.ADD_LINE')}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
            <button type="button" className="btn btn--ghost btn--sm" onClick={addSection}>
              <IconPlus size={16} /> {t('BILLING.ADD_ITEM')}
            </button>
          </Panel>

          <Panel title={t('BILLING.TAXES')}>
            <div className="form-grid form-grid--3">
              <div className="field">
                <label className="field__label" htmlFor="doc-iva">
                  {t('BILLING.IVA')}
                </label>
                <input
                  id="doc-iva"
                  className="input"
                  inputMode="decimal"
                  value={doc.iva_rate}
                  disabled={doc.totals_style === 'base'}
                  onChange={(e) => update({ iva_rate: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="doc-irpf">
                  {t('BILLING.IRPF')}
                </label>
                <input
                  id="doc-irpf"
                  className="input"
                  inputMode="decimal"
                  value={doc.irpf_rate}
                  disabled={doc.totals_style === 'base'}
                  onChange={(e) => update({ irpf_rate: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="doc-totals">
                  {t('BILLING.TOTALS_STYLE')}
                </label>
                <select
                  id="doc-totals"
                  className="input select"
                  value={doc.totals_style}
                  onChange={(e) =>
                    update({ totals_style: e.target.value as BillingDocument['totals_style'] })
                  }
                >
                  <option value="table">{t('BILLING.TOTALS_table')}</option>
                  {!isInvoice && <option value="summary">{t('BILLING.TOTALS_summary')}</option>}
                  <option value="base">{t('BILLING.TOTALS_base')}</option>
                </select>
              </div>
            </div>
            {totals && (
              <dl className="doc-totals tabular">
                <div>
                  <dt>{t('BILLING.BASE')}</dt>
                  <dd>{formatMoney(totals.base)}</dd>
                </div>
                {doc.totals_style !== 'base' && (
                  <div>
                    <dt>{t('BILLING.IVA_AMOUNT')}</dt>
                    <dd>+ {formatMoney(totals.iva)}</dd>
                  </div>
                )}
                {doc.totals_style === 'table' && (
                  <div>
                    <dt>{t('BILLING.IRPF_AMOUNT')}</dt>
                    <dd>- {formatMoney(totals.irpf)}</dd>
                  </div>
                )}
                <div className="doc-totals__total">
                  <dt>{t('BILLING.TOTAL_AMOUNT')}</dt>
                  <dd>{formatMoney(totals.total)}</dd>
                </div>
              </dl>
            )}
          </Panel>

          <Panel title={t('BILLING.TEXTS')}>
            {isInvoice ? (
              <div className="field">
                <label className="field__label" htmlFor="doc-payment">
                  {t('BILLING.PAYMENT')}
                </label>
                <RichField
                  id="doc-payment"
                  label={t('BILLING.PAYMENT')}
                  value={doc.payment_text}
                  onChange={(payment_text) => update({ payment_text })}
                  defaultBold
                />
              </div>
            ) : (
              <>
                <div className="field">
                  <label className="field__label" htmlFor="doc-auth">
                    {t('BILLING.AUTHORIZATION')}
                  </label>
                  <RichField
                    id="doc-auth"
                    label={t('BILLING.AUTHORIZATION')}
                    multiline
                    rows={3}
                    value={doc.authorization_text}
                    onChange={(authorization_text) => update({ authorization_text })}
                  />
                  <span className="field__hint">{t('BILLING.AUTHORIZATION_HINT')}</span>
                </div>
                <div className="pick-row">
                  <div className="field">
                    <label className="field__label" htmlFor="doc-cond-pick">
                      {t('BILLING.PICK_CONDITION')}
                    </label>
                    <select
                      id="doc-cond-pick"
                      className="input select"
                      value={conditions.find((c) => c.text === doc.conditions_text)?.id ?? ''}
                      onChange={(e) => {
                        const c = conditions.find((x) => x.id === Number(e.target.value));
                        update({ conditions_text: c ? c.text : '' });
                      }}
                    >
                      <option value="">{t('BILLING.PICK_CONDITION_NONE')}</option>
                      {conditions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="btn btn--quiet"
                    onClick={() => setConditionDialog(true)}
                  >
                    <IconPlus size={16} /> {t('BILLING.NEW_CONDITION')}
                  </button>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="doc-cond">
                    {t('BILLING.CONDITIONS')}
                  </label>
                  <RichField
                    id="doc-cond"
                    label={t('BILLING.CONDITIONS')}
                    multiline
                    rows={6}
                    value={doc.conditions_text}
                    onChange={(conditions_text) => update({ conditions_text })}
                  />
                  <span className="field__hint">{t('BILLING.CONDITIONS_EDIT_HINT')}</span>
                </div>
              </>
            )}
          </Panel>
        </form>

        <aside className="doc-preview" aria-label={t('BILLING.PREVIEW')}>
          <div className="doc-preview__bar">
            <span>{t('BILLING.PREVIEW')}</span>
            {preview.state === 'working' && (
              <span className="doc-preview__status">
                <Spinner size={14} /> {t('BILLING.GENERATING')}
              </span>
            )}
            {preview.state === 'error' && (
              <span className="doc-preview__status">{t('BILLING.PREVIEW_FAILED')}</span>
            )}
          </div>
          {preview.url ? (
            <iframe
              className="doc-preview__sheet"
              title={t('BILLING.PREVIEW')}
              src={`${preview.url}#toolbar=0&navpanes=0&view=FitH`}
            />
          ) : (
            <div className="doc-preview__sheet skeleton" />
          )}
        </aside>
      </div>

      <ClientDialog
        open={clientDialog !== null}
        client={clientDialog === 'edit' ? clients.find((c) => c.id === doc.client) || null : null}
        onClose={() => setClientDialog(null)}
        onSaved={onClientSaved}
      />
      <ConditionDialog
        open={conditionDialog}
        onClose={() => setConditionDialog(false)}
        onSaved={onConditionSaved}
      />
    </div>
  );
}

export default DocumentEditor;
