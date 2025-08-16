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
  const { token } = useContext(AuthContext);
  const { t } = useTranslation();
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

  return (
    <div className="work-container">
      <ul className="work-list-container">
        {data.map((item: any) => {
          return (
            <li className="work-list-element" key={item.id}>
              <ProjectCard item={item} />
            </li>
          );
        })}
      </ul>

      <Link className="footer-login-button" to={token ? '/private' : '/login'}>
        {t('PRIVATE.PRIVATE_AREA_TITLE')}
      </Link>
    </div>
  );
}

export default Work;
