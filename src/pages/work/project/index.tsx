import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import './index.scss';
import { useLocation } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { fetchProjectFromNewAPI } from '../../../services/work/api-request';
import { useLang } from '../../../context/lang-context';

function ProjectDetail() {
  const [data, setData] = useState<any>(null);
  const [markdownContent, setMarkdownContent] = useState('');

  const { lang } = useLang();
  const location = useLocation();

  const { id } = location.state || {};

  useEffect(() => {
    fetchProject();
  }, []);

  const fetchProject = useCallback(async () => {
    if (!!id) {
      const response = await fetchProjectFromNewAPI(id);
      setData(response);
      console.log(response);
    }
  }, [id]);

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
