import { fetchAddProjectFromAPI } from '../../../../../services/work/api-request';
import { useCallback } from 'react';
import FormProject from '../form-project';
import { useNavigate } from 'react-router-dom';
import './index.scss';

function AddProject() {
  const navigate = useNavigate();

  const onFormSubmit = useCallback(async (data: any) => {
    await fetchAddProjectFromAPI(data);
    navigate('/private', {
      replace: true,
    });
  }, []);

  return (
    <div className="add-project-container">
      <h1>Add project</h1>
      <FormProject onFormSubmit={onFormSubmit} />
    </div>
  );
}

export default AddProject;
