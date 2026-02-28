import { useEffect, useState } from 'react';
import { fetchProjectsFromNewAPI } from '../../services/work/api-request';
import './index.scss';
import Spinner from '../../components/spinner';
import ProjectCard from '../../components/project-card';

function Work() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const response = await fetchProjectsFromNewAPI();
    setData(response);
    setLoading(false);
  };

  return (
    <div className="work-container">
      <h1 className="work-main-title">Andrea Francín</h1>
      {loading ? (
        <div className="loading-spinner-container">
          <Spinner />
        </div>
      ) : !data?.length ? (
        <p>No projects</p>
      ) : (
        <ul className="work-list-container">
          {data.filter((item: any) => !item.hidden).map((item: any) => (
            <li className="work-list-element" key={item.id}>
              <ProjectCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Work;
