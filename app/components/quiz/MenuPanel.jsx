"use client";

import React from "react";

const ICON_MAP = {
  all: "GL",
  random15: "15",
  customMix: "MX",
  savedErrors: "ER",
  islands: "IS",
  oceania: "OC",
  northAmerica: "NA",
  southAmerica: "SA",
  europe: "EU",
  asia: "AS",
  africa: "AF",
  antarctica: "AN",
};

function formatQuestionCountOptionLabel(value) {
  if (String(value) === "all") {
    return "Toutes";
  }
  return `${value} questions`;
}

function getScopeTitleForType(quizType, quizTypes) {
  if (quizType === quizTypes.COUNTRY_ONLY) {
    return "Etape 2: Choisis la zone du quiz des pays";
  }
  if (quizType === quizTypes.CAPITAL_TO_COUNTRY) {
    return "Etape 2: Choisis la zone du quiz capitale vers pays";
  }
  if (quizType === quizTypes.CAPITAL_ONLY) {
    return "Etape 2: Choisis la zone du quiz des capitales";
  }
  return "Etape 2: Choisis la zone du quiz pays + capitale";
}

function getScopeDescriptionForType(quizType, quizTypes) {
  if (quizType === quizTypes.COUNTRY_ONLY) {
    return "Tu saisis uniquement le pays/l'ile a partir du drapeau.";
  }
  if (quizType === quizTypes.CAPITAL_TO_COUNTRY) {
    return "Tu vois une capitale et tu saisis uniquement le pays/l'ile correspondant.";
  }
  if (quizType === quizTypes.CAPITAL_ONLY) {
    return "Tu saisis uniquement la capitale.";
  }
  return "Tu saisis le pays/l'ile et la capitale a partir du drapeau.";
}

