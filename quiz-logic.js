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
    CUSTOM_MIX: "customMix",
  };

  const MIX_FILTER_KEYS = {
    OFF: "off",
    ALL: "all",
    MAINLAND: "mainland",
    ISLANDS: "islands",
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

  function autoCapitalizeWords(value) {
    const text = String(value ?? "");
    return text
      .toLocaleLowerCase("fr-FR")
      .replace(/(^|[\s\-'])(\p{L})/gu, (match, separator, letter) => {
        return `${separator}${letter.toLocaleUpperCase("fr-FR")}`;
      });
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

  function getCountryListDedupKey(countryEntry) {
    const codeKey = normalizeText(countryEntry.code || "");
    if (codeKey) {
      return `code:${codeKey}`;
    }

    return [
      normalizeText(countryEntry.country || ""),
      normalizeText(countryEntry.capital || ""),
    ].join("|");
  }

  function getAllCountries(quizData) {
    const all = [];
    const seen = new Set();

    Object.values(quizData).forEach((mode) => {
      mode.countries.forEach((country) => {
        const key = getCountryListDedupKey(country);
        if (seen.has(key)) {
          return;
        }

        seen.add(key);
        all.push({ ...country });
      });
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
        key: QUIZ_SCOPE_KEYS.CUSTOM_MIX,
        name: "Melange Libre",
        iconKey: "mix",
        countLabel: "Multi-zones",
        helper: "Compose tes propres combinaisons",
      },
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

  function getIslandCodeSet(quizData) {
    const islandEntries = quizData?.islands?.countries || [];
    return new Set(
      islandEntries
        .map((entry) => normalizeText(entry.code || ""))
        .filter(Boolean)
    );
  }

  function getCustomMixRegionKeys(quizData) {
    return Object.keys(quizData).filter((key) => key !== "islands");
  }

  function buildCustomMixCountries(quizData, regionFilters = {}) {
    const islandCodeSet = getIslandCodeSet(quizData);
    const regions = getCustomMixRegionKeys(quizData);
    const output = [];
    const seen = new Set();

    regions.forEach((regionKey) => {
      const mode = quizData[regionKey];
      if (!mode || !Array.isArray(mode.countries)) {
        return;
      }

      const filter = regionFilters[regionKey] || MIX_FILTER_KEYS.OFF;
      if (filter === MIX_FILTER_KEYS.OFF) {
        return;
      }

      mode.countries.forEach((country) => {
        const codeKey = normalizeText(country.code || "");
        const isIsland = islandCodeSet.has(codeKey);

        if (filter === MIX_FILTER_KEYS.ISLANDS && !isIsland) {
          return;
        }
        if (filter === MIX_FILTER_KEYS.MAINLAND && isIsland) {
          return;
        }

        const dedupKey = getCountryListDedupKey(country);
        if (seen.has(dedupKey)) {
          return;
        }

        seen.add(dedupKey);
        output.push({ ...country });
      });
    });

    return output;
  }

  function resolveQuestionCountLimit(requestedCount, availableCount) {
    const total = Number(availableCount);
    if (!Number.isFinite(total) || total <= 0) {
      return 0;
    }

    if (
      requestedCount === "all" ||
      requestedCount === null ||
      requestedCount === undefined ||
      requestedCount === ""
    ) {
      return total;
    }

    const parsed = Number(requestedCount);
    if (!Number.isFinite(parsed)) {
      return total;
    }

    const normalized = Math.max(1, Math.floor(parsed));
    return Math.min(normalized, total);
  }

  function formatQuestionCountSelection(requestedCount, availableCount) {
    const limit = resolveQuestionCountLimit(requestedCount, availableCount);
    const total = Number(availableCount);

    if (limit <= 0 || !Number.isFinite(total) || total <= 0) {
      return "0 question";
    }

    if (limit === total) {
      return `Toutes (${limit})`;
    }

    return `${limit} questions`;
  }

  function pickQuizCountries(sourceList, requestedCount, randomFn = Math.random) {
    const list = Array.isArray(sourceList) ? sourceList : [];
    const shuffled = shuffleCopy(list, randomFn);
    const limit = resolveQuestionCountLimit(requestedCount, shuffled.length);
    return shuffled.slice(0, limit);
  }

  function resolveScopeCountries(
    quizData,
    scopeKey,
    randomSampleSize = 15,
    randomFn = Math.random,
    options = {}
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

    if (scopeKey === QUIZ_SCOPE_KEYS.CUSTOM_MIX) {
      return buildCustomMixCountries(quizData, options.regionFilters || {});
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

  function getPostAnswerButtonState() {
    return {
      checkDisabled: true,
      revealDisabled: false,
    };
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

  function shouldGenerateNewRandomSampleOnRestart(scopeKey) {
    return scopeKey === QUIZ_SCOPE_KEYS.RANDOM_15;
  }

  function shouldShowPerfectSavedErrorsMenuButton(scopeKey, score, totalCount) {
    return (
      scopeKey === QUIZ_SCOPE_KEYS.SAVED_ERRORS &&
      Number(totalCount) > 0 &&
      Number(score) === Number(totalCount)
    );
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
    MIX_FILTER_KEYS,
    normalizeText,
    normalizeTextRelaxed,
    autoCapitalizeWords,
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
    getIslandCodeSet,
    getCustomMixRegionKeys,
    buildCustomMixCountries,
    resolveQuestionCountLimit,
    formatQuestionCountSelection,
    pickQuizCountries,
    resolveScopeCountries,
    getRevealText,
    toggleRevealState,
    getPostAnswerButtonState,
    getCountryStableKey,
    mergeUniqueCountryLists,
    formatRetryButtonLabel,
    formatClearErrorsButtonLabel,
    shouldShowSavedErrorActions,
    shouldGenerateNewRandomSampleOnRestart,
    shouldShowPerfectSavedErrorsMenuButton,
    buildSavedErrorsScopeOption,
    removeCountryFromList,
    getFlagModalPresentation,
    getCompletionPercent,
    getNextUnansweredIndex,
    alignEntriesWithQuizData,
    resolvePreferredScopeKey,
  };
});
