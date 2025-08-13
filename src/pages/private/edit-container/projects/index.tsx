import { useEffect, useState, useRef, useCallback } from 'react';
import './index.scss';
import {
  fetchProjectsFromNewAPI,
  fetchRemoveProjectFromAPI,
  fetchReorderProjectsFromNewAPI,
} from '../../../../services/work/api-request';
import DragAndDropIcon from '../../../../components/icons/icon-drag';
import Button from '../../../../components/button';
import { useNavigate } from 'react-router-dom';

interface ProjectData {
  id: number;
  title: string;
  description: any;
  order: number;
}

const EditProjectsContainer = () => {
  const [data, setData] = useState<ProjectData[] | null>(null);
  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const response = await fetchProjectsFromNewAPI();
    const sorted = response.sort((a: any, b: any) => a.order - b.order);
    setData(sorted);
  };

  const handleDragStart = (index: number) => {
    dragItemIndex.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItemIndex.current = index;
  };

  const handleDragEnd = () => {
    const fromIndex = dragItemIndex.current;
    const toIndex = dragOverItemIndex.current;

    if (fromIndex === null || toIndex === null || fromIndex === toIndex || !data) {
      dragItemIndex.current = null;
      dragOverItemIndex.current = null;
      return;
    }

    const updatedData = [...data];
    const draggedItem = updatedData.splice(fromIndex, 1)[0];
    updatedData.splice(toIndex, 0, draggedItem);

    const reordered = updatedData.map((item, index) => ({
      ...item,
      order: index,
    }));

    setData(reordered);

    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  const fetchReorderProjects = useCallback(async () => {
    const order = data?.map((item) => item.id);
    await fetchReorderProjectsFromNewAPI({
      order: order,
    });
  }, [data]);

  const handleRemoveProject = async (id: number) => {
    await fetchRemoveProjectFromAPI(id);
    await fetchProjects();
  };

  const handleClickAddProject = () => {
    navigate('/private/add-project');
  };

  const handleEditProject = (id: number) => {
    navigate(`/private/edit-project/${id}`, {
      state: { id },
    });
  };

  return (
    <div className="edit-projects-container">
      <div className="edit-projects-buttons-container">
        <Button onClick={handleClickAddProject}>Add project</Button>
        <Button type="submit" onClick={fetchReorderProjects}>
          Save projects
        </Button>
      </div>
      {data?.map((item, index) => (
        <div
          key={item.title + item.order}
          className="edit-project-list-item"
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragEnter={() => handleDragEnter(index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="project-title-container">
            <div className="edit-project-drag-icon-container">
              <DragAndDropIcon />
            </div>
            <p className="project-title">{item.title}</p>
          </div>
          <div className="edit-project-item-actions-container">
            <button
              className="edit-project-item-action-button-edit"
              onClick={() => handleEditProject(item.id)}
            >
              Edit
            </button>
            <button
              className="edit-project-item-action-button-remove"
              onClick={() => handleRemoveProject(item.id)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EditProjectsContainer;
