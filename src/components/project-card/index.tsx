import React from 'react';
import { useNavigate } from 'react-router-dom';
import useProgressiveImg from '../../hooks/useProgressiveImg';
import './index.scss';

interface ProjectCardProps {
  item: any;
}

function ProjectCard({ item }: ProjectCardProps) {
  const navigate = useNavigate();
  const [src, { blur }] = useProgressiveImg(
    item?.images?.[0]?.image_low_url,
    item?.images?.[0]?.image_url
  );

  const handleNavigateToProject = (id: number) => {
    navigate(`/work/${id}`, {
      state: { id },
    });
  };

  return (
    <>
      <div className="work-link" onClick={() => handleNavigateToProject(item.id)}>
        <img
          className="work-link-image"
          src={src}
          loading="lazy"
          style={{
            filter: blur ? 'blur(20px)' : 'none',
            transition: blur
              ? 'transform 0.2s ease-in-out'
              : 'transform 0.2s ease-in-out, filter 0.5s ease-out',
          }}
        />
      </div>
      <div className="work-link-title">{item?.title}</div>
    </>
  );
}

export default ProjectCard;
