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

  function buildAcceptedAnswers(primaryValue, alternates = []) {
    return [primaryValue, ...alternates]
      .map(normalizeText)
      .filter(Boolean);
  }

  function isCapitalAnswerCorrect(countryEntry, userCapital) {
    const acceptedCapitalAnswers = buildAcceptedAnswers(
      countryEntry.capital,
      countryEntry.alternates || []
    );
    return acceptedCapitalAnswers.includes(normalizeText(userCapital));
  }

  function isFlagChallengeCorrect(countryEntry, userCountry, userCapital) {
    const acceptedCountryAnswers = buildAcceptedAnswers(
      countryEntry.country,
      countryEntry.countryAlternates || []
    );
    const acceptedCapitalAnswers = buildAcceptedAnswers(
      countryEntry.capital,
      countryEntry.alternates || []
    );

    const countryIsCorrect = acceptedCountryAnswers.includes(normalizeText(userCountry));
    const capitalIsCorrect = acceptedCapitalAnswers.includes(normalizeText(userCapital));
    return countryIsCorrect && capitalIsCorrect;
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
      badge: mode.emoji || key.toUpperCase().slice(0, 2),
      countLabel: `${mode.countries.length} pays`,
      helper: "Uniquement cette zone",
    }));

    const allCount = getAllCountries(quizData).length;
    const sampleSize = Math.min(randomSampleSize, allCount);

    return [
      ...regionOptions,
      {
        key: QUIZ_SCOPE_KEYS.ALL,
        name: "Tous les pays",
        badge: "ALL",
        countLabel: `${allCount} pays`,
        helper: "Toutes les zones",
      },
      {
        key: QUIZ_SCOPE_KEYS.RANDOM_15,
        name: `${sampleSize} aleatoires`,
        badge: String(sampleSize),
        countLabel: `${sampleSize} questions`,
        helper: "Melange de toute l'app",
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
    return `Reponse: ${countryEntry.capital}`;
  }

  function toggleRevealState(isCurrentlyVisible) {
    return !isCurrentlyVisible;
  }

  function getCountryStableKey(countryEntry) {
    return [
      normalizeText(countryEntry.code || ""),
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

  function buildSavedErrorsScopeOption(savedCount) {
    const count = Math.max(0, Number(savedCount) || 0);
    return {
      key: QUIZ_SCOPE_KEYS.SAVED_ERRORS,
      name: "Mode Erreurs",
      badge: "ERR",
      countLabel: `${count} a corriger`,
      helper: "Disponible car erreurs sauvegardees",
    };
  }

  function removeCountryFromList(list, countryEntry) {
    const keyToRemove = getCountryStableKey(countryEntry);
    return list
      .filter((entry) => getCountryStableKey(entry) !== keyToRemove)
      .map((entry) => ({ ...entry }));
  }

  function getFlagModalPresentation(quizType, countryEntry) {
    const isFlagChallenge = quizType === "flag-country-capital";
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

  return {
    QUIZ_SCOPE_KEYS,
    normalizeText,
    buildAcceptedAnswers,
    isCapitalAnswerCorrect,
    isFlagChallengeCorrect,
    shuffleCopy,
    getAllCountries,
    buildScopeOptions,
    resolveScopeCountries,
    getRevealText,
    toggleRevealState,
    getCountryStableKey,
    mergeUniqueCountryLists,
    formatRetryButtonLabel,
    shouldShowSavedErrorActions,
    buildSavedErrorsScopeOption,
    removeCountryFromList,
    getFlagModalPresentation,
  };
});
