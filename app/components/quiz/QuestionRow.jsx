"use client";

import React from "react";

export default function QuestionRow({
  row,
  index,
  activeQuizType,
  quizTypes,
  nextUnansweredIndex,
  rowRefs,
  countryInputRefs,
  singleInputRefs,
  updateRowInput,
  checkRow,
  revealRow,
  setFlagModalCountry,
  quizLogic,
}) {
  const postAnswerButtonState = row.answered
    ? quizLogic.getPostAnswerButtonState()
    : { checkDisabled: false, revealDisabled: false };

  const isCountryChallenge =
    activeQuizType === quizTypes.COUNTRY_ONLY || activeQuizType === quizTypes.FLAG_COUNTRY_CAPITAL;

  return (
    <li
      id={`row-${index}`}
      ref={(element) => {
        rowRefs.current[index] = element;
      }}
      className={`country-item ${nextUnansweredIndex === index ? "active" : ""} ${
        row.answered && row.isCorrect ? "success" : ""
      } ${row.answered && !row.isCorrect ? "error" : ""}`}
    >
      {activeQuizType === quizTypes.CAPITAL_TO_COUNTRY ? (
        <div className="country-info">
          <div className="capital-clue-card">
            <span className="capital-clue-label">Capitale</span>
            <span className="capital-clue-value">{row.country.capital}</span>
          </div>
        </div>
      ) : (
        <div className={`country-info ${isCountryChallenge ? "challenge-info" : ""}`}>
          <button
            id={`flagbtn-${index}`}
            className={`flag-trigger ${isCountryChallenge ? "challenge-flag-trigger" : ""}`}
            type="button"
            aria-label={`Voir ${row.country.country} en plein ecran`}
            onClick={() => setFlagModalCountry(row.country)}
          >
            <img
              className={`flag ${isCountryChallenge ? "challenge-flag" : ""}`}
              src={`https://flagcdn.com/${isCountryChallenge ? "w160" : "w80"}/${row.country.code}.png`}
              alt={isCountryChallenge ? "Drapeau a deviner" : `Drapeau de ${row.country.country}`}
              loading="lazy"
            />
          </button>
          {activeQuizType === quizTypes.CAPITAL_ONLY ? (
            <span className="country-name">{row.country.country}</span>
          ) : null}
        </div>
      )}

      <div className={`answer-box ${isCountryChallenge ? "challenge-answer-box" : ""}`}>
        {activeQuizType === quizTypes.FLAG_COUNTRY_CAPITAL ? (
          <>
            <input
              id={`input-country-${index}`}
              className="answer-input challenge-input"
              type="text"
              placeholder="Pays / ile"
              autoComplete="off"
              spellCheck="false"
              autoCapitalize="words"
              value={row.countryInput}
              disabled={row.answered}
              ref={(element) => {
                countryInputRefs.current[index] = element;
              }}
              onChange={(event) => updateRowInput(index, "countryInput", event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && checkRow(index)}
            />
            <input
              id={`input-capital-${index}`}
              className="answer-input challenge-input"
              type="text"
              placeholder="Capitale"
              autoComplete="off"
              spellCheck="false"
              autoCapitalize="words"
              value={row.capitalInput}
              disabled={row.answered}
              onChange={(event) => updateRowInput(index, "capitalInput", event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && checkRow(index)}
            />
          </>
        ) : null}

        {activeQuizType === quizTypes.COUNTRY_ONLY || activeQuizType === quizTypes.CAPITAL_TO_COUNTRY ? (
          <input
            id={`input-country-${index}`}
            className="answer-input challenge-input"
            type="text"
            placeholder="Pays / ile"
            autoComplete="off"
            spellCheck="false"
            autoCapitalize="words"
            value={row.countryInput}
            disabled={row.answered}
            ref={(element) => {
              countryInputRefs.current[index] = element;
            }}
            onChange={(event) => updateRowInput(index, "countryInput", event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && checkRow(index)}
          />
        ) : null}

        {activeQuizType === quizTypes.CAPITAL_ONLY ? (
          <input
            id={`input-${index}`}
            className="answer-input"
            type="text"
            placeholder="Capitale"
            autoComplete="off"
            spellCheck="false"
            autoCapitalize="words"
            value={row.singleInput}
            disabled={row.answered}
            ref={(element) => {
              singleInputRefs.current[index] = element;
            }}
            onChange={(event) => updateRowInput(index, "singleInput", event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && checkRow(index)}
          />
        ) : null}

        <button
          id={`btn-${index}`}
          className="check-btn"
          type="button"
          disabled={postAnswerButtonState.checkDisabled}
          onClick={() => checkRow(index)}
        >
          OK
        </button>
        <button
          id={`reveal-${index}`}
          className="reveal-btn"
          type="button"
          disabled={postAnswerButtonState.revealDisabled}
          onClick={() => revealRow(index)}
        >
          Voir
        </button>
        <span id={`fb-${index}`} className={`feedback ${row.feedbackType || ""} ${row.feedback ? "" : "hidden"}`}>
          {row.feedback}
        </span>
      </div>
    </li>
  );
}
