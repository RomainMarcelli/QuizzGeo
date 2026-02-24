const QUIZ_TYPES = {
  CAPITAL_ONLY: "capital-only",
  FLAG_COUNTRY_CAPITAL: "flag-country-capital",
};

const RANDOM_SAMPLE_SIZE = 15;
const ERROR_HISTORY_STORAGE_KEY = "quiz.error.history.v1";

const {
  QUIZ_SCOPE_KEYS,
  isCapitalAnswerCorrect,
  isFlagChallengeCorrect,
  shuffleCopy,
  buildScopeOptions,
  resolveScopeCountries,
  getRevealText,
  toggleRevealState,
  mergeUniqueCountryLists,
  formatRetryButtonLabel,
  shouldShowSavedErrorActions,
  buildSavedErrorsScopeOption,
  removeCountryFromList,
  getFlagModalPresentation,
} = QuizLogic;

let activeQuizType = QUIZ_TYPES.CAPITAL_ONLY;
let selectedMenuQuizType = QUIZ_TYPES.CAPITAL_ONLY;
let activeScopeKey = null;
let fullModeList = [];
let countries = [];
let wrongAnswers = [];
let persistedWrongAnswers = [];
let currentIndex = 0;
let score = 0;
let revealedRows = new Set();

const baseScopeOptions = buildScopeOptions(QUIZ_DATA, RANDOM_SAMPLE_SIZE);

const menuSection = document.getElementById("menuSection");
const quizSection = document.getElementById("quizSection");
const modeGrid = document.getElementById("modeGrid");
const progressBar = document.getElementById("progressBar");
const countryList = document.getElementById("countryList");
const finalScore = document.getElementById("finalScore");
const liveScore = document.getElementById("liveScore");
const modeTag = document.getElementById("modeTag");
const stepTag = document.getElementById("stepTag");
const restartBtn = document.getElementById("restartBtn");
const retryWrongBtn = document.getElementById("retryWrongBtn");
const clearErrorsBtn = document.getElementById("clearErrorsBtn");
const backBtn = document.getElementById("backBtn");

const capitalTypeBtn = document.getElementById("capitalTypeBtn");
const flagTypeBtn = document.getElementById("flagTypeBtn");
const scopeTitle = document.getElementById("scopeTitle");
const scopeDescription = document.getElementById("scopeDescription");

const flagModal = document.getElementById("flagModal");
const flagModalBackdrop = document.getElementById("flagModalBackdrop");
const flagModalClose = document.getElementById("flagModalClose");
const flagModalImage = document.getElementById("flagModalImage");
const flagModalLabel = document.getElementById("flagModalLabel");

init();

function init() {
  loadPersistedErrorHistory();
  attachGlobalEvents();
  setMenuQuizType(QUIZ_TYPES.CAPITAL_ONLY);
  refreshRetryButtonLabel();
  updateSavedErrorActionButtonsVisibility();
}

function attachGlobalEvents() {
  restartBtn.addEventListener("click", () => startQuiz(fullModeList));
  retryWrongBtn.addEventListener("click", () => startQuiz(getRetryCountries()));
  clearErrorsBtn.addEventListener("click", clearPersistedErrorHistory);
  backBtn.addEventListener("click", backToMenu);

  capitalTypeBtn.addEventListener("click", () => setMenuQuizType(QUIZ_TYPES.CAPITAL_ONLY));
  flagTypeBtn.addEventListener("click", () => setMenuQuizType(QUIZ_TYPES.FLAG_COUNTRY_CAPITAL));

  flagModalClose.addEventListener("click", closeFlagModal);
  flagModalBackdrop.addEventListener("click", closeFlagModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !flagModal.classList.contains("hidden")) {
      closeFlagModal();
    }
  });
}

function setMenuQuizType(quizType) {
  selectedMenuQuizType = quizType;

  capitalTypeBtn.classList.toggle("active", quizType === QUIZ_TYPES.CAPITAL_ONLY);
  flagTypeBtn.classList.toggle("active", quizType === QUIZ_TYPES.FLAG_COUNTRY_CAPITAL);

  scopeTitle.textContent =
    quizType === QUIZ_TYPES.CAPITAL_ONLY
      ? "Etape 2: Choisis la zone du quiz des capitales"
      : "Etape 2: Choisis la zone du mode drapeau";

  scopeDescription.textContent =
    quizType === QUIZ_TYPES.CAPITAL_ONLY
      ? "Tu saisis uniquement la capitale."
      : "Tu saisis le pays/ile et la capitale a partir du drapeau.";

  renderScopeCards();
}

