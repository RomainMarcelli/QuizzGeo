(function registerQuizRenderers(root) {
  const modules = (root.QuizAppModules = root.QuizAppModules || {});

  function renderScopeCards({ modeGrid, options, onSelectOption, getModeIconSvg }) {
    modeGrid.innerHTML = "";

    options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mode-card";
      button.innerHTML = `
        <span class="mode-icon" aria-hidden="true">${getModeIconSvg(option.iconKey)}</span>
        <span class="mode-name">${option.name}</span>
        <span class="mode-count">${option.countLabel}</span>
        <span class="mode-helper">${option.helper}</span>
      `;

      button.addEventListener("click", () => onSelectOption(option));
      modeGrid.appendChild(button);
    });
  }

  function renderCountryRows({
    countryList,
    countries,
    activeQuizType,
    quizTypes,
    onCheck,
    onReveal,
    onOpenFlag,
    onFocus,
    onInputChange,
  }) {
    countryList.innerHTML = "";

    countries.forEach((country, index) => {
      const row = document.createElement("li");
      row.className = "country-item";
      row.id = `row-${index}`;

      if (activeQuizType === quizTypes.FLAG_COUNTRY_CAPITAL) {
        row.innerHTML = renderFlagChallengeRow(country, index);
      } else if (activeQuizType === quizTypes.CAPITAL_TO_COUNTRY) {
        row.innerHTML = renderCapitalToCountryRow(country, index);
      } else if (activeQuizType === quizTypes.COUNTRY_ONLY) {
        row.innerHTML = renderCountryOnlyRow(country, index);
      } else {
        row.innerHTML = renderCapitalRow(country, index);
      }

      countryList.appendChild(row);
      bindRowEvents({
        index,
        country,
        activeQuizType,
        quizTypes,
        onCheck,
        onReveal,
        onOpenFlag,
        onFocus,
        onInputChange,
      });
    });
  }

  function renderCapitalRow(country, index) {
    return `
      <div class="country-info">
        <button id="flagbtn-${index}" class="flag-trigger" type="button" aria-label="Voir ${country.country} en plein ecran">
          <img class="flag" src="https://flagcdn.com/w80/${country.code}.png" alt="Drapeau de ${country.country}" loading="lazy">
        </button>
        <span class="country-name">${country.country}</span>
      </div>
      <div class="answer-box">
        <input id="input-${index}" class="answer-input" type="text" placeholder="Capitale" autocomplete="off" spellcheck="false" autocapitalize="words">
        <button id="btn-${index}" class="check-btn" type="button">OK</button>
        <button id="reveal-${index}" class="reveal-btn" type="button">Voir</button>
        <span id="fb-${index}" class="feedback"></span>
      </div>
    `;
  }

  function renderFlagChallengeRow(country, index) {
    return `
      <div class="country-info challenge-info">
        <button id="flagbtn-${index}" class="flag-trigger challenge-flag-trigger" type="button" aria-label="Voir ${country.country} en plein ecran">
          <img class="flag challenge-flag" src="https://flagcdn.com/w160/${country.code}.png" alt="Drapeau inconnu" loading="lazy">
        </button>
      </div>
      <div class="answer-box challenge-answer-box">
        <input id="input-country-${index}" class="answer-input challenge-input" type="text" placeholder="Pays / ile" autocomplete="off" spellcheck="false" autocapitalize="words">
        <input id="input-capital-${index}" class="answer-input challenge-input" type="text" placeholder="Capitale" autocomplete="off" spellcheck="false" autocapitalize="words">
        <button id="btn-${index}" class="check-btn" type="button">OK</button>
        <button id="reveal-${index}" class="reveal-btn" type="button">Voir</button>
        <span id="fb-${index}" class="feedback"></span>
      </div>
    `;
  }

  function renderCountryOnlyRow(country, index) {
    return `
      <div class="country-info challenge-info">
        <button id="flagbtn-${index}" class="flag-trigger challenge-flag-trigger" type="button" aria-label="Voir ${country.country} en plein ecran">
          <img class="flag challenge-flag" src="https://flagcdn.com/w160/${country.code}.png" alt="Drapeau inconnu" loading="lazy">
        </button>
      </div>
      <div class="answer-box challenge-answer-box">
        <input id="input-country-${index}" class="answer-input challenge-input" type="text" placeholder="Pays / ile" autocomplete="off" spellcheck="false" autocapitalize="words">
        <button id="btn-${index}" class="check-btn" type="button">OK</button>
        <button id="reveal-${index}" class="reveal-btn" type="button">Voir</button>
        <span id="fb-${index}" class="feedback"></span>
      </div>
    `;
  }

  function renderCapitalToCountryRow(country, index) {
    return `
      <div class="country-info">
        <div class="capital-clue-card">
          <span class="capital-clue-label">Capitale</span>
          <span class="capital-clue-value">${country.capital}</span>
        </div>
      </div>
      <div class="answer-box">
        <input id="input-country-${index}" class="answer-input challenge-input" type="text" placeholder="Pays / ile" autocomplete="off" spellcheck="false" autocapitalize="words">
        <button id="btn-${index}" class="check-btn" type="button">OK</button>
        <button id="reveal-${index}" class="reveal-btn" type="button">Voir</button>
        <span id="fb-${index}" class="feedback"></span>
      </div>
    `;
  }

  function bindRowEvents({
    index,
    country,
    activeQuizType,
    quizTypes,
    onCheck,
    onReveal,
    onOpenFlag,
    onFocus,
    onInputChange,
  }) {
    const checkButton = document.getElementById(`btn-${index}`);
    const revealButton = document.getElementById(`reveal-${index}`);
    const flagButton = document.getElementById(`flagbtn-${index}`);

    checkButton.addEventListener("click", () => onCheck(index));
    revealButton.addEventListener("click", () => onReveal(index));
    if (flagButton) {
      flagButton.addEventListener("click", () => onOpenFlag(country));
    }

    function bindInputHandlers(inputElement) {
      inputElement.addEventListener("focus", () => onFocus(index));
      inputElement.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          onCheck(index);
        }
      });
      if (typeof onInputChange === "function") {
        inputElement.addEventListener("input", () => onInputChange(inputElement));
      }
    }

    if (
      activeQuizType === quizTypes.COUNTRY_ONLY ||
      activeQuizType === quizTypes.FLAG_COUNTRY_CAPITAL ||
      activeQuizType === quizTypes.CAPITAL_TO_COUNTRY
    ) {
      const countryInput = document.getElementById(`input-country-${index}`);
      bindInputHandlers(countryInput);

      if (activeQuizType === quizTypes.FLAG_COUNTRY_CAPITAL) {
        const capitalInput = document.getElementById(`input-capital-${index}`);
        bindInputHandlers(capitalInput);
      }
      return;
    }

    const input = document.getElementById(`input-${index}`);
    bindInputHandlers(input);
  }

  modules.renderers = {
    renderScopeCards,
    renderCountryRows,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
