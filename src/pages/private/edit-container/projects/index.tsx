import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  fetchPatchProjectFromAPI,
  fetchProjectsFromNewAPI,
  fetchRemoveProjectFromAPI,
  fetchReorderProjectsFromNewAPI,
} from '../../../../services/work/api-request';
import { useToast } from '../../../../components/toast';
import { ConfirmDialog } from '../../../../components/studio';
import {
  IconEdit,
  IconEye,
  IconEyeOff,
  IconGrip,
  IconPlus,
  IconSearch,
  IconTrash,
  IconClose,
} from '../../../../components/icons';
import Spinner from '../../../../components/spinner';
import ProgressiveImage from '../../../../components/progressive-image';
import { projectCategories, useCategories, useCategoryLabel } from '../../../../config/categories';
import { coverImage, padNumber, Project, projectTitle } from '../../../../lib/project';
import { invalidateProjects } from '../../../../lib/projects-cache';
import { useLang } from '../../../../context/lang-context';
import useSortable, { moveItem } from '../../../../hooks/useSortable';
import BulkCategoriesDialog from './bulk-categories';
import './index.scss';

type Filter = string;
type Status = 'loading' | 'ready' | 'error';

const EditProjectsContainer = () => {
  const { t } = useTranslation();
  const { lang } = useLang();
  const categories = useCategories();
  const catLabel = useCategoryLabel();
  const toast = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState<Project[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [pendingVisibility, setPendingVisibility] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);

  const stopSelecting = useCallback(() => {
    setSelecting(false);
    setSelected(new Set());
  }, []);

  useEffect(() => {
    if (!selecting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !bulkOpen) stopSelecting();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selecting, bulkOpen, stopSelecting]);

  const dataRef = useRef<Project[]>([]);
  dataRef.current = data;
  const committedOrder = useRef<Project[]>([]);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response: Project[] = await fetchProjectsFromNewAPI();
      const sorted = [...response].sort((a, b) => a.order - b.order);
      committedOrder.current = sorted;
      setData(sorted);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const titleOf = useCallback(
    (p: Project) => projectTitle(p, lang) || t('PRIVATE.UNTITLED'),
    [lang, t]
  );

  const filtering = query.trim() !== '' || filter !== 'all';

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((p) => {
      if (filter === 'hidden' && !p.hidden) return false;
      if (filter === 'none' && projectCategories(p).length > 0) return false;
      if (
        filter !== 'all' &&
        filter !== 'hidden' &&
        filter !== 'none' &&
        !p.categories?.includes(filter)
      )
        return false;
      if (!q) return true;
      const titles = [p.title, ...Object.values(p.title_i18n || {})].join(' ').toLowerCase();
      return titles.includes(q);
    });
  }, [data, query, filter]);

  useEffect(() => {
    setSelected((current) => {
      const ids = new Set(data.map((p) => p.id));
      const next = new Set(Array.from(current).filter((id) => ids.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [data]);

  const selectedProjects = useMemo(() => data.filter((p) => selected.has(p.id)), [data, selected]);
  const visibleSelected = visible.filter((p) => selected.has(p.id)).length;
  const allVisibleSelected = visible.length > 0 && visibleSelected === visible.length;

  const toggleSelected = (id: number) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAllVisible = () =>
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visible.forEach((p) => next.delete(p.id));
      else visible.forEach((p) => next.add(p.id));
      return next;
    });

  const onBulkApplied = (result: Record<string, string[]>) => {
    setData((list) => list.map((p) => (result[p.id] ? { ...p, categories: result[p.id] } : p)));
    committedOrder.current = committedOrder.current.map((p) =>
      result[p.id] ? { ...p, categories: result[p.id] } : p
    );
    invalidateProjects();
    setBulkOpen(false);
    stopSelecting();
  };

  const saveOrder = async () => {
    const next = dataRef.current;
    const previous = committedOrder.current;
    if (next.map((p) => p.id).join() === previous.map((p) => p.id).join()) return;
    setSavingOrder(true);
    try {
      await fetchReorderProjectsFromNewAPI({ order: next.map((p) => p.id) });
      committedOrder.current = next;
      invalidateProjects();
      toast.success(t('PRIVATE.ORDER_SAVED'));
    } catch {
      setData(previous);
      toast.error(t('PRIVATE.ORDER_FAILED'));
    } finally {
      setSavingOrder(false);
    }
  };

  const sortable = useSortable<Project>({
    items: visible,
    getKey: (p) => String(p.id),
    getLabel: titleOf,
    disabled: filtering || status !== 'ready',
    onReorder: (from, to) => {
      const next = moveItem(dataRef.current, from, to);
      dataRef.current = next;
      setData(next);
    },
    onCommit: saveOrder,
    messages: {
      lifted: (title, pos, total) => t('PRIVATE.LIFTED', { title, pos, total }),
      moved: (title, pos, total) => t('PRIVATE.MOVED', { title, pos, total }),
      dropped: (title, pos, total) => t('PRIVATE.DROPPED', { title, pos, total }),
      cancelled: (title) => t('PRIVATE.CANCELLED', { title }),
    },
  });

  const toggleVisibility = async (project: Project) => {
    const hidden = !project.hidden;
    setPendingVisibility(project.id);
    setData((list) => list.map((p) => (p.id === project.id ? { ...p, hidden } : p)));
    try {
      await fetchPatchProjectFromAPI(project.id, { hidden });
      invalidateProjects();
      toast.success(
        t(hidden ? 'PRIVATE.NOW_HIDDEN' : 'PRIVATE.NOW_VISIBLE', { title: titleOf(project) })
      );
    } catch {
      setData((list) => list.map((p) => (p.id === project.id ? { ...p, hidden: !hidden } : p)));
      toast.error(t('PRIVATE.VISIBILITY_FAILED'));
    } finally {
      setPendingVisibility(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetchRemoveProjectFromAPI(deleteTarget.id);
      setData((list) => list.filter((p) => p.id !== deleteTarget.id));
      committedOrder.current = committedOrder.current.filter((p) => p.id !== deleteTarget.id);
      invalidateProjects();
      toast.success(t('PRIVATE.DELETED'));
      setDeleteTarget(null);
    } catch {
      toast.error(t('PRIVATE.DELETE_FAILED'));
    } finally {
      setDeleting(false);
    }
  };

  const filterOptions: { id: Filter; label: string; ink?: string }[] = [
    { id: 'all', label: t('PRIVATE.FILTER_ALL') },
    ...categories.map((c) => ({ id: c.slug as Filter, label: catLabel(c), ink: c.ink })),
    { id: 'none', label: t('PRIVATE.UNCATEGORISED') },
    { id: 'hidden', label: t('PRIVATE.FILTER_HIDDEN') },
  ];

  const countFor = (id: Filter) => {
    if (id === 'all') return data.length;
    if (id === 'hidden') return data.filter((p) => p.hidden).length;
    if (id === 'none') return data.filter((p) => projectCategories(p).length === 0).length;
    return data.filter((p) => p.categories?.includes(id)).length;
  };

  return (
    <div className="projects-admin">
      <div className="projects-admin__toolbar">
        <label className="search">
          <IconSearch size={18} />
          <span className="visually-hidden">{t('PRIVATE.SEARCH')}</span>
          <input
            type="search"
            className="search__input"
            placeholder={t('PRIVATE.SEARCH')}
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
        <button
          type="button"
          className="btn btn--quiet"
          aria-pressed={selecting}
          onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
          disabled={status !== 'ready' || data.length === 0}
        >
          {selecting ? t('PRIVATE.SELECT_MODE_DONE') : t('PRIVATE.SELECT_MODE')}
        </button>
        <button type="button" className="btn" onClick={() => navigate('/private/add-project')}>
          <IconPlus size={18} /> {t('PRIVATE.ADD_PROJECT')}
        </button>
      </div>

      <div className="admin-filters" role="group" aria-label={t('PRIVATE.CATEGORIES')}>
        {filterOptions.map((f) => (
          <button
            key={f.id}
            type="button"
            className="admin-filter"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.ink && (
              <span className="swatch" style={{ '--swatch': f.ink } as React.CSSProperties} />
            )}
            {f.id === 'hidden' && <IconEyeOff size={14} />}
            {f.label}
            <span className="admin-filter__count tabular">
              {status === 'ready' ? countFor(f.id) : ''}
            </span>
          </button>
        ))}
      </div>

      <div className="projects-admin__meta">
        <div className="projects-admin__count">
          {selecting && status === 'ready' && visible.length > 0 && (
            <label className="check">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                ref={(el) => {
                  if (el) el.indeterminate = visibleSelected > 0 && !allVisibleSelected;
                }}
                onChange={toggleAllVisible}
              />
              <span className="visually-hidden">{t('PRIVATE.SELECT_ALL')}</span>
            </label>
          )}
          <p className="tabular">
            {status === 'ready' && t('PRIVATE.COUNT', { count: visible.length })}
          </p>
        </div>
        <p className="projects-admin__hint">
          {savingOrder ? (
            <>
              <Spinner size={14} /> {t('PRIVATE.ORDER_SAVING')}
            </>
          ) : filtering ? (
            t('PRIVATE.REORDER_DISABLED')
          ) : (
            t('PRIVATE.REORDER_HINT')
          )}
        </p>
      </div>

      {status === 'loading' && (
        <ul className="project-rows" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="project-row project-row--skeleton">
              <div className="skeleton" />
            </li>
          ))}
        </ul>
      )}

      {status === 'error' && (
        <div className="admin-state">
          <p>{t('PRIVATE.LOAD_FAILED')}</p>
          <button type="button" className="btn btn--ghost" onClick={load}>
            {t('PRIVATE.RETRY')}
          </button>
        </div>
      )}

      {status === 'ready' && data.length === 0 && (
        <div className="admin-state">
          <p>{t('PRIVATE.EMPTY')}</p>
          <button type="button" className="btn" onClick={() => navigate('/private/add-project')}>
            <IconPlus size={18} /> {t('PRIVATE.ADD_PROJECT')}
          </button>
        </div>
      )}

      {status === 'ready' && data.length > 0 && visible.length === 0 && (
        <div className="admin-state">
          <p>{t('PRIVATE.NO_RESULTS')}</p>
        </div>
      )}

      {status === 'ready' && visible.length > 0 && (
        <ul
          className={`project-rows${filtering ? ' is-locked' : ''}${
            selecting ? ' project-rows--selecting' : ''
          }`}
          ref={sortable.containerRef as React.RefObject<HTMLUListElement>}
        >
          {visible.map((item, index) => {
            const title = titleOf(item);
            const cover = coverImage(item);
            const cats = projectCategories(item);
            const position = data.indexOf(item) + 1;
            return (
              <li
                key={item.id}
                className={`project-row${item.hidden ? ' is-hidden' : ''}${
                  selected.has(item.id) ? ' is-selected' : ''
                }`}
                {...sortable.getItemProps(String(item.id))}
              >
                {selecting && (
                  <label className="check project-row__select">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelected(item.id)}
                    />
                    <span className="visually-hidden">
                      {t('PRIVATE.SELECT_PROJECT', { title })}
                    </span>
                  </label>
                )}
                <button
                  type="button"
                  className="project-row__handle"
                  aria-label={t('PRIVATE.DRAG_HANDLE', { title })}
                  aria-describedby="reorder-hint"
                  disabled={filtering}
                  {...sortable.getHandleProps(index)}
                >
                  <IconGrip size={20} />
                </button>

                <span className="project-row__no tabular">{padNumber(position)}</span>

                <div className="project-row__thumb">
                  {cover && (
                    <ProgressiveImage src={cover.image_url} low={cover.image_low_url} alt="" />
                  )}
                </div>

                <div className="project-row__main">
                  <Link to={`/private/edit-project/${item.id}`} className="project-row__title">
                    {title}
                  </Link>
                  <div className="project-row__meta">
                    {cats.length > 0 ? (
                      cats.map((c) => (
                        <span key={c.slug} className="project-row__cat">
                          <span
                            className="swatch"
                            style={{ '--swatch': c.ink } as React.CSSProperties}
                          />
                          {catLabel(c)}
                        </span>
                      ))
                    ) : (
                      <span className="project-row__cat project-row__cat--none">
                        {t('PRIVATE.UNCATEGORISED')}
                      </span>
                    )}
                    <span className="project-row__count tabular">
                      {t('PRIVATE.IMAGE_COUNT', { count: item.images?.length || 0 })}
                    </span>
                    {item.hidden && (
                      <span className="project-row__hidden">
                        <IconEyeOff size={14} /> {t('PRIVATE.HIDDEN')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="project-row__actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => toggleVisibility(item)}
                    disabled={pendingVisibility === item.id}
                    aria-label={`${item.hidden ? t('PRIVATE.SHOW') : t('PRIVATE.HIDE')}: ${title}`}
                    title={item.hidden ? t('PRIVATE.SHOW') : t('PRIVATE.HIDE')}
                  >
                    {pendingVisibility === item.id ? (
                      <Spinner size={16} />
                    ) : item.hidden ? (
                      <IconEyeOff size={18} />
                    ) : (
                      <IconEye size={18} />
                    )}
                  </button>
                  <Link
                    to={`/private/edit-project/${item.id}`}
                    className="icon-btn"
                    aria-label={`${t('PRIVATE.EDIT')}: ${title}`}
                    title={t('PRIVATE.EDIT')}
                  >
                    <IconEdit size={18} />
                  </Link>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => setDeleteTarget(item)}
                    aria-label={`${t('PRIVATE.DELETE')}: ${title}`}
                    title={t('PRIVATE.DELETE')}
                  >
                    <IconTrash size={18} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {selecting && (
        <div className="bulk-bar" role="region" aria-label={t('PRIVATE.SELECTION')}>
          <span className="bulk-bar__count tabular">
            {selected.size > 0
              ? t('PRIVATE.SELECTED_COUNT', { count: selected.size })
              : t('PRIVATE.SELECT_PROMPT')}
          </span>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => setBulkOpen(true)}
            disabled={selected.size === 0}
          >
            {t('PRIVATE.BULK_OPEN')}
          </button>
          <button type="button" className="btn btn--quiet btn--sm" onClick={stopSelecting}>
            {t('PRIVATE.SELECT_MODE_DONE')}
          </button>
        </div>
      )}

      <BulkCategoriesDialog
        open={bulkOpen}
        projects={selectedProjects}
        categories={categories}
        onClose={() => setBulkOpen(false)}
        onApplied={onBulkApplied}
      />

      <p id="reorder-hint" className="visually-hidden">
        {t('PRIVATE.REORDER_HINT')}
      </p>
      <div className="visually-hidden" aria-live="assertive" aria-atomic="true">
        {sortable.announcement}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('PRIVATE.DELETE_TITLE')}
        confirmLabel={t('PRIVATE.CONFIRM_DELETE')}
        cancelLabel={t('PRIVATE.CANCEL')}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
        busy={deleting}
      >
        <p>{deleteTarget && t('PRIVATE.DELETE_TEXT', { title: titleOf(deleteTarget) })}</p>
      </ConfirmDialog>
    </div>
  );
};

export default EditProjectsContainer;
