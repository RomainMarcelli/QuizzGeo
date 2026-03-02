"use client";

import React from "react";

export default function QuizFooter({
  liveProgressText,
  showRetryButton,
  retryErrorSession,
  retryButtonLabel,
  showClearErrorsButton,
  clearPersistedErrorHistory,
  clearErrorsLabel,
  showPerfectMenuButton,
  backToMenu,
  isQuizFinished,
  restartQuiz,
}) {
  return (
    <footer className="quiz-footer">
      <div id="liveScore" className="live-score">{liveProgressText}</div>
      <div className="actions">
        <button
          id="retryWrongBtn"
          className={`secondary-btn ${showRetryButton ? "" : "hidden"}`}
          type="button"
          onClick={retryErrorSession}
        >
          {retryButtonLabel}
        </button>
        <button
          id="clearErrorsBtn"
          className={`danger-btn ${showClearErrorsButton ? "" : "hidden"}`}
          type="button"
          onClick={clearPersistedErrorHistory}
        >
          {clearErrorsLabel}
        </button>
        <button
          id="perfectMenuBtn"
          className={`secondary-btn ${showPerfectMenuButton ? "" : "hidden"}`}
          type="button"
          onClick={backToMenu}
        >
          Retour au menu
        </button>
        <button
          id="restartBtn"
          className={`primary-btn ${isQuizFinished ? "" : "hidden"}`}
          type="button"
          onClick={restartQuiz}
        >
          Recommencer
        </button>
      </div>
    </footer>
  );
}
