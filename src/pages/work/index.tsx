import { useEffect, useState } from 'react';
import { fetchProjectsFromAPI } from '../../services/work/api-request';
import './index.scss';
import Spinner from '../../components/spinner';
import { Link } from 'react-router-dom';

interface WorkProps {}

function Work(props: WorkProps) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const response = await fetchProjectsFromAPI();
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
              <Link
                to={`/work/${item.id}`}
                className="work-link"
                style={{
                  backgroundImage: `url(${item?.image_resources?.[0]?.image_url})`,
                }}
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
