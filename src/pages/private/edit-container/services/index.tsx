import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../../../context/lang-context';
import type {
  I18nText,
  ServiceGroup,
  ServiceItem,
} from '../../../../services/service-catalog/api-request';
import {
  createService,
  createServiceGroup,
  deleteService,
  deleteServiceGroup,
  fetchServiceGroups,
  pickText,
  reorderServiceGroups,
  reorderServices,
  updateService,
  updateServiceGroup,
} from '../../../../services/service-catalog/api-request';
import { useToast } from '../../../../components/toast';
import LanguageBar from '../../../../components/language-bar';
import { ConfirmDialog } from '../../../../components/studio';
import Spinner from '../../../../components/spinner';
import {
  IconChevronDown,
  IconChevronUp,
  IconEdit,
  IconPlus,
  IconTrash,
} from '../../../../components/icons';
import '../../billing/list.scss';
import './index.scss';

const LANGS = ['es', 'ca', 'en'] as const;
const EMPTY: Record<string, string> = { es: '', ca: '', en: '' };

type Editing =
  | { kind: 'group'; group: ServiceGroup | null }
  | { kind: 'service'; groupId: number; service: ServiceItem | null };

type Removing = { kind: 'group'; group: ServiceGroup } | { kind: 'service'; service: ServiceItem };

