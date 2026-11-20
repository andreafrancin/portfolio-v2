import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StudioPageHeader } from '../../components/studio';

interface SectionPageProps {
  titleKey: string;
  introKey?: string;
  children: ReactNode;
}

function SectionPage({ titleKey, introKey, children }: SectionPageProps) {
  const { t } = useTranslation();

  return (
    <div className="studio">
      <StudioPageHeader title={t(titleKey)} intro={introKey ? t(introKey) : undefined} />
      {children}
    </div>
  );
}

export default SectionPage;
