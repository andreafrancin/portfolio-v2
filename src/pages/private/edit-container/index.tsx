import { useEffect, useMemo, useState } from 'react';
import './index.scss';
import Button from '../../../components/button';
import { fetchProjectsFromNewAPI } from '../../../services/work/api-request';
import EditProjectsContainer from './projects';

type Tab = 'Projects' | 'About' | 'Contact';

const EditContainer = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Projects');

  const tabs: Tab[] = ['Projects', 'About', 'Contact'];

  const ActiveTab = () => {
    switch (activeTab) {
      case tabs[0]:
        return <EditProjectsContainer />;
      case tabs[1]:
        return <div />;
      case tabs[2]:
        return <div />;
      default:
        return <div />;
    }
  };

  return (
    <div className="edit-container">
      <ul className="edit-tabs-container">
        {tabs.map((tab) => (
          <li key={tab} className="edit-tabs-list-element">
            <button
              className={`edit-tab-list-button ${activeTab === tab ? 'edit-tab-list-button-selected' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>
      <ActiveTab />
    </div>
  );
};

export default EditContainer;
