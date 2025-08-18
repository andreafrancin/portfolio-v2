import { useContext, useEffect, useState } from 'react';
import { fetchProjectsFromNewAPI } from '../../services/work/api-request';
import './index.scss';
import Spinner from '../../components/spinner';
import ProjectCard from '../../components/project-card';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import { useTranslation } from 'react-i18next';

interface WorkProps {}

function Work({}: WorkProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const response = await fetchProjectsFromNewAPI();
    setData(response);
  };

  return (
    <div className="work-container">
      <h1 className="work-main-title">Andrea Francín</h1>
      {!data || !data?.length ? (
        <div className="loading-spinner-container">
          <Spinner />
        </div>
      ) : (
        <ul className="work-list-container">
          {data.map((item: any) => {
            return (
              <li className="work-list-element" key={item.id}>
                <ProjectCard item={item} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Work;
