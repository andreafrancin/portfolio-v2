import { useCallback, useEffect, useState } from 'react';
import './index.scss';
import { fetchAboutFromAPI } from '../../services/about/api-request';
import rehypeSanitize from 'rehype-sanitize';
import MDEditor from '@uiw/react-md-editor';
import { useLang } from '../../context/lang-context';

function About() {
  const [aboutData, setAboutData] = useState<any>(null);
  const { lang } = useLang();

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = useCallback(async () => {
    const response = await fetchAboutFromAPI();
    setAboutData(response);
  }, []);

  return (
    <div className="about-container">
      <div className="about-image-container">
        <div className="about-image-content">
          <img src={aboutData?.[0]?.image_url} className="about-img" loading="lazy" />
        </div>
      </div>
      <div className="about-content-container">
        {aboutData && !!aboutData?.[0]?.content_i18n?.[lang] && (
          <div className="markdown-viewer-container" data-color-mode="light">
            <MDEditor.Markdown
              source={aboutData?.[0]?.content_i18n?.[lang]?.md}
              rehypePlugins={[[rehypeSanitize]]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default About;
