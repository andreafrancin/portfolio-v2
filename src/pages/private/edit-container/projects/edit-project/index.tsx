import {
  fetchEditProjectFromAPI,
  fetchProjectFromNewAPI,
} from '../../../../../services/work/api-request';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FormProject from '../form-project';
import './index.scss';

function EditProject() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentData, setCurrentData] = useState(null);

  const { id } = location.state || {};

  useEffect(() => {
    fetchProject();
  }, []);

  const fetchProject = useCallback(async () => {
    if (!!id) {
      const response = await fetchProjectFromNewAPI(id);
      setCurrentData(response);
    }
  }, [id]);

  const onFormSubmit = useCallback(
    async (data: any) => {
      await fetchEditProjectFromAPI(id, data);
      navigate('/private', {
        replace: true,
      });
    },
    [id]
  );

  return (
    <div className="edit-project-container">
      <h1>Edit project</h1>
      <FormProject onFormSubmit={onFormSubmit} currentData={currentData} />
    </div>
  );
}

export default EditProject;
