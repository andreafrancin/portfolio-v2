import { useCallback, useEffect, useState } from 'react';
import './index.scss';
import { fetchAboutFromAPI } from '../../services/about/api-request';
import rehypeSanitize from 'rehype-sanitize';
import MDEditor from '@uiw/react-md-editor';
import { useLang } from '../../context/lang-context';
import Spinner from '../../components/spinner';
import useProgressiveImg from '../../hooks/useProgressiveImg';

function AboutCoverImage({ image }: { image: any }) {
  const [src, { blur }] = useProgressiveImg(image.image_low_url, image.image_url);
  return (
    <img
      src={src}
      alt={image.caption}
      className="about-img"
      style={{
        filter: blur ? 'blur(20px)' : 'none',
        transition: blur ? 'none' : 'filter 0.5s ease-out',
      }}
    />
  );
}

function About() {
  const [aboutData, setAboutData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { lang } = useLang();

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = useCallback(async () => {
    setLoading(true);
    const response = await fetchAboutFromAPI();
    setAboutData(response);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="about-container">
        <div className="loading-spinner-container">
          <Spinner />
        </div>
      </div>
    );
  }

  const record = aboutData?.[0];
  const images = record?.images || [];
  const legacyImageUrl = record?.image_url;
  const coverImage = images.find((img: any) => img.is_cover) || images[0];

  return (
    <div className="about-container">
      <div className="about-image-container">
        <div className="about-image-content">
          {coverImage ? (
            <AboutCoverImage image={coverImage} />
          ) : legacyImageUrl ? (
            <img src={legacyImageUrl} className="about-img" loading="lazy" />
          ) : null}
        </div>
      </div>
      <div className="about-content-container">
        {record && !!record.content_i18n?.[lang] && (
          <div className="markdown-viewer-container" data-color-mode="light">
            <MDEditor.Markdown
              source={record.content_i18n[lang]?.md}
              rehypePlugins={[[rehypeSanitize]]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default About;
