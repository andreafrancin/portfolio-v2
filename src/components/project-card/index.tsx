import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../context/lang-context';
import { projectCategories, useCategories } from '../../config/categories';
import { coverImage, Project, projectTitle } from '../../lib/project';
import ProgressiveImage from '../progressive-image';
import { IconArrowRight, IconSparkle } from '../icons';
import './index.scss';

interface ProjectCardProps {
  item: Project;
  number: number;
}

function ProjectCard({ item }: ProjectCardProps) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const cover = coverImage(item);
  const title = projectTitle(item, lang);
  useCategories();
  const cats = projectCategories(item);
  const lead = cats[0];

  return (
    <Link
      to={`/work/${item.id}`}
      className="plate"
      onTouchStart={() => {}}
      aria-label={title}
      style={
        {
          '--plate-ink': lead?.ink || 'var(--accent)',
          '--plate-on': lead?.onInk || '#fff',
        } as React.CSSProperties
      }
    >
      <div className="plate__frame">
        <span className="plate__stars" aria-hidden="true">
          <IconSparkle size={18} />
          <IconSparkle size={11} />
          <IconSparkle size={14} />
        </span>
        <div className="plate__media">
          {cover ? (
            <ProgressiveImage
              low={cover.image_low_url}
              src={cover.image_url}
              alt={title}
              className="plate__img"
            />
          ) : (
            <div className="plate__empty" />
          )}
        </div>
        <span className="plate__veil" aria-hidden="true">
          <span className="plate__veil-title">{title}</span>
          <span className="plate__veil-cta">
            {t('WORK.VIEW')} <IconArrowRight size={16} />
          </span>
        </span>
      </div>
    </Link>
  );
}

export default ProjectCard;
