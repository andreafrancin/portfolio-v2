import { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EditProjectsContainer from './projects';
import EditContactContainer from './contact';
import EditAboutContainer from './about';
import EditCategoriesContainer from './categories';
import BillingList from '../billing/list';
import ClientsTab from '../billing/clients';
import ConditionsTab from '../billing/conditions';
import IssuerSettings from '../billing/issuer';
import './index.scss';

const TABS = [
  { id: 'work', label: 'PRIVATE.TABS.WORK' },
  { id: 'about', label: 'PRIVATE.TABS.ABOUT' },
  { id: 'contact', label: 'PRIVATE.TABS.CONTACT' },
  { id: 'categories', label: 'PRIVATE.TABS.CATEGORIES' },
  { id: 'quotes', label: 'BILLING.TABS_QUOTES' },
  { id: 'invoices', label: 'BILLING.TABS_INVOICES' },
  { id: 'clients', label: 'BILLING.TABS_CLIENTS' },
  { id: 'conditions', label: 'BILLING.TABS_CONDITIONS' },
  { id: 'issuer', label: 'BILLING.TABS_ISSUER' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const EditContainer = () => {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const raw = params.get('tab');
  const active: TabId = TABS.some((tab) => tab.id === raw) ? (raw as TabId) : 'work';

  const select = (id: TabId) => {
    const next = new URLSearchParams(params);
    if (id === 'work') next.delete('tab');
    else next.set('tab', id);
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length;
    if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    if (next >= 0) {
      e.preventDefault();
      select(TABS[next].id);
      tabRefs.current[next]?.focus();
    }
  };

  return (
    <div className="studio-tabs">
      <div
        className="studio-tabs__list"
        role="tablist"
        aria-label={t('PRIVATE.PRIVATE_AREA_TITLE')}
      >
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            id={`tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            className="studio-tabs__tab"
            onClick={() => select(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>
      <div
        key={active}
        id={`panel-${active}`}
        role="tabpanel"
        aria-labelledby={`tab-${active}`}
        className="studio-tabs__panel"
      >
        {active === 'work' && <EditProjectsContainer />}
        {active === 'about' && <EditAboutContainer />}
        {active === 'contact' && <EditContactContainer />}
        {active === 'categories' && <EditCategoriesContainer />}
        {active === 'quotes' && <BillingList kind="quote" />}
        {active === 'invoices' && <BillingList kind="invoice" />}
        {active === 'clients' && <ClientsTab />}
        {active === 'conditions' && <ConditionsTab />}
        {active === 'issuer' && <IssuerSettings />}
      </div>
    </div>
  );
};

export default EditContainer;
