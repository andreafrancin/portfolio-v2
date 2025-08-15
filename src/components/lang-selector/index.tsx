import React from 'react';
import './index.scss';

interface ProjectLangSelectorProps {
  handleLanguageSelect: any;
}

function ProjectLangSelector({ handleLanguageSelect }: ProjectLangSelectorProps) {
  return (
    <div className="lang-selector-container">
      <label>Choose a lang:</label>
      <select defaultValue={'en'} name="languages" id="lang-select" onChange={handleLanguageSelect}>
        <option value="">--Please choose a language--</option>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="ca">Catalan</option>
      </select>
    </div>
  );
}

export default ProjectLangSelector;
