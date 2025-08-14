import { useEffect, useState } from 'react';
import { fetchProjectsFromAPI, fetchProjectsFromNewAPI } from '../../services/work/api-request';
import './index.scss';
import Spinner from '../../components/spinner';
import { Link, useNavigate } from 'react-router-dom';

interface WorkProps {}

function Work(props: WorkProps) {
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const response = await fetchProjectsFromNewAPI();
    console.log('response: ', response);
    setData(response);
  };

  if (!data || !data?.length) {
    return (
      <div className="loading-spinner-container">
        <Spinner />
      </div>
    );
  }

  const handleNavigateToProject = (id: number) => {
    navigate(`/work/${id}`, {
      state: { id },
    });
  };

  return (
    <div className="work-container">
      <ul className="work-list-container">
        {data.map((item: any) => {
          return (
            <li className="work-list-element" key={item.id}>
              <div
                className="work-link"
                style={{
                  backgroundImage: `url(${item?.images?.[0]?.image_url})`,
                }}
                onClick={() => handleNavigateToProject(item.id)}
              />
              <div className="work-link-title">{item?.title}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Work;
