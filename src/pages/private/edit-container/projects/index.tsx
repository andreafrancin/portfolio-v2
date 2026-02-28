import { useEffect, useState, useRef } from 'react';
import './index.scss';
import {
  fetchProjectsFromNewAPI,
  fetchRemoveProjectFromAPI,
  fetchReorderProjectsFromNewAPI,
} from '../../../../services/work/api-request';
import DragAndDropIcon from '../../../../components/icons/icon-drag';
import Button from '../../../../components/button';
import { useNavigate } from 'react-router-dom';
import TrashIcon from '../../../../components/icons/icon-trash';
import EditIcon from '../../../../components/icons/icon-edit';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../../components/toast';
import { useLoading } from '../../../../context/loading-context';

interface ProjectData {
  id: number;
  title: string;
  description: any;
  order: number;
  images: any;
  hidden: boolean;
}

const ITEM_HEIGHT = 80;
const ITEM_GAP = 20;
const ITEM_STRIDE = ITEM_HEIGHT + ITEM_GAP;
const SCROLL_ZONE = 80;
const MAX_SCROLL_SPEED = 12;

const EditProjectsContainer = () => {
  const [data, setData] = useState<ProjectData[] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectData | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const { showLoading, hideLoading } = useLoading();

  const itemEls = useRef<Map<number, HTMLDivElement>>(new Map());
  const dragSourceIndex = useRef<number | null>(null);
  const dragHoverIndex = useRef<number | null>(null);
  const isDragging = useRef(false);
  const scrollRafId = useRef<number | null>(null);
  const lastMouseY = useRef(0);
  const isSaving = useRef(false);
  const listOriginY = useRef(0);
  const dragOverHandlerRef = useRef<((e: DragEvent) => void) | null>(null);

  const dataRef = useRef<ProjectData[] | null>(null);
  dataRef.current = data;

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    return () => {
      if (scrollRafId.current !== null) {
        cancelAnimationFrame(scrollRafId.current);
      }
      if (dragOverHandlerRef.current) {
        document.removeEventListener('dragover', dragOverHandlerRef.current);
      }
    };
  }, []);

  const fetchProjects = async () => {
    showLoading();
    try {
      const response = await fetchProjectsFromNewAPI();
      const sorted = response.sort((a: any, b: any) => a.order - b.order);
      setData(sorted);
    } catch {
      toast.error('Failed to load projects');
      setData(null);
    } finally {
      hideLoading();
    }
  };

  const computeTranslateY = (
    itemIndex: number,
    source: number,
    hover: number,
  ): number => {
    if (itemIndex === source) {
      return (hover - source) * ITEM_STRIDE;
    }
    if (source < hover && itemIndex > source && itemIndex <= hover) {
      return -ITEM_STRIDE;
    }
    if (source > hover && itemIndex >= hover && itemIndex < source) {
      return ITEM_STRIDE;
    }
    return 0;
  };

  const applyTransforms = (source: number, hover: number) => {
    const currentData = dataRef.current;
    if (!currentData) return;
    currentData.forEach((item, i) => {
      const el = itemEls.current.get(item.id);
      if (!el) return;
      const ty = computeTranslateY(i, source, hover);
      el.style.transform = ty === 0 ? '' : `translateY(${ty}px)`;
    });
  };

  const getHoverIndexFromY = (clientY: number): number => {
    const currentData = dataRef.current;
    if (!currentData || currentData.length === 0) return 0;
    const pageY = clientY + window.scrollY;
    const rawIndex = Math.round(
      (pageY - listOriginY.current - ITEM_HEIGHT / 2) / ITEM_STRIDE,
    );
    return Math.max(0, Math.min(currentData.length - 1, rawIndex));
  };

  const startAutoScroll = () => {
    const tick = () => {
      if (!isDragging.current) return;
      const y = lastMouseY.current;
      const vh = window.innerHeight;

      if (y < SCROLL_ZONE) {
        const speed = ((SCROLL_ZONE - y) / SCROLL_ZONE) * MAX_SCROLL_SPEED;
        window.scrollBy(0, -speed);
      } else if (y > vh - SCROLL_ZONE) {
        const speed =
          ((y - (vh - SCROLL_ZONE)) / SCROLL_ZONE) * MAX_SCROLL_SPEED;
        window.scrollBy(0, speed);
      }

      scrollRafId.current = requestAnimationFrame(tick);
    };
    scrollRafId.current = requestAnimationFrame(tick);
  };

  const stopAutoScroll = () => {
    if (scrollRafId.current !== null) {
      cancelAnimationFrame(scrollRafId.current);
      scrollRafId.current = null;
    }
  };

  const fireAutoSave = async (
    reordered: ProjectData[],
    previousData: ProjectData[],
  ) => {
    if (isSaving.current) return;
    isSaving.current = true;
    showLoading();
    try {
      const order = reordered.map((item) => item.id);
      await fetchReorderProjectsFromNewAPI({ order });
    } catch {
      toast.error('Failed to save project order');
      setData(previousData);
    } finally {
      isSaving.current = false;
      hideLoading();
    }
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    const currentData = dataRef.current;
    dragSourceIndex.current = index;
    dragHoverIndex.current = index;
    isDragging.current = true;

    if (currentData && currentData.length > 0) {
      const firstEl = itemEls.current.get(currentData[0].id);
      if (firstEl) {
        listOriginY.current =
          firstEl.getBoundingClientRect().top + window.scrollY;
      }
    }

    const ghost = document.createElement('div');
    ghost.style.position = 'fixed';
    ghost.style.top = '-9999px';
    ghost.style.width = '1px';
    ghost.style.height = '1px';
    ghost.style.opacity = '0';
    document.body.appendChild(ghost);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(ghost, 0, 0);
    requestAnimationFrame(() => ghost.remove());

    if (currentData) {
      const el = itemEls.current.get(currentData[index].id);
      el?.classList.add('edit-project-list-item--dragging');
    }

    const handler = (ev: DragEvent) => {
      ev.preventDefault();
      lastMouseY.current = ev.clientY;
      if (dragSourceIndex.current === null) return;
      const newHover = getHoverIndexFromY(ev.clientY);
      if (newHover !== dragHoverIndex.current) {
        dragHoverIndex.current = newHover;
        applyTransforms(dragSourceIndex.current, newHover);
      }
    };
    dragOverHandlerRef.current = handler;
    document.addEventListener('dragover', handler);

    lastMouseY.current = e.clientY;
    startAutoScroll();
  };

  const handleDragEnd = () => {
    isDragging.current = false;
    stopAutoScroll();

    if (dragOverHandlerRef.current) {
      document.removeEventListener('dragover', dragOverHandlerRef.current);
      dragOverHandlerRef.current = null;
    }

    const currentData = dataRef.current;
    const source = dragSourceIndex.current;
    const hover = dragHoverIndex.current;

    if (currentData && source !== null) {
      const el = itemEls.current.get(currentData[source].id);
      el?.classList.remove('edit-project-list-item--dragging');
    }

    if (
      source === null ||
      hover === null ||
      source === hover ||
      !currentData
    ) {
      currentData?.forEach((item) => {
        const el = itemEls.current.get(item.id);
        if (el) el.style.transform = '';
      });
      dragSourceIndex.current = null;
      dragHoverIndex.current = null;
      return;
    }

    const previousData = currentData;

    currentData.forEach((item) => {
      const el = itemEls.current.get(item.id);
      if (el) {
        el.classList.add('edit-project-list-item--no-transition');
        el.style.transform = '';
      }
    });

    const updatedData = [...currentData];
    const draggedItem = updatedData.splice(source, 1)[0];
    updatedData.splice(hover, 0, draggedItem);
    const reordered = updatedData.map((item, i) => ({
      ...item,
      order: i,
    }));
    setData(reordered);

    requestAnimationFrame(() => {
      reordered.forEach((item) => {
        const el = itemEls.current.get(item.id);
        el?.classList.remove('edit-project-list-item--no-transition');
      });
    });

    fireAutoSave(reordered, previousData);

    dragSourceIndex.current = null;
    dragHoverIndex.current = null;
  };

  const handleRemoveProject = (project: ProjectData) => {
    setDeleteTarget(project);
  };

  const confirmDeleteProject = async () => {
    if (!deleteTarget) return;
    showLoading();
    try {
      await fetchRemoveProjectFromAPI(deleteTarget.id);
      toast.success('Project deleted');
      setDeleteTarget(null);
      hideLoading();
      await fetchProjects();
    } catch {
      toast.error('Failed to delete project');
      hideLoading();
    }
  };

  const handleClickAddProject = () => {
    navigate('/private/add-project');
  };

  const handleEditProject = (id: number) => {
    navigate(`/private/edit-project/${id}`, {
      state: { id },
    });
  };

  const setItemRef = (id: number) => (el: HTMLDivElement | null) => {
    if (el) {
      itemEls.current.set(id, el);
    } else {
      itemEls.current.delete(id);
    }
  };

  return (
    <div className="edit-projects-container">
      <div className="edit-projects-buttons-container">
        <Button onClick={handleClickAddProject}>
          {t('PRIVATE.ADD_PROJECT')}
        </Button>
      </div>
      {data?.map((item, index) => (
        <div
          key={item.id}
          ref={setItemRef(item.id)}
          className={`edit-project-list-item${item.hidden ? ' edit-project-list-item--hidden' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnd={handleDragEnd}
        >
          <div className="project-title-container">
            <div className="edit-project-drag-icon-container">
              <DragAndDropIcon />
            </div>
            <div className="project-image-container">
              <img
                className="project-image"
                src={
                  item.images?.find((img: any) => img.is_cover)?.image_url ||
                  item.images?.[0]?.image_url
                }
              ></img>
            </div>
            <p className="project-title">{item.title}</p>
            {item.hidden && (
              <span className="project-hidden-badge">Hidden</span>
            )}
          </div>
          <div className="edit-project-item-actions-container">
            <button
              className="edit-project-item-action-button-edit"
              onClick={() => handleEditProject(item.id)}
            >
              <EditIcon width={20} height={20} color="#FFF" />
            </button>
            <button
              className="edit-project-item-action-button-remove"
              onClick={() => handleRemoveProject(item)}
            >
              <TrashIcon width={20} height={20} color="#FFF" />
            </button>
          </div>
        </div>
      ))}

      {deleteTarget && (
        <div
          className="confirm-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="confirm-title">Delete project</h3>
            <p className="confirm-message">
              Are you sure you want to delete{' '}
              <strong>{deleteTarget.title}</strong>? This action cannot be
              undone.
            </p>
            <div className="confirm-actions">
              <button
                className="confirm-btn confirm-btn--cancel"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn confirm-btn--danger"
                onClick={confirmDeleteProject}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProjectsContainer;
