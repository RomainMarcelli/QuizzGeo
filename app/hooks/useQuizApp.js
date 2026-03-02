"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QuizLogicRaw from "../../quiz-logic";
import QuizDataRaw from "../../data";

const QuizLogic = QuizLogicRaw?.default ?? QuizLogicRaw;
const QUIZ_DATA = QuizDataRaw?.default ?? QuizDataRaw;

export const QUIZ_TYPES = {
  CAPITAL_ONLY: "capital-only",
  COUNTRY_ONLY: "country-only",
  FLAG_COUNTRY_CAPITAL: "flag-country-capital",
  CAPITAL_TO_COUNTRY: "capital-to-country",
};

export const QUESTION_COUNT_OPTIONS = ["all", 5, 10, 15, 20, 30, 50];
export const RANDOM_SAMPLE_SIZE = 15;

const ERROR_HISTORY_STORAGE_KEY = "quiz.error.history.v1";

function normalizeQuestionCountValue(value) {
  const normalized = String(value ?? "all");
  if (QUESTION_COUNT_OPTIONS.map(String).includes(normalized)) {
    return normalized;
  }
  return "all";
}

function createDefaultMixFilters(regionKeys, defaultValue) {
  const output = {};
  regionKeys.forEach((regionKey) => {
    output[regionKey] = defaultValue;
  });
  return output;
}

function toQuestionState(country) {
  return {
    country,
    countryInput: "",
    capitalInput: "",
    singleInput: "",
    answered: false,
    isCorrect: false,
    revealed: false,
    feedback: "",
    feedbackType: "",
    wrongFeedback: "",
  };
}

