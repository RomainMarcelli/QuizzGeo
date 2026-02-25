(function initQuizLogic(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.QuizLogic = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createQuizLogic() {
  const QUIZ_SCOPE_KEYS = {
    ALL: "all",
    RANDOM_15: "random15",
    SAVED_ERRORS: "savedErrors",
  };

  function normalizeText(text) {
    return String(text ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function normalizeTextRelaxed(text) {
    const tokens = String(text ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => (token === "iles" ? "ile" : token))
      .filter((token) => token !== "ile")
      .map((token) => {
        if (token.endsWith("s") && token.length > 3) {
          return token.slice(0, -1);
        }
        return token;
      });

    return tokens.join("");
  }

  function buildAcceptedAnswers(primaryValue, alternates = []) {
    return [primaryValue, ...alternates]
      .map(normalizeText)
      .filter(Boolean);
  }

  function getAnswerSignatures(value) {
    const text = String(value ?? "");
    const withoutParenthetical = text.replace(/\([^)]*\)/g, " ");

    const strict = normalizeText(text);
    const relaxed = normalizeTextRelaxed(text);
    const strictNoParen = normalizeText(withoutParenthetical);
    const relaxedNoParen = normalizeTextRelaxed(withoutParenthetical);

    return Array.from(
      new Set([strict, relaxed, strictNoParen, relaxedNoParen].filter(Boolean))
    );
  }

  function areAnswersEquivalent(userValue, expectedValues) {
    const userSignatures = getAnswerSignatures(userValue);
    const expectedSignatures = new Set(
      expectedValues.flatMap((value) => getAnswerSignatures(value))
    );

    return userSignatures.some((signature) => expectedSignatures.has(signature));
  }

  function isCapitalAnswerCorrect(countryEntry, userCapital) {
    const expectedValues = [countryEntry.capital, ...(countryEntry.alternates || [])];

    // Compatibilite historique: des anciennes sessions pouvaient stocker
    // "Vatican City" comme capitale pour le code "va".
    if (normalizeText(countryEntry.code) === "va") {
      expectedValues.push("Vatican", "Vatican City");
    }

    return areAnswersEquivalent(userCapital, expectedValues);
  }

  function isCountryAnswerCorrect(countryEntry, userCountry) {
    const expectedValues = [countryEntry.country, ...(countryEntry.countryAlternates || [])];

    // Compatibilite historique: meme logique que la capitale pour Vatican.
    if (normalizeText(countryEntry.code) === "va") {
      expectedValues.push("Vatican");
    }

    return areAnswersEquivalent(userCountry, expectedValues);
  }

  function isFlagChallengeCorrect(countryEntry, userCountry, userCapital) {
    const countryIsCorrect = isCountryAnswerCorrect(countryEntry, userCountry);
    const capitalIsCorrect = isCapitalAnswerCorrect(countryEntry, userCapital);
    return countryIsCorrect && capitalIsCorrect;
  }

  function getFlagChallengeErrorType(countryIsCorrect, capitalIsCorrect) {
    if (countryIsCorrect && capitalIsCorrect) {
      return "none";
    }
    if (!countryIsCorrect && !capitalIsCorrect) {
      return "country-and-capital";
    }
    if (!countryIsCorrect) {
      return "country";
    }
    return "capital";
  }

  function formatFlagChallengeWrongFeedback(errorType, countryEntry) {
    if (errorType === "country") {
      return `Faux: pays seulement (attendu: ${countryEntry.country})`;
    }
    if (errorType === "capital") {
      return `Faux: capitale seulement (attendu: ${countryEntry.capital})`;
    }
    return `Faux: pays + capitale (attendu: ${countryEntry.country} - ${countryEntry.capital})`;
  }

  function shuffleCopy(list, randomFn = Math.random) {
    const output = [...list];
    for (let i = output.length - 1; i > 0; i -= 1) {
      const j = Math.floor(randomFn() * (i + 1));
      [output[i], output[j]] = [output[j], output[i]];
    }
    return output;
  }

  function getAllCountries(quizData) {
    const all = [];
    Object.values(quizData).forEach((mode) => {
      mode.countries.forEach((country) => all.push({ ...country }));
    });
    return all;
  }

  function buildScopeOptions(quizData, randomSampleSize = 15) {
    const regionOptions = Object.entries(quizData).map(([key, mode]) => ({
      key,
      name: mode.name,
      iconKey: key,
      countLabel: `${mode.countries.length} pays`,
      helper: "Uniquement cette zone",
    }));

    const allCount = getAllCountries(quizData).length;
    const sampleSize = Math.min(randomSampleSize, allCount);

    return [
      ...regionOptions,
      {
        key: QUIZ_SCOPE_KEYS.ALL,
        name: "Tour du Monde",
        iconKey: "all",
        countLabel: `${allCount} pays`,
        helper: "Toutes les zones en une session",
      },
      {
        key: QUIZ_SCOPE_KEYS.RANDOM_15,
        name: "Sprint 15",
        iconKey: "random15",
        countLabel: `${sampleSize} questions`,
        helper: "Melange rapide de toute l'app",
      },
    ];
  }

  function resolveScopeCountries(
    quizData,
    scopeKey,
    randomSampleSize = 15,
    randomFn = Math.random
  ) {
    if (quizData[scopeKey]) {
      return quizData[scopeKey].countries.map((country) => ({ ...country }));
    }

    if (scopeKey === QUIZ_SCOPE_KEYS.ALL) {
      return getAllCountries(quizData);
    }

    if (scopeKey === QUIZ_SCOPE_KEYS.RANDOM_15) {
      const all = getAllCountries(quizData);
      return shuffleCopy(all, randomFn).slice(0, Math.min(randomSampleSize, all.length));
    }

    throw new Error(`Unknown scope key: ${scopeKey}`);
  }

  function getRevealText(quizType, countryEntry) {
    if (quizType === "flag-country-capital") {
      return `Reponse: ${countryEntry.country} - ${countryEntry.capital}`;
    }
    if (quizType === "country-only") {
      return `Reponse: ${countryEntry.country}`;
    }
    return `Reponse: ${countryEntry.capital}`;
  }

  function toggleRevealState(isCurrentlyVisible) {
    return !isCurrentlyVisible;
  }

  function getCountryStableKey(countryEntry) {
    const codeKey = normalizeText(countryEntry.code || "");
    if (codeKey) {
      return `code:${codeKey}`;
    }

    return [
      normalizeText(countryEntry.country || ""),
      normalizeText(countryEntry.capital || ""),
    ].join("|");
  }

  function mergeUniqueCountryLists(baseList, incomingList) {
    const output = [];
    const seen = new Set();

    [...baseList, ...incomingList].forEach((entry) => {
      if (!entry || !entry.country || !entry.capital || !entry.code) {
        return;
      }

      const key = getCountryStableKey(entry);
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      output.push({ ...entry });
    });

    return output;
  }

  function formatRetryButtonLabel(count) {
    if (count <= 0) {
      return "Rejouer les erreurs";
    }
    return `Rejouer les erreurs (${count})`;
  }

  function shouldShowSavedErrorActions(savedCount) {
    return Number(savedCount) > 0;
  }

  function formatClearErrorsButtonLabel(count) {
    if (count <= 0) {
      return "Reinitialiser les erreurs";
    }
    return `Reinitialiser les erreurs (${count})`;
  }

  function buildSavedErrorsScopeOption(savedCount) {
    const count = Math.max(0, Number(savedCount) || 0);
    return {
      key: QUIZ_SCOPE_KEYS.SAVED_ERRORS,
      name: "Revision Ciblee",
      iconKey: "savedErrors",
      countLabel: `${count} a corriger`,
      helper: "Rejoue uniquement ce que tu as rate",
    };
  }

  function removeCountryFromList(list, countryEntry) {
    const keyToRemove = getCountryStableKey(countryEntry);
    return list
      .filter((entry) => getCountryStableKey(entry) !== keyToRemove)
      .map((entry) => ({ ...entry }));
  }

  function getFlagModalPresentation(quizType, countryEntry) {
    const isFlagChallenge =
      quizType === "flag-country-capital" || quizType === "country-only";
    if (isFlagChallenge) {
      return {
        alt: "Drapeau a deviner",
        label: "",
        showLabel: false,
      };
    }

    return {
      alt: `Drapeau de ${countryEntry.country}`,
      label: countryEntry.country,
      showLabel: true,
    };
  }

  function getCompletionPercent(answeredCount, totalCount) {
    const safeTotal = Number(totalCount);
    if (!Number.isFinite(safeTotal) || safeTotal <= 0) {
      return 0;
    }

    const safeAnswered = Number.isFinite(Number(answeredCount))
      ? Math.max(0, Math.min(Number(answeredCount), safeTotal))
      : 0;

    return Math.round((safeAnswered / safeTotal) * 100);
  }

  function getNextUnansweredIndex(answeredIndexes, totalCount, preferredStartIndex = 0) {
    const safeTotal = Number(totalCount);
    if (!Number.isInteger(safeTotal) || safeTotal <= 0) {
      return -1;
    }

    const answeredSet = new Set(answeredIndexes || []);
    if (answeredSet.size >= safeTotal) {
      return -1;
    }

    const start = Number.isInteger(preferredStartIndex)
      ? ((preferredStartIndex % safeTotal) + safeTotal) % safeTotal
      : 0;

    for (let offset = 0; offset < safeTotal; offset += 1) {
      const candidate = (start + offset) % safeTotal;
      if (!answeredSet.has(candidate)) {
        return candidate;
      }
    }

    return -1;
  }

  function alignEntriesWithQuizData(entries, quizData) {
    if (!Array.isArray(entries)) {
      return [];
    }

    const codeToCountry = new Map();
    getAllCountries(quizData).forEach((entry) => {
      const codeKey = normalizeText(entry.code || "");
      if (codeKey && !codeToCountry.has(codeKey)) {
        codeToCountry.set(codeKey, { ...entry });
      }
    });

    return entries
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => {
        const codeKey = normalizeText(entry.code || "");
        if (codeKey && codeToCountry.has(codeKey)) {
          return { ...codeToCountry.get(codeKey) };
        }
        return { ...entry };
      });
  }

  function resolvePreferredScopeKey(scopeOptions, preferredKey) {
    if (!Array.isArray(scopeOptions) || scopeOptions.length === 0) {
      return null;
    }

    if (scopeOptions.some((option) => option.key === preferredKey)) {
      return preferredKey;
    }

    return scopeOptions[0].key;
  }

  return {
    QUIZ_SCOPE_KEYS,
    normalizeText,
    normalizeTextRelaxed,
    buildAcceptedAnswers,
    getAnswerSignatures,
    areAnswersEquivalent,
    isCountryAnswerCorrect,
    isCapitalAnswerCorrect,
    isFlagChallengeCorrect,
    getFlagChallengeErrorType,
    formatFlagChallengeWrongFeedback,
    shuffleCopy,
    getAllCountries,
    buildScopeOptions,
    resolveScopeCountries,
    getRevealText,
    toggleRevealState,
    getCountryStableKey,
    mergeUniqueCountryLists,
    formatRetryButtonLabel,
    formatClearErrorsButtonLabel,
    shouldShowSavedErrorActions,
    buildSavedErrorsScopeOption,
    removeCountryFromList,
    getFlagModalPresentation,
    getCompletionPercent,
    getNextUnansweredIndex,
    alignEntriesWithQuizData,
    resolvePreferredScopeKey,
  };
});
