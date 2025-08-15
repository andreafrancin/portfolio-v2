import React from 'react';
import './index.scss';
import { useTranslation } from 'react-i18next';

interface LangSelectorProps {
  handleLanguageSelect: any;
}

function LangSelector({ handleLanguageSelect }: LangSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="lang-selector-container">
      <label>{t('PRIVATE.CHOOSE_LANGUAGE')}</label>
      <select defaultValue={'en'} name="languages" id="lang-select" onChange={handleLanguageSelect}>
        <option value="">--Please choose a language--</option>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="ca">Catalan</option>
      </select>
    </div>
  );
}

export default LangSelector;