function renderScopeCards() {
  modeGrid.innerHTML = "";

  const menuScopeOptions = getMenuScopeOptions();

  menuScopeOptions.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mode-card";
    button.innerHTML = `
      <span class="mode-emoji">${option.badge}</span>
      <span class="mode-name">${option.name}</span>
      <span class="mode-count">${option.countLabel}</span>
      <span class="mode-helper">${option.helper}</span>
    `;

    button.addEventListener("click", () => startMode(selectedMenuQuizType, option.key));
    modeGrid.appendChild(button);
  });
}

function startMode(quizType, scopeKey) {
  activeQuizType = quizType;
  activeScopeKey = scopeKey;
  fullModeList =
    scopeKey === QUIZ_SCOPE_KEYS.SAVED_ERRORS
      ? getRetryCountries()
      : resolveScopeCountries(QUIZ_DATA, scopeKey, RANDOM_SAMPLE_SIZE);

  const scopeOption = getMenuScopeOptions().find((option) => option.key === scopeKey);
  const quizLabel = quizType === QUIZ_TYPES.CAPITAL_ONLY ? "Capitales" : "Drapeaux";
  modeTag.textContent = `${quizLabel} | ${scopeOption ? scopeOption.name : scopeKey}`;

  menuSection.classList.add("hidden");
  quizSection.classList.remove("hidden");
  startQuiz(fullModeList);
}

function startQuiz(sourceList) {
  if (!Array.isArray(sourceList) || sourceList.length === 0) {
    backToMenu();
    return;
  }

  countries = shuffleCopy(sourceList);
  wrongAnswers = [];
  currentIndex = 0;
  score = 0;
  revealedRows = new Set();

  finalScore.textContent = "";
  restartBtn.classList.add("hidden");
  retryWrongBtn.classList.add("hidden");
  clearErrorsBtn.classList.add("hidden");
  refreshRetryButtonLabel();

  renderCountryRows();
  updateProgress();
  updateScoreBadge();
  focusInput(0);
}