function launchConfetti() {
  if (typeof document === "undefined") {
    return;
  }

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

function formatExpectedCountryList(countries) {
  const seen = new Set();
  const names = [];
  countries.forEach((entry) => {
    if (!entry || !entry.country) {
      return;
    }
    const key = String(entry.code || entry.country).toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    names.push(entry.country);
  });
  return names.join(" / ");
}

export function useQuizApp() {
  const baseScopeOptions = useMemo(
    () => QuizLogic.buildScopeOptions(QUIZ_DATA, RANDOM_SAMPLE_SIZE),
    []
  );
  const mixRegionKeys = useMemo(() => QuizLogic.getCustomMixRegionKeys(QUIZ_DATA), []);

  const [errorHistory, setErrorHistory] = useState([]);
  const [errorHistoryLoaded, setErrorHistoryLoaded] = useState(false);

  const [selectedMenuQuizType, setSelectedMenuQuizType] = useState(QUIZ_TYPES.CAPITAL_ONLY);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState("all");
  const [selectedMixFilters, setSelectedMixFilters] = useState(() =>
    createDefaultMixFilters(mixRegionKeys, QuizLogic.MIX_FILTER_KEYS.OFF)
  );
  const [selectedSprintFilters, setSelectedSprintFilters] = useState(() =>
    createDefaultMixFilters(mixRegionKeys, QuizLogic.MIX_FILTER_KEYS.ALL)
  );

  const [showMixConfigPanel, setShowMixConfigPanel] = useState(false);
  const [pendingMixScopeKey, setPendingMixScopeKey] = useState(QuizLogic.QUIZ_SCOPE_KEYS.CUSTOM_MIX);
  const [mixValidationMessage, setMixValidationMessage] = useState("");

  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [activeQuizType, setActiveQuizType] = useState(QUIZ_TYPES.CAPITAL_ONLY);
  const [activeScopeKey, setActiveScopeKey] = useState(null);
  const [activeQuestionCount, setActiveQuestionCount] = useState("all");
  const [activeMixFilters, setActiveMixFilters] = useState({});
  const [fullModeList, setFullModeList] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [showInQuizModePanel, setShowInQuizModePanel] = useState(false);
  const [quickQuizType, setQuickQuizType] = useState(QUIZ_TYPES.CAPITAL_ONLY);
  const [quickScopeKey, setQuickScopeKey] = useState(null);
  const [quickQuestionCount, setQuickQuestionCount] = useState("all");

  const [flagModalCountry, setFlagModalCountry] = useState(null);

  const rowRefs = useRef({});
  const countryInputRefs = useRef({});
  const singleInputRefs = useRef({});
  const hasCelebratedRef = useRef(false);

  const answeredCount = useMemo(
    () => questions.reduce((count, row) => count + (row.answered ? 1 : 0), 0),
    [questions]
  );
  const correctCount = useMemo(
    () => questions.reduce((count, row) => count + (row.answered && row.isCorrect ? 1 : 0), 0),
    [questions]
  );
  const isQuizFinished = questions.length > 0 && answeredCount === questions.length;
  const finalPercent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const menuScopeOptions = useMemo(() => {
    const options = [...baseScopeOptions];
    if (QuizLogic.shouldShowSavedErrorActions(errorHistory.length)) {
      options.push(QuizLogic.buildSavedErrorsScopeOption(errorHistory.length));
    }
    return options;
  }, [baseScopeOptions, errorHistory.length]);

  const activeScopeName = useMemo(() => {
    if (!activeScopeKey) {
      return "";
    }
    const option = menuScopeOptions.find((item) => item.key === activeScopeKey);
    return option ? option.name : activeScopeKey;
  }, [activeScopeKey, menuScopeOptions]);

  const modeTagText = useMemo(() => {
    if (!activeScopeKey || fullModeList.length === 0) {
      return "";
    }
    const quizLabel =
      activeQuizType === QUIZ_TYPES.COUNTRY_ONLY
        ? "Pays"
        : activeQuizType === QUIZ_TYPES.CAPITAL_ONLY
          ? "Capitales"
          : activeQuizType === QUIZ_TYPES.CAPITAL_TO_COUNTRY
            ? "Capitale -> Pays"
            : "Pays + Capitale";

    return `${quizLabel} | ${activeScopeName} | ${QuizLogic.formatQuestionCountSelection(
      activeQuestionCount,
      fullModeList.length
    )}`;
  }, [activeScopeKey, fullModeList.length, activeQuizType, activeScopeName, activeQuestionCount]);

  const completionPercent = QuizLogic.getCompletionPercent(answeredCount, questions.length);
  const liveProgressText = `Traitees ${answeredCount} / ${questions.length}`;
  const finalScoreText = isQuizFinished
    ? `Score final: ${correctCount}/${questions.length} (${finalPercent}%)`
    : "";

  const retryButtonLabel = QuizLogic.formatRetryButtonLabel(errorHistory.length);
  const clearErrorsLabel = QuizLogic.formatClearErrorsButtonLabel(errorHistory.length);
  const canShowSavedErrorActions = QuizLogic.shouldShowSavedErrorActions(errorHistory.length);

  const showPerfectMenuButton = QuizLogic.shouldShowPerfectSavedErrorsMenuButton(
    activeScopeKey,
    correctCount,
    questions.length
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ERROR_HISTORY_STORAGE_KEY);
      if (!raw) {
        setErrorHistory([]);
        setErrorHistoryLoaded(true);
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setErrorHistory([]);
        setErrorHistoryLoaded(true);
        return;
      }
      const aligned = QuizLogic.alignEntriesWithQuizData(parsed, QUIZ_DATA);
      setErrorHistory(QuizLogic.mergeUniqueCountryLists([], aligned));
      setErrorHistoryLoaded(true);
    } catch (_error) {
      setErrorHistory([]);
      setErrorHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!errorHistoryLoaded) {
      return;
    }
    try {
      localStorage.setItem(ERROR_HISTORY_STORAGE_KEY, JSON.stringify(errorHistory));
    } catch (_error) {
      // Ignore storage failures.
    }
  }, [errorHistory, errorHistoryLoaded]);

  useEffect(() => {
    const resolved = QuizLogic.resolvePreferredScopeKey(menuScopeOptions, quickScopeKey || activeScopeKey);
    setQuickScopeKey(resolved);
  }, [menuScopeOptions, quickScopeKey, activeScopeKey]);

  useEffect(() => {
    if (flagModalCountry) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [flagModalCountry]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setFlagModalCountry(null);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (isQuizFinished && finalPercent >= 80 && !hasCelebratedRef.current) {
      hasCelebratedRef.current = true;
      launchConfetti();
      return;
    }
    if (!isQuizFinished) {
      hasCelebratedRef.current = false;
    }
  }, [isQuizFinished, finalPercent]);

  const setFocusOnQuestion = useCallback(
    (index, quizType = activeQuizType) => {
      setTimeout(() => {
        if (index < 0) {
          return;
        }
        if (
          quizType === QUIZ_TYPES.COUNTRY_ONLY ||
          quizType === QUIZ_TYPES.FLAG_COUNTRY_CAPITAL ||
          quizType === QUIZ_TYPES.CAPITAL_TO_COUNTRY
        ) {
          const input = countryInputRefs.current[index];
          if (input) {
            input.focus();
            if (typeof input.select === "function") {
              input.select();
            }
          }
        } else {
          const input = singleInputRefs.current[index];
          if (input) {
            input.focus();
            if (typeof input.select === "function") {
              input.select();
            }
          }
        }

        const row = rowRefs.current[index];
        if (row && typeof row.scrollIntoView === "function") {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 0);
    },
    [activeQuizType]
  );

  const getRetryCountries = useCallback(
    () => QuizLogic.mergeUniqueCountryLists([], QuizLogic.alignEntriesWithQuizData(errorHistory, QUIZ_DATA)),
    [errorHistory]
  );

  const resolveScopeCountriesForStart = useCallback(
    (scopeKey, filters) => {
      if (scopeKey === QuizLogic.QUIZ_SCOPE_KEYS.SAVED_ERRORS) {
        return getRetryCountries();
      }
      if (scopeKey === QuizLogic.QUIZ_SCOPE_KEYS.CUSTOM_MIX) {
        return QuizLogic.buildCustomMixCountries(QUIZ_DATA, filters);
      }
      if (scopeKey === QuizLogic.QUIZ_SCOPE_KEYS.RANDOM_15) {
        return QuizLogic.resolveScopeCountries(
          QUIZ_DATA,
          scopeKey,
          RANDOM_SAMPLE_SIZE,
          Math.random,
          { regionFilters: filters }
        );
      }
      return QuizLogic.resolveScopeCountries(QUIZ_DATA, scopeKey, RANDOM_SAMPLE_SIZE);
    },
    [getRetryCountries]
  );

  const startQuiz = useCallback(
    (sourceList, questionCountValue, quizTypeForFocus) => {
      if (!Array.isArray(sourceList) || sourceList.length === 0) {
        setIsMenuVisible(true);
        setQuestions([]);
        return;
      }

      const pickedCountries = QuizLogic.pickQuizCountries(sourceList, questionCountValue);
      if (!pickedCountries.length) {
        setIsMenuVisible(true);
        setQuestions([]);
        return;
      }

      setQuestions(pickedCountries.map(toQuestionState));
      setShowInQuizModePanel(false);
      setFocusOnQuestion(0, quizTypeForFocus);
    },
    [setFocusOnQuestion]
  );

  const startMode = useCallback(
    (quizType, scopeKey, questionCountOverride = selectedQuestionCount) => {
      const normalizedQuestionCount = normalizeQuestionCountValue(questionCountOverride);
      let filters = {};

      if (scopeKey === QuizLogic.QUIZ_SCOPE_KEYS.CUSTOM_MIX) {
        filters = { ...selectedMixFilters };
        if (!QuizLogic.hasActiveRegionFilters(filters)) {
          setPendingMixScopeKey(QuizLogic.QUIZ_SCOPE_KEYS.CUSTOM_MIX);
          setShowMixConfigPanel(true);
          setMixValidationMessage("Selectionne au moins une zone pour lancer le melange.");
          return;
        }
      }

      if (scopeKey === QuizLogic.QUIZ_SCOPE_KEYS.RANDOM_15) {
        filters = { ...selectedSprintFilters };
        if (!QuizLogic.hasActiveRegionFilters(filters)) {
          setPendingMixScopeKey(QuizLogic.QUIZ_SCOPE_KEYS.RANDOM_15);
          setShowMixConfigPanel(true);
          setMixValidationMessage("Selectionne au moins une zone pour lancer le sprint.");
          return;
        }
      }

      const sourceList = resolveScopeCountriesForStart(scopeKey, filters);
      if (!sourceList.length) {
        setIsMenuVisible(true);
        setQuestions([]);
        return;
      }

      setActiveQuizType(quizType);
      setActiveScopeKey(scopeKey);
      setActiveQuestionCount(normalizedQuestionCount);
      setActiveMixFilters(filters);
      setFullModeList(sourceList);
      setIsMenuVisible(false);
      setShowMixConfigPanel(false);
      setMixValidationMessage("");
      setQuickQuizType(quizType);
      setQuickQuestionCount(normalizedQuestionCount);
      setQuickScopeKey(scopeKey);
      startQuiz(sourceList, normalizedQuestionCount, quizType);
    },
    [
      selectedQuestionCount,
      selectedMixFilters,
      selectedSprintFilters,
      resolveScopeCountriesForStart,
      startQuiz,
    ]
  );

  const restartQuiz = useCallback(() => {
    let sourceList = [];

    if (activeScopeKey === QuizLogic.QUIZ_SCOPE_KEYS.SAVED_ERRORS) {
      sourceList = getRetryCountries();
    } else if (activeScopeKey === QuizLogic.QUIZ_SCOPE_KEYS.CUSTOM_MIX) {
      sourceList = QuizLogic.buildCustomMixCountries(QUIZ_DATA, activeMixFilters);
    } else if (QuizLogic.shouldGenerateNewRandomSampleOnRestart(activeScopeKey)) {
      sourceList = QuizLogic.resolveScopeCountries(
        QUIZ_DATA,
        activeScopeKey,
        RANDOM_SAMPLE_SIZE,
        Math.random,
        { regionFilters: activeMixFilters }
      );
    } else {
      sourceList = fullModeList;
    }

    setFullModeList(sourceList);
    startQuiz(sourceList, activeQuestionCount, activeQuizType);
  }, [
    activeScopeKey,
    getRetryCountries,
    activeMixFilters,
    fullModeList,
    startQuiz,
    activeQuestionCount,
    activeQuizType,
  ]);

  const refreshCurrentDraw = useCallback(() => {
    if (!activeScopeKey) {
      return;
    }
    const sourceList = resolveScopeCountriesForStart(activeScopeKey, activeMixFilters);
    if (!sourceList.length) {
      setIsMenuVisible(true);
      setQuestions([]);
      return;
    }
    setFullModeList(sourceList);
    startQuiz(sourceList, activeQuestionCount, activeQuizType);
  }, [activeScopeKey, resolveScopeCountriesForStart, activeMixFilters, startQuiz, activeQuestionCount, activeQuizType]);

  const backToMenu = useCallback(() => {
    setFlagModalCountry(null);
    setQuestions([]);
    setIsMenuVisible(true);
    setActiveScopeKey(null);
    setActiveMixFilters({});
    setFullModeList([]);
    setShowInQuizModePanel(false);
  }, []);

  const clearPersistedErrorHistory = useCallback(() => {
    setErrorHistory([]);
  }, []);

  const applyInQuizModeSelection = useCallback(() => {
    if (!quickScopeKey) {
      return;
    }
    setSelectedQuestionCount(normalizeQuestionCountValue(quickQuestionCount));
    setSelectedMenuQuizType(quickQuizType);
    startMode(quickQuizType, quickScopeKey, quickQuestionCount);
  }, [quickScopeKey, quickQuestionCount, quickQuizType, startMode]);

  const startConfiguredMixMode = useCallback(() => {
    startMode(selectedMenuQuizType, pendingMixScopeKey, selectedQuestionCount);
  }, [startMode, selectedMenuQuizType, pendingMixScopeKey, selectedQuestionCount]);

  const openMixConfigPanel = useCallback((scopeKey) => {
    setPendingMixScopeKey(scopeKey);
    setMixValidationMessage("");
    setShowMixConfigPanel(true);
  }, []);

  const setMixRegionFilter = useCallback(
    (regionKey, filterValue) => {
      setMixValidationMessage("");
      if (pendingMixScopeKey === QuizLogic.QUIZ_SCOPE_KEYS.RANDOM_15) {
        setSelectedSprintFilters((prev) => ({ ...prev, [regionKey]: filterValue }));
      } else {
        setSelectedMixFilters((prev) => ({ ...prev, [regionKey]: filterValue }));
      }
    },
    [pendingMixScopeKey]
  );

  const updateRowInput = useCallback((index, key, value) => {
    const normalized = QuizLogic.autoCapitalizeWords(value);
    setQuestions((prev) => {
      if (!prev[index] || prev[index].answered) {
        return prev;
      }
      const next = [...prev];
      next[index] = {
        ...next[index],
        [key]: normalized,
      };
      return next;
    });
  }, []);

  const revealRow = useCallback(
    (index) => {
      setQuestions((prev) => {
        if (!prev[index]) {
          return prev;
        }
        const next = [...prev];
        const current = next[index];

        if (!current.revealed) {
          next[index] = {
            ...current,
            revealed: true,
            feedback: QuizLogic.getRevealText(activeQuizType, current.country),
            feedbackType: "hint",
          };
          return next;
        }

        if (current.answered && !current.isCorrect) {
          next[index] = {
            ...current,
            revealed: false,
            feedback: current.wrongFeedback,
            feedbackType: "wrong",
          };
          return next;
        }

        next[index] = {
          ...current,
          revealed: false,
          feedback: "",
          feedbackType: "",
        };
        return next;
      });
    },
    [activeQuizType]
  );

  const checkRow = useCallback(
    (index) => {
      const row = questions[index];
      if (!row || row.answered) {
        return;
      }

      let isCorrect = false;
      let wrongFeedback = "";

      if (activeQuizType === QUIZ_TYPES.FLAG_COUNTRY_CAPITAL) {
        const countryIsCorrect = QuizLogic.isCountryAnswerCorrect(row.country, row.countryInput);
        const capitalIsCorrect = QuizLogic.isCapitalAnswerCorrect(row.country, row.capitalInput);
        const errorType = QuizLogic.getFlagChallengeErrorType(countryIsCorrect, capitalIsCorrect);
        isCorrect = errorType === "none";
        wrongFeedback = isCorrect
          ? ""
          : QuizLogic.formatFlagChallengeWrongFeedback(errorType, row.country);
      } else if (activeQuizType === QUIZ_TYPES.COUNTRY_ONLY) {
        isCorrect = QuizLogic.isCountryAnswerCorrect(row.country, row.countryInput);
        wrongFeedback = isCorrect ? "" : `Faux: ${row.country.country}`;
      } else if (activeQuizType === QUIZ_TYPES.CAPITAL_TO_COUNTRY) {
        isCorrect = QuizLogic.isCountryAnswerCorrectForCapital(
          QUIZ_DATA,
          row.country,
          row.countryInput
        );
        if (!isCorrect) {
          const matchingCountries = QuizLogic.getCountriesMatchingCapital(QUIZ_DATA, row.country);
          const expectedCountries = matchingCountries.length > 0 ? matchingCountries : [row.country];
          wrongFeedback = `Faux: ${formatExpectedCountryList(expectedCountries)}`;
        }
      } else {
        isCorrect = QuizLogic.isCapitalAnswerCorrect(row.country, row.singleInput);
        wrongFeedback = isCorrect ? "" : `Faux: ${row.country.capital}`;
      }

      if (isCorrect) {
        setErrorHistory((prev) => QuizLogic.removeCountryFromList(prev, row.country));
      } else {
        setErrorHistory((prev) => QuizLogic.mergeUniqueCountryLists(prev, [row.country]));
      }

      const nextQuestions = [...questions];
      nextQuestions[index] = {
        ...row,
        answered: true,
        isCorrect,
        revealed: false,
        wrongFeedback,
        feedback: isCorrect ? "" : wrongFeedback,
        feedbackType: isCorrect ? "" : "wrong",
      };
      setQuestions(nextQuestions);

      const answeredIndexes = nextQuestions
        .map((entry, rowIndex) => (entry.answered ? rowIndex : null))
        .filter((value) => value !== null);
      const nextIndex = QuizLogic.getNextUnansweredIndex(answeredIndexes, nextQuestions.length, index + 1);
      if (nextIndex !== -1) {
        setFocusOnQuestion(nextIndex);
      }
    },
    [questions, activeQuizType, setFocusOnQuestion]
  );

  const retryErrorSession = useCallback(() => {
    const retryCountries = getRetryCountries();
    setFullModeList(retryCountries);
    setActiveScopeKey(QuizLogic.QUIZ_SCOPE_KEYS.SAVED_ERRORS);
    startQuiz(retryCountries, activeQuestionCount, activeQuizType);
  }, [getRetryCountries, startQuiz, activeQuestionCount, activeQuizType]);

  const nextUnansweredIndex = useMemo(() => {
    const answeredIndexes = questions
      .map((row, index) => (row.answered ? index : null))
      .filter((value) => value !== null);
    return QuizLogic.getNextUnansweredIndex(answeredIndexes, questions.length, 0);
  }, [questions]);

  const flagModalPresentation = flagModalCountry
    ? QuizLogic.getFlagModalPresentation(activeQuizType, flagModalCountry)
    : null;

  return {
    quizData: QUIZ_DATA,
    quizLogic: QuizLogic,
    quizTypes: QUIZ_TYPES,
    questionCountOptions: QUESTION_COUNT_OPTIONS,
    mixRegionKeys,
    isMenuVisible,
    selectedMenuQuizType,
    setSelectedMenuQuizType,
    selectedQuestionCount,
    setSelectedQuestionCount,
    menuScopeOptions,
    showMixConfigPanel,
    pendingMixScopeKey,
    setPendingMixScopeKey,
    mixValidationMessage,
    currentPendingFilters:
      pendingMixScopeKey === QuizLogic.QUIZ_SCOPE_KEYS.RANDOM_15
        ? selectedSprintFilters
        : selectedMixFilters,
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
    showRetryButton: isQuizFinished && canShowSavedErrorActions,
    showClearErrorsButton: isQuizFinished && canShowSavedErrorActions,
    showPerfectMenuButton: isQuizFinished && showPerfectMenuButton,
    restartQuiz,
    finalScoreText,
    flagModalCountry,
    flagModalPresentation,
    setFlagModalCountry,
  };
}
