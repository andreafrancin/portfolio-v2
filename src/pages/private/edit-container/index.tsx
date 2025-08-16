import { useCallback, useState } from 'react';
import './index.scss';
import EditProjectsContainer from './projects';
import { useTranslation } from 'react-i18next';
import EditContactContainer from './contact';
import EditAboutContainer from './about';

type Tab = 'PRIVATE.TABS.WORK' | 'PRIVATE.TABS.ABOUT' | 'PRIVATE.TABS.CONTACT';

const EditContainer = () => {
  const [activeTab, setActiveTab] = useState<Tab>('PRIVATE.TABS.WORK');

  const { t } = useTranslation();

  const tabs: Tab[] = ['PRIVATE.TABS.WORK', 'PRIVATE.TABS.ABOUT', 'PRIVATE.TABS.CONTACT'];

  const ActiveTab = useCallback(() => {
    switch (activeTab) {
      case tabs[0]:
        return <EditProjectsContainer />;
      case tabs[1]:
        return <EditAboutContainer />;
      case tabs[2]:
        return <EditContactContainer />;
      default:
        return <div />;
    }
  }, [activeTab]);

  return (
    <div className="edit-container">
      <ul className="edit-tabs-container">
        {tabs.map((tab) => (
          <li key={tab} className="edit-tabs-list-element">
            <button
              className={`edit-tab-list-button ${activeTab === tab ? 'edit-tab-list-button-selected' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {t(tab)}
            </button>
          </li>
        ))}
      </ul>
      <ActiveTab />
    </div>
  );
};

export default EditContainer;