export default function MenuPanel({
  isMenuVisible,
  selectedMenuQuizType,
  setSelectedMenuQuizType,
  quizTypes,
  questionCountOptions,
  selectedQuestionCount,
  setSelectedQuestionCount,
  menuScopeOptions,
  quizLogic,
  openMixConfigPanel,
  startMode,
  showMixConfigPanel,
  mixPanelTitle,
  mixPanelDescription,
  mixRegionKeys,
  quizData,
  currentPendingFilters,
  setMixRegionFilter,
  mixValidationMessage,
  startConfiguredMixMode,
  mixPanelButtonLabel,
  canShowSavedErrorActions,
  clearPersistedErrorHistory,
  clearErrorsLabel,
}) {
  return (
    <section
      id="menuSection"
      className={`menu-panel ${isMenuVisible ? "" : "hidden"}`}
      aria-label="Selection du mode"
    >
      <div className="menu-head">
        <h2>Choisis ton parcours</h2>
        <p>Etape 1: type de quiz. Etape 2: zone geographique ou mode aleatoire.</p>
      </div>

      <div className="type-picker">
        <button
          id="countryTypeBtn"
          className={`type-btn ${selectedMenuQuizType === quizTypes.COUNTRY_ONLY ? "active" : ""}`}
          type="button"
          onClick={() => setSelectedMenuQuizType(quizTypes.COUNTRY_ONLY)}
        >
          Quiz Pays
        </button>
        <button
          id="capitalTypeBtn"
          className={`type-btn ${selectedMenuQuizType === quizTypes.CAPITAL_ONLY ? "active" : ""}`}
          type="button"
          onClick={() => setSelectedMenuQuizType(quizTypes.CAPITAL_ONLY)}
        >
          Quiz Capitales
        </button>
        <button
          id="flagTypeBtn"
          className={`type-btn ${selectedMenuQuizType === quizTypes.FLAG_COUNTRY_CAPITAL ? "active" : ""}`}
          type="button"
          onClick={() => setSelectedMenuQuizType(quizTypes.FLAG_COUNTRY_CAPITAL)}
        >
          Quiz Pays + Capitale
        </button>
        <button
          id="capitalToCountryTypeBtn"
          className={`type-btn ${selectedMenuQuizType === quizTypes.CAPITAL_TO_COUNTRY ? "active" : ""}`}
          type="button"
          onClick={() => setSelectedMenuQuizType(quizTypes.CAPITAL_TO_COUNTRY)}
        >
          Capitale -&gt; Pays
        </button>
      </div>

      <div className="question-count-row">
        <label htmlFor="questionCountSelect">Nombre de questions</label>
        <select
          id="questionCountSelect"
          className="mode-select"
          aria-label="Nombre de questions"
          value={selectedQuestionCount}
          onChange={(event) => setSelectedQuestionCount(event.target.value)}
        >
          {questionCountOptions.map((value) => (
            <option key={value} value={value}>
              {formatQuestionCountOptionLabel(value)}
            </option>
          ))}
        </select>
      </div>

      <div className="scope-head">
        <h3 id="scopeTitle">{getScopeTitleForType(selectedMenuQuizType, quizTypes)}</h3>
        <p id="scopeDescription">{getScopeDescriptionForType(selectedMenuQuizType, quizTypes)}</p>
      </div>

      <div id="modeGrid" className="mode-grid">
        {menuScopeOptions.map((option) => (
          <button
            key={option.key}
            className="mode-card"
            type="button"
            onClick={() => {
              if (
                option.key === quizLogic.QUIZ_SCOPE_KEYS.CUSTOM_MIX ||
                option.key === quizLogic.QUIZ_SCOPE_KEYS.RANDOM_15
              ) {
                openMixConfigPanel(option.key);
                return;
              }

              startMode(selectedMenuQuizType, option.key, selectedQuestionCount);
            }}
          >
            <span className="mode-icon" aria-hidden="true">
              {ICON_MAP[option.iconKey] || "MD"}
            </span>
            <span className="mode-name">{option.name}</span>
            <span className="mode-count">{option.countLabel}</span>
            <span className="mode-helper">{option.helper}</span>
          </button>
        ))}
      </div>

      <div
        id="mixConfigPanel"
        className={`mix-config ${showMixConfigPanel ? "" : "hidden"}`}
        aria-live="polite"
      >
        <h3 id="mixConfigTitle">{mixPanelTitle}</h3>
        <p id="mixConfigDescription">{mixPanelDescription}</p>
        <div id="mixRegionGrid" className="mix-region-grid">
          {mixRegionKeys.map((regionKey) => (
            <label className="mix-region-row" htmlFor={`mixFilter-${regionKey}`} key={regionKey}>
              <span className="mix-region-label">{quizData[regionKey].name}</span>
              <select
                id={`mixFilter-${regionKey}`}
                className="mode-select mix-region-select"
                value={currentPendingFilters[regionKey] || quizLogic.MIX_FILTER_KEYS.OFF}
                onChange={(event) => setMixRegionFilter(regionKey, event.target.value)}
              >
                <option value={quizLogic.MIX_FILTER_KEYS.OFF}>Ignorer</option>
                <option value={quizLogic.MIX_FILTER_KEYS.ALL}>Tout</option>
                <option value={quizLogic.MIX_FILTER_KEYS.MAINLAND}>Pays uniquement</option>
                <option value={quizLogic.MIX_FILTER_KEYS.ISLANDS}>Iles uniquement</option>
              </select>
            </label>
          ))}
        </div>
        <p id="mixConfigHint" className={`mix-config-hint ${mixValidationMessage ? "" : "hidden"}`}>
          {mixValidationMessage}
        </p>
        <div className="mix-config-actions">
          <button id="startMixBtn" className="primary-btn" type="button" onClick={startConfiguredMixMode}>
            {mixPanelButtonLabel}
          </button>
        </div>
      </div>

      <div className="menu-actions">
        <button
          id="menuClearErrorsBtn"
          className={`danger-btn menu-danger-btn ${canShowSavedErrorActions ? "" : "is-disabled"}`}
          type="button"
          disabled={!canShowSavedErrorActions}
          onClick={clearPersistedErrorHistory}
        >
          {clearErrorsLabel}
        </button>
      </div>
    </section>
  );
}

