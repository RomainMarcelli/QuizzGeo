"use client";

import React from "react";
import { useQuizApp } from "../hooks/useQuizApp";
import FlagModal from "./quiz/FlagModal";
import MenuPanel from "./quiz/MenuPanel";
import QuestionRow from "./quiz/QuestionRow";
import QuizFooter from "./quiz/QuizFooter";
import QuizHeader from "./quiz/QuizHeader";
import QuizProgress from "./quiz/QuizProgress";

export default function QuizApp() {
  const app = useQuizApp();
  const {
    quizData,
    quizLogic,
    quizTypes,
    mixRegionKeys,
    isMenuVisible,
    selectedMenuQuizType,
    setSelectedMenuQuizType,
    selectedQuestionCount,
    setSelectedQuestionCount,
    questionCountOptions,
    menuScopeOptions,
    showMixConfigPanel,
    pendingMixScopeKey,
    mixValidationMessage,
    currentPendingFilters,
    setMixRegionFilter,
    openMixConfigPanel,
    startConfiguredMixMode,
    startMode,
    clearPersistedErrorHistory,
    clearErrorsLabel,
    canShowSavedErrorActions,
    activeQuizType,
    modeTagText,
    liveProgressText,
    completionPercent,
    showInQuizModePanel,
    setShowInQuizModePanel,
    quickQuizType,
    setQuickQuizType,
    quickScopeKey,
    setQuickScopeKey,
    quickQuestionCount,
    setQuickQuestionCount,
    applyInQuizModeSelection,
    backToMenu,
    refreshCurrentDraw,
    questions,
    nextUnansweredIndex,
    updateRowInput,
    checkRow,
    revealRow,
    rowRefs,
    countryInputRefs,
    singleInputRefs,
    isQuizFinished,
    retryErrorSession,
    retryButtonLabel,
    showRetryButton,
    showClearErrorsButton,
    showPerfectMenuButton,
    restartQuiz,
    finalScoreText,
    flagModalCountry,
    flagModalPresentation,
    setFlagModalCountry,
  } = app;

  const mixPanelTitle =
    pendingMixScopeKey === quizLogic.QUIZ_SCOPE_KEYS.RANDOM_15
      ? "Etape 3: Filtre ton Sprint"
      : "Etape 3: Compose ton melange";
  const mixPanelDescription =
    pendingMixScopeKey === quizLogic.QUIZ_SCOPE_KEYS.RANDOM_15
      ? "Choisis les continents et le type (tout, pays, iles). Le sprint prendra ensuite un tirage aleatoire sur cette selection."
      : "Pour chaque zone, choisis: tout, pays uniquement, iles uniquement, ou ignorer.";
  const mixPanelButtonLabel =
    pendingMixScopeKey === quizLogic.QUIZ_SCOPE_KEYS.RANDOM_15
      ? "Lancer le sprint filtre"
      : "Lancer ce melange";

  return (
    <>
      <main className="app-shell">
        <header className="hero">
          <p className="hero-kicker">Mode entrainement</p>
          <h1>Quiz des Capitales</h1>
          <p className="hero-subtitle">
            Teste ta memoire pays par pays avec un parcours visuel plus clair et plus rapide.
          </p>
        </header>

        <MenuPanel
          isMenuVisible={isMenuVisible}
          selectedMenuQuizType={selectedMenuQuizType}
          setSelectedMenuQuizType={setSelectedMenuQuizType}
          quizTypes={quizTypes}
          questionCountOptions={questionCountOptions}
          selectedQuestionCount={selectedQuestionCount}
          setSelectedQuestionCount={setSelectedQuestionCount}
          menuScopeOptions={menuScopeOptions}
          quizLogic={quizLogic}
          openMixConfigPanel={openMixConfigPanel}
          startMode={startMode}
          showMixConfigPanel={showMixConfigPanel}
          mixPanelTitle={mixPanelTitle}
          mixPanelDescription={mixPanelDescription}
          mixRegionKeys={mixRegionKeys}
          quizData={quizData}
          currentPendingFilters={currentPendingFilters}
          setMixRegionFilter={setMixRegionFilter}
          mixValidationMessage={mixValidationMessage}
          startConfiguredMixMode={startConfiguredMixMode}
          mixPanelButtonLabel={mixPanelButtonLabel}
          canShowSavedErrorActions={canShowSavedErrorActions}
          clearPersistedErrorHistory={clearPersistedErrorHistory}
          clearErrorsLabel={clearErrorsLabel}
        />

        <section id="quizSection" className={`quiz-panel ${isMenuVisible ? "hidden" : ""}`} aria-live="polite">
          <QuizHeader
            backToMenu={backToMenu}
            refreshCurrentDraw={refreshCurrentDraw}
            showInQuizModePanel={showInQuizModePanel}
            setShowInQuizModePanel={setShowInQuizModePanel}
            modeTagText={modeTagText}
            liveProgressText={liveProgressText}
            quickQuizType={quickQuizType}
            setQuickQuizType={setQuickQuizType}
            quizTypes={quizTypes}
            quickScopeKey={quickScopeKey}
            setQuickScopeKey={setQuickScopeKey}
            menuScopeOptions={menuScopeOptions}
            quickQuestionCount={quickQuestionCount}
            setQuickQuestionCount={setQuickQuestionCount}
            questionCountOptions={questionCountOptions}
            applyInQuizModeSelection={applyInQuizModeSelection}
          />

          <QuizProgress completionPercent={completionPercent} />

          <ul id="countryList" className="country-list">
            {questions.map((row, index) => (
              <QuestionRow
                key={`${row.country.code}-${index}`}
                row={row}
                index={index}
                activeQuizType={activeQuizType}
                quizTypes={quizTypes}
                nextUnansweredIndex={nextUnansweredIndex}
                rowRefs={rowRefs}
                countryInputRefs={countryInputRefs}
                singleInputRefs={singleInputRefs}
                updateRowInput={updateRowInput}
                checkRow={checkRow}
                revealRow={revealRow}
                setFlagModalCountry={setFlagModalCountry}
                quizLogic={quizLogic}
              />
            ))}
          </ul>

          <QuizFooter
            liveProgressText={liveProgressText}
            showRetryButton={showRetryButton}
            retryErrorSession={retryErrorSession}
            retryButtonLabel={retryButtonLabel}
            showClearErrorsButton={showClearErrorsButton}
            clearPersistedErrorHistory={clearPersistedErrorHistory}
            clearErrorsLabel={clearErrorsLabel}
            showPerfectMenuButton={showPerfectMenuButton}
            backToMenu={backToMenu}
            isQuizFinished={isQuizFinished}
            restartQuiz={restartQuiz}
          />

          <div id="finalScore" className="final-score">{finalScoreText}</div>
        </section>
      </main>

      <div id="floatingLiveScore" className={`floating-live-score ${isMenuVisible ? "hidden" : ""}`} aria-live="polite">
        {liveProgressText}
      </div>

      <FlagModal
        flagModalCountry={flagModalCountry}
        flagModalPresentation={flagModalPresentation}
        onClose={() => setFlagModalCountry(null)}
      />
    </>
  );
}