function swap<T>(list: T[], index: number, delta: number): T[] | null {
  const to = index + delta;
  if (to < 0 || to >= list.length) return null;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

function ServiceDialog({
  editing,
  onClose,
  onSaved,
}: {
  editing: Editing | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const ref = useRef<HTMLDialogElement>(null);
  const [names, setNames] = useState<Record<string, string>>(EMPTY);
  const [descriptions, setDescriptions] = useState<Record<string, string>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState<string>('es');
  const isService = editing?.kind === 'service';

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (editing && !dialog.open) dialog.showModal();
    if (!editing && dialog.open) dialog.close();
    if (!editing) return;
    setLanguage('es');
    const item = editing.kind === 'group' ? editing.group : editing.service;
    setNames({ ...EMPTY, ...(item?.name_i18n || {}) });
    setDescriptions({
      ...EMPTY,
      ...(editing.kind === 'service' ? editing.service?.description_i18n || {} : {}),
    });
  }, [editing]);

  const canSave = LANGS.some((l) => names[l]?.trim());
  const hasDescriptions = LANGS.some((l) => descriptions[l]?.trim());
  const written = Object.fromEntries(
    LANGS.map((l) => [
      l,
      !!names[l]?.trim() && (!isService || !hasDescriptions || !!descriptions[l]?.trim()),
    ])
  );

  const submit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const name_i18n = names as I18nText;
      if (editing.kind === 'group') {
        if (editing.group) await updateServiceGroup(editing.group.id, { name_i18n });
        else await createServiceGroup({ name_i18n });
      } else {
        const body = {
          group: editing.groupId,
          name_i18n,
          description_i18n: descriptions as I18nText,
        };
        if (editing.service) await updateService(editing.service.id, body);
        else await createService(body);
      }
      toast.success(t(isService ? 'PRIVATE.SERVICE_SAVED' : 'PRIVATE.SERVICE_GROUP_SAVED'));
      onSaved();
    } catch {
      toast.error(t('PRIVATE.SAVE_FAILED'));
    } finally {
      setSaving(false);
    }
  };

  const isNew = editing?.kind === 'group' ? !editing.group : !editing?.service;
  const title = isService
    ? t(isNew ? 'PRIVATE.NEW_SERVICE' : 'PRIVATE.EDIT_SERVICE')
    : t(isNew ? 'PRIVATE.NEW_SERVICE_GROUP' : 'PRIVATE.EDIT_SERVICE_GROUP');

  return (
    <dialog
      ref={ref}
      className="confirm form-dialog"
      aria-labelledby="service-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!saving) onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !saving) onClose();
      }}
    >
      <form
        className="confirm__sheet form-dialog__sheet"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave && !saving) submit();
        }}
        noValidate
      >
        <h2 id="service-dialog-title" className="confirm__title">
          {title}
        </h2>
        <div className="form-dialog__body">
          <LanguageBar
            className="language-bar--inline"
            selectedLanguage={language}
            onLanguageChange={setLanguage}
            written={written}
          />
          <div className="field">
            <label className="field__label" htmlFor="service-name">
              {t('PRIVATE.SERVICE_NAME')}
            </label>
            <input
              key={`name-${language}`}
              id="service-name"
              className="input"
              lang={language}
              value={names[language] || ''}
              autoFocus
              onChange={(e) => setNames((n) => ({ ...n, [language]: e.target.value }))}
            />
          </div>
          {isService && (
            <div className="field">
              <label className="field__label" htmlFor="service-description">
                {t('PRIVATE.DESCRIPTION')}
              </label>
              <textarea
                id="service-description"
                className="input"
                rows={5}
                lang={language}
                value={descriptions[language] || ''}
                onChange={(e) => setDescriptions((d) => ({ ...d, [language]: e.target.value }))}
              />
            </div>
          )}
        </div>
        <div className="confirm__actions">
          <button type="button" className="btn btn--quiet" onClick={onClose} disabled={saving}>
            {t('PRIVATE.CANCEL')}
          </button>
          <button type="submit" className="btn" disabled={!canSave || saving}>
            {saving && <Spinner size={16} />}
            {isNew ? t('PRIVATE.CREATE_SERVICE') : t('PRIVATE.SAVE_CHANGES')}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function RowActions({
  label,
  first,
  last,
  onMove,
  onEdit,
  onDelete,
}: {
  label: string;
  first: boolean;
  last: boolean;
  onMove: (delta: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="doc-row__actions">
      <button
        type="button"
        className="icon-btn"
        onClick={() => onMove(-1)}
        disabled={first}
        aria-label={`${t('PRIVATE.MOVE_UP')}: ${label}`}
        title={t('PRIVATE.MOVE_UP')}
      >
        <IconChevronUp size={18} />
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={() => onMove(1)}
        disabled={last}
        aria-label={`${t('PRIVATE.MOVE_DOWN')}: ${label}`}
        title={t('PRIVATE.MOVE_DOWN')}
      >
        <IconChevronDown size={18} />
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={onEdit}
        aria-label={`${t('PRIVATE.EDIT')}: ${label}`}
        title={t('PRIVATE.EDIT')}
      >
        <IconEdit size={18} />
      </button>
      <button
        type="button"
        className="icon-btn icon-btn--danger"
        onClick={onDelete}
        aria-label={`${t('PRIVATE.DELETE')}: ${label}`}
        title={t('PRIVATE.DELETE')}
      >
        <IconTrash size={18} />
      </button>
    </div>
  );
}

// A language counts as written when the name is there, and the description too if any language has one.
function Languages({ text, extra }: { text: I18nText; extra?: I18nText }) {
  const { t } = useTranslation();
  const needsExtra = !!extra && LANGS.some((l) => extra[l]?.trim());
  return (
    <span className="condition-languages">
      {LANGS.map((l) => {
        const written = !!text[l]?.trim() && (!needsExtra || !!extra?.[l]?.trim());
        return (
          <span
            key={l}
            className="condition-languages__item"
            data-written={written}
            title={written ? t('ADMIN.LANGUAGE_WRITTEN') : t('ADMIN.LANGUAGE_EMPTY')}
          >
            {l.toUpperCase()}
          </span>
        );
      })}
    </span>
  );
}

function EditServicesContainer() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const toast = useToast();
  const [groups, setGroups] = useState<ServiceGroup[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [removing, setRemoving] = useState<Removing | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      setGroups(await fetchServiceGroups());
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const moveGroup = async (index: number, delta: number) => {
    if (!groups) return;
    const next = swap(groups, index, delta);
    if (!next) return;
    const previous = groups;
    setGroups(next);
    try {
      await reorderServiceGroups(next.map((g) => g.id));
    } catch {
      setGroups(previous);
      toast.error(t('PRIVATE.ORDER_FAILED'));
    }
  };

  const moveService = async (groupId: number, index: number, delta: number) => {
    if (!groups) return;
    const group = groups.find((g) => g.id === groupId);
    const services = group && swap(group.services, index, delta);
    if (!services) return;
    const previous = groups;
    setGroups(groups.map((g) => (g.id === groupId ? { ...g, services } : g)));
    try {
      await reorderServices(services.map((s) => s.id));
    } catch {
      setGroups(previous);
      toast.error(t('PRIVATE.ORDER_FAILED'));
    }
  };

  const confirmDelete = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      if (removing.kind === 'group') await deleteServiceGroup(removing.group.id);
      else await deleteService(removing.service.id);
      await load();
      toast.success(t('PRIVATE.SERVICE_DELETED'));
      setRemoving(null);
    } catch {
      toast.error(t('PRIVATE.DELETE_FAILED'));
    } finally {
      setBusy(false);
    }
  };

  if (failed) {
    return (
      <div className="admin-state">
        <p>{t('PRIVATE.LOAD_FAILED')}</p>
        <button type="button" className="btn btn--ghost" onClick={load}>
          {t('PRIVATE.RETRY')}
        </button>
      </div>
    );
  }

  if (!groups) {
    return <div className="skeleton" style={{ height: 320, maxWidth: 760 }} />;
  }

  const removingName =
    removing &&
    pickText(
      removing.kind === 'group' ? removing.group.name_i18n : removing.service.name_i18n,
      lang
    );

  return (
    <div className="billing-list">
      <div className="billing-list__toolbar">
        <p className="billing-list__intro">{t('PRIVATE.SERVICES_INTRO')}</p>
        <div className="billing-list__actions">
          <a className="btn btn--quiet" href="/services" target="_blank" rel="noreferrer">
            {t('PRIVATE.VIEW_LIVE')}
          </a>
          <button
            type="button"
            className="btn"
            onClick={() => setEditing({ kind: 'group', group: null })}
          >
            <IconPlus size={18} /> {t('PRIVATE.NEW_SERVICE_GROUP')}
          </button>
        </div>
      </div>

      {groups.length === 0 && <p className="service-admin__empty">{t('PRIVATE.NO_SERVICES')}</p>}

      <div className="service-admin">
        {groups.map((group, gi) => {
          const groupName = pickText(group.name_i18n, lang);
          return (
            <section key={group.id} className="service-admin__group">
              <header className="service-admin__head">
                <span className="service-admin__index" aria-hidden="true">
                  {String(gi + 1).padStart(2, '0')}
                </span>
                <h2 className="service-admin__title">{groupName}</h2>
                <span className="service-admin__meta">
                  {t('SERVICES.COUNT', { count: group.services.length })}
                  <Languages text={group.name_i18n} />
                </span>
                <RowActions
                  label={groupName}
                  first={gi === 0}
                  last={gi === groups.length - 1}
                  onMove={(d) => moveGroup(gi, d)}
                  onEdit={() => setEditing({ kind: 'group', group })}
                  onDelete={() => setRemoving({ kind: 'group', group })}
                />
              </header>

              {group.services.length > 0 && (
                <ol className="service-admin__list">
                  {group.services.map((service, si) => {
                    const name = pickText(service.name_i18n, lang);
                    const description = pickText(service.description_i18n, lang);
                    return (
                      <li key={service.id} className="service-admin__row">
                        <button
                          type="button"
                          className="service-admin__main"
                          onClick={() =>
                            setEditing({ kind: 'service', groupId: group.id, service })
                          }
                        >
                          <span className="service-admin__name">{name}</span>
                          {description && (
                            <span className="service-admin__description">{description}</span>
                          )}
                        </button>
                        <span className="service-admin__langs">
                          <Languages text={service.name_i18n} extra={service.description_i18n} />
                        </span>
                        <RowActions
                          label={name}
                          first={si === 0}
                          last={si === group.services.length - 1}
                          onMove={(d) => moveService(group.id, si, d)}
                          onEdit={() => setEditing({ kind: 'service', groupId: group.id, service })}
                          onDelete={() => setRemoving({ kind: 'service', service })}
                        />
                      </li>
                    );
                  })}
                </ol>
              )}

              <button
                type="button"
                className="service-admin__add"
                onClick={() => setEditing({ kind: 'service', groupId: group.id, service: null })}
              >
                <IconPlus size={16} /> {t('PRIVATE.ADD_SERVICE')}
              </button>
            </section>
          );
        })}
      </div>

      <ServiceDialog
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
      <ConfirmDialog
        open={!!removing}
        title={t(
          removing?.kind === 'group'
            ? 'PRIVATE.DELETE_SERVICE_GROUP_TITLE'
            : 'PRIVATE.DELETE_SERVICE_TITLE'
        )}
        confirmLabel={t('PRIVATE.DELETE')}
        cancelLabel={t('PRIVATE.CANCEL')}
        onConfirm={confirmDelete}
        onCancel={() => !busy && setRemoving(null)}
        busy={busy}
      >
        <p>
          {removing &&
            t(
              removing.kind === 'group'
                ? 'PRIVATE.DELETE_SERVICE_GROUP_TEXT'
                : 'PRIVATE.DELETE_SERVICE_TEXT',
              {
                name: removingName,
                count: removing.kind === 'group' ? removing.group.services.length : 0,
              }
            )}
        </p>
      </ConfirmDialog>
    </div>
  );
}

export default EditServicesContainer;
