import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import './index.scss';
import { useParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { fetchProjectFromNewAPI } from '../../../services/work/api-request';
import { useLang } from '../../../context/lang-context';
import Spinner from '../../../components/spinner';

function ProjectDetail() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { lang } = useLang();
  const { id } = useParams();

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = useCallback(async () => {
    if (id) {
      setLoading(true);
      const response = await fetchProjectFromNewAPI(Number(id));
      setData(response);
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="project-container">
        <div className="loading-spinner-container">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="project-container">
      <h1>{data?.title_i18n?.[lang]}</h1>
      {data && !!data?.content_i18n?.[lang] && (
        <div className="markdown-viewer-container" data-color-mode="light">
          <MDEditor.Markdown
            source={data?.content_i18n?.[lang]?.md}
            rehypePlugins={[[rehypeSanitize]]}
          />
        </div>
      )}
    </div>
  );
}

export default ProjectDetail;
