"use client";

import React from "react";

function formatQuestionCountOptionLabel(value) {
  if (String(value) === "all") {
    return "Toutes";
  }
  return `${value} questions`;
}

export default function QuizHeader({
  backToMenu,
  refreshCurrentDraw,
  showInQuizModePanel,
  setShowInQuizModePanel,
  modeTagText,
  liveProgressText,
  quickQuizType,
  setQuickQuizType,
  quizTypes,
  quickScopeKey,
  setQuickScopeKey,
  menuScopeOptions,
  quickQuestionCount,
  setQuickQuestionCount,
  questionCountOptions,
  applyInQuizModeSelection,
}) {
  return (
    <>
      <div className="quiz-header">
        <button id="backBtn" className="ghost-btn" type="button" onClick={backToMenu}>
          Retour au menu
        </button>
        <div className="quiz-head-right">
          <div className="quiz-head-actions">
            <button id="refreshDrawBtn" className="secondary-btn" type="button" onClick={refreshCurrentDraw}>
              Nouveau tirage
            </button>
            <button
              id="toggleModePanelBtn"
              className="ghost-btn"
              type="button"
              onClick={() => setShowInQuizModePanel((prev) => !prev)}
            >
              Changer de mode
            </button>
          </div>
          <div className="quiz-meta">
            <span id="modeTag" className="mode-tag">{modeTagText}</span>
            <span id="stepTag" className="step-tag">{liveProgressText}</span>
          </div>
        </div>
      </div>

      <div id="inQuizModePanel" className={`in-quiz-mode-panel ${showInQuizModePanel ? "" : "hidden"}`}>
        <div className="type-picker in-quiz-type-picker">
          <button
            id="quickCountryTypeBtn"
            className={`type-btn ${quickQuizType === quizTypes.COUNTRY_ONLY ? "active" : ""}`}
            type="button"
            onClick={() => setQuickQuizType(quizTypes.COUNTRY_ONLY)}
          >
            Quiz Pays
          </button>
          <button
            id="quickCapitalTypeBtn"
            className={`type-btn ${quickQuizType === quizTypes.CAPITAL_ONLY ? "active" : ""}`}
            type="button"
            onClick={() => setQuickQuizType(quizTypes.CAPITAL_ONLY)}
          >
            Quiz Capitales
          </button>
          <button
            id="quickFlagTypeBtn"
            className={`type-btn ${quickQuizType === quizTypes.FLAG_COUNTRY_CAPITAL ? "active" : ""}`}
            type="button"
            onClick={() => setQuickQuizType(quizTypes.FLAG_COUNTRY_CAPITAL)}
          >
            Quiz Pays + Capitale
          </button>
          <button
            id="quickCapitalToCountryTypeBtn"
            className={`type-btn ${quickQuizType === quizTypes.CAPITAL_TO_COUNTRY ? "active" : ""}`}
            type="button"
            onClick={() => setQuickQuizType(quizTypes.CAPITAL_TO_COUNTRY)}
          >
            Capitale -&gt; Pays
          </button>
        </div>
        <div className="in-quiz-scope-row">
          <label htmlFor="quickScopeSelect">Zone</label>
          <select
            id="quickScopeSelect"
            className="mode-select"
            aria-label="Choisir la zone"
            value={quickScopeKey || ""}
            onChange={(event) => setQuickScopeKey(event.target.value)}
          >
            {menuScopeOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.name}
              </option>
            ))}
          </select>
          <label htmlFor="quickQuestionCountSelect">Nombre</label>
          <select
            id="quickQuestionCountSelect"
            className="mode-select"
            aria-label="Choisir le nombre de questions"
            value={quickQuestionCount}
            onChange={(event) => setQuickQuestionCount(event.target.value)}
          >
            {questionCountOptions.map((value) => (
              <option key={value} value={value}>
                {formatQuestionCountOptionLabel(value)}
              </option>
            ))}
          </select>
          <button id="applyModeBtn" className="secondary-btn" type="button" onClick={applyInQuizModeSelection}>
            Appliquer
          </button>
        </div>
      </div>
    </>
  );
}