function renderCountryRows() {
  countryList.innerHTML = "";

  countries.forEach((country, index) => {
    const row = document.createElement("li");
    row.className = "country-item";
    row.id = `row-${index}`;

    if (activeQuizType === QUIZ_TYPES.FLAG_COUNTRY_CAPITAL) {
      row.innerHTML = renderFlagChallengeRow(country, index);
    } else {
      row.innerHTML = renderCapitalRow(country, index);
    }

    countryList.appendChild(row);
    bindRowEvents(index, country);
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
      <input id="input-${index}" class="answer-input" type="text" placeholder="Capitale" autocomplete="off" spellcheck="false" ${index === 0 ? "" : "disabled"}>
      <button id="btn-${index}" class="check-btn" type="button" ${index === 0 ? "" : "disabled"}>OK</button>
      <button id="reveal-${index}" class="reveal-btn" type="button" ${index === 0 ? "" : "disabled"}>Voir</button>
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
      <input id="input-country-${index}" class="answer-input challenge-input" type="text" placeholder="Pays / ile" autocomplete="off" spellcheck="false" ${index === 0 ? "" : "disabled"}>
      <input id="input-capital-${index}" class="answer-input challenge-input" type="text" placeholder="Capitale" autocomplete="off" spellcheck="false" ${index === 0 ? "" : "disabled"}>
      <button id="btn-${index}" class="check-btn" type="button" ${index === 0 ? "" : "disabled"}>OK</button>
      <button id="reveal-${index}" class="reveal-btn" type="button" ${index === 0 ? "" : "disabled"}>Voir</button>
      <span id="fb-${index}" class="feedback"></span>
    </div>
  `;
}

function bindRowEvents(index, country) {
  const checkButton = document.getElementById(`btn-${index}`);
  const revealButton = document.getElementById(`reveal-${index}`);
  const flagButton = document.getElementById(`flagbtn-${index}`);

  checkButton.addEventListener("click", () => checkAnswer(index));
  revealButton.addEventListener("click", () => revealAnswer(index));
  flagButton.addEventListener("click", () => openFlagModal(country));

  if (activeQuizType === QUIZ_TYPES.FLAG_COUNTRY_CAPITAL) {
    const countryInput = document.getElementById(`input-country-${index}`);
    const capitalInput = document.getElementById(`input-capital-${index}`);

    countryInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        checkAnswer(index);
      }
    });

    capitalInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        checkAnswer(index);
      }
    });
  } else {
    const input = document.getElementById(`input-${index}`);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        checkAnswer(index);
      }
    });
  }
}

function focusInput(index) {
  highlightActiveRow(index);

  if (activeQuizType === QUIZ_TYPES.FLAG_COUNTRY_CAPITAL) {
    const input = document.getElementById(`input-country-${index}`);
    if (input) {
      input.focus();
      input.select();
    }
    return;
  }

  const input = document.getElementById(`input-${index}`);
  if (input) {
    input.focus();
    input.select();
  }
}

function highlightActiveRow(index) {
  document.querySelectorAll(".country-item").forEach((row) => row.classList.remove("active"));
  const row = document.getElementById(`row-${index}`);
  if (row) {
    row.classList.add("active");
  }
}

function checkAnswer(index) {
  if (index !== currentIndex) {
    return;
  }

  revealedRows.delete(index);

  const country = countries[index];
  const checkButton = document.getElementById(`btn-${index}`);
  const revealButton = document.getElementById(`reveal-${index}`);
  const feedback = document.getElementById(`fb-${index}`);
  const row = document.getElementById(`row-${index}`);

  let isCorrect = false;

  if (activeQuizType === QUIZ_TYPES.FLAG_COUNTRY_CAPITAL) {
    const countryInput = document.getElementById(`input-country-${index}`);
    const capitalInput = document.getElementById(`input-capital-${index}`);

    isCorrect = isFlagChallengeCorrect(country, countryInput.value, capitalInput.value);

    countryInput.disabled = true;
    capitalInput.disabled = true;

    if (isCorrect) {
      score += 1;
      feedback.textContent = "Correct";
      feedback.className = "feedback correct";
      row.classList.add("success");
      if (activeScopeKey === QUIZ_SCOPE_KEYS.SAVED_ERRORS) {
        resolvePersistentError(country);
      }
    } else {
      feedback.textContent = `Faux: ${country.country} - ${country.capital}`;
      feedback.className = "feedback wrong";
      row.classList.add("error");
      wrongAnswers.push(country);
      registerPersistentError(country);
    }
  } else {
    const input = document.getElementById(`input-${index}`);
    isCorrect = isCapitalAnswerCorrect(country, input.value);

    input.disabled = true;

    if (isCorrect) {
      score += 1;
      feedback.textContent = "Correct";
      feedback.className = "feedback correct";
      row.classList.add("success");
      if (activeScopeKey === QUIZ_SCOPE_KEYS.SAVED_ERRORS) {
        resolvePersistentError(country);
      }
    } else {
      feedback.textContent = `Faux: ${country.capital}`;
      feedback.className = "feedback wrong";
      row.classList.add("error");
      wrongAnswers.push(country);
      registerPersistentError(country);
    }
  }

  checkButton.disabled = true;
  revealButton.disabled = true;

  currentIndex += 1;
  updateProgress();
  updateScoreBadge();

  if (currentIndex < countries.length) {
    enableInputsForIndex(currentIndex);
    focusInput(currentIndex);
  } else {
    finishQuiz();
  }
}

function enableInputsForIndex(index) {
  const checkButton = document.getElementById(`btn-${index}`);
  const revealButton = document.getElementById(`reveal-${index}`);

  checkButton.disabled = false;
  revealButton.disabled = false;

  if (activeQuizType === QUIZ_TYPES.FLAG_COUNTRY_CAPITAL) {
    document.getElementById(`input-country-${index}`).disabled = false;
    document.getElementById(`input-capital-${index}`).disabled = false;
  } else {
    document.getElementById(`input-${index}`).disabled = false;
  }
}

function revealAnswer(index) {
  if (index !== currentIndex) {
    return;
  }

  const feedback = document.getElementById(`fb-${index}`);
  const country = countries[index];
  const currentlyVisible = revealedRows.has(index);
  const nextVisible = toggleRevealState(currentlyVisible);

  if (nextVisible) {
    feedback.textContent = getRevealText(activeQuizType, country);
    feedback.className = "feedback hint";
    revealedRows.add(index);
  } else {
    feedback.textContent = "";
    feedback.className = "feedback";
    revealedRows.delete(index);
  }

  if (activeQuizType === QUIZ_TYPES.FLAG_COUNTRY_CAPITAL) {
    document.getElementById(`input-country-${index}`).focus();
  } else {
    document.getElementById(`input-${index}`).focus();
  }
}

function updateProgress() {
  const percent = Math.round((currentIndex / countries.length) * 100);
  progressBar.style.width = `${percent}%`;

  const progressTrack = document.querySelector(".progress-track");
  progressTrack.setAttribute("aria-valuenow", String(percent));

  stepTag.textContent = `Question ${Math.min(currentIndex + 1, countries.length)} / ${countries.length}`;
}

function updateScoreBadge() {
  liveScore.textContent = `Bonnes reponses: ${score}`;
}

function finishQuiz() {
  highlightActiveRow(-1);

  const percent = Math.round((score / countries.length) * 100);
  finalScore.textContent = `Score final: ${score}/${countries.length} (${percent}%)`;

  restartBtn.classList.remove("hidden");
  refreshRetryButtonLabel();
  updateSavedErrorActionButtonsVisibility();

  if (percent >= 80) {
    launchConfetti();
  }
}

function backToMenu() {
  closeFlagModal();
  quizSection.classList.add("hidden");
  menuSection.classList.remove("hidden");

  activeQuizType = QUIZ_TYPES.CAPITAL_ONLY;
  activeScopeKey = null;
  fullModeList = [];
  countries = [];
  wrongAnswers = [];
  currentIndex = 0;
  score = 0;
  revealedRows = new Set();
  renderScopeCards();
}

function openFlagModal(country) {
  const presentation = getFlagModalPresentation(activeQuizType, country);
  flagModalImage.src = `https://flagcdn.com/w1280/${country.code}.png`;
  flagModalImage.alt = presentation.alt;
  flagModalLabel.textContent = presentation.label;
  flagModalLabel.classList.toggle("hidden", !presentation.showLabel);

  flagModal.classList.remove("hidden");
  flagModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeFlagModal() {
  flagModal.classList.add("hidden");
  flagModal.setAttribute("aria-hidden", "true");
  flagModalImage.src = "";
  flagModalImage.alt = "";
  flagModalLabel.classList.remove("hidden");
  flagModalLabel.textContent = "";
  document.body.classList.remove("modal-open");
}

function loadPersistedErrorHistory() {
  try {
    const raw = localStorage.getItem(ERROR_HISTORY_STORAGE_KEY);
    if (!raw) {
      persistedWrongAnswers = [];
      return;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      persistedWrongAnswers = [];
      return;
    }

    persistedWrongAnswers = mergeUniqueCountryLists([], parsed);
  } catch (_error) {
    persistedWrongAnswers = [];
  }
}

function savePersistedErrorHistory() {
  try {
    localStorage.setItem(ERROR_HISTORY_STORAGE_KEY, JSON.stringify(persistedWrongAnswers));
  } catch (_error) {
    // Ignore storage write failures (private mode / quota)
  }
}

function registerPersistentError(country) {
  persistedWrongAnswers = mergeUniqueCountryLists(persistedWrongAnswers, [country]);
  savePersistedErrorHistory();
  refreshRetryButtonLabel();
}

function resolvePersistentError(country) {
  persistedWrongAnswers = removeCountryFromList(persistedWrongAnswers, country);
  savePersistedErrorHistory();
  refreshRetryButtonLabel();
}

function getRetryCountries() {
  return persistedWrongAnswers.map((entry) => ({ ...entry }));
}

function refreshRetryButtonLabel() {
  retryWrongBtn.textContent = formatRetryButtonLabel(persistedWrongAnswers.length);
}

function clearPersistedErrorHistory() {
  persistedWrongAnswers = [];
  savePersistedErrorHistory();
  refreshRetryButtonLabel();
  updateSavedErrorActionButtonsVisibility();
  renderScopeCards();
}

function updateSavedErrorActionButtonsVisibility() {
  const shouldShow = shouldShowSavedErrorActions(persistedWrongAnswers.length);
  retryWrongBtn.classList.toggle("hidden", !shouldShow);
  clearErrorsBtn.classList.toggle("hidden", !shouldShow);
}

function getMenuScopeOptions() {
  const options = [...baseScopeOptions];
  if (shouldShowSavedErrorActions(persistedWrongAnswers.length)) {
    options.push(buildSavedErrorsScopeOption(persistedWrongAnswers.length));
  }
  return options;
}

function launchConfetti() {
  for (let i = 0; i < 72; i += 1) {
    const particle = document.createElement("div");
    const hue = Math.floor(Math.random() * 360);

    particle.className = "confetti";
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.background = `hsl(${hue}, 90%, 65%)`;
    particle.style.animationDuration = `${Math.random() * 1.7 + 1.9}s`;
    particle.style.transform = `rotate(${Math.random() * 220}deg)`;

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 3800);
  }
}
