(function registerQuizConstants(root) {
  const modules = (root.QuizAppModules = root.QuizAppModules || {});

  modules.constants = {
    QUIZ_TYPES: {
      CAPITAL_ONLY: "capital-only",
      COUNTRY_ONLY: "country-only",
      FLAG_COUNTRY_CAPITAL: "flag-country-capital",
    },
    RANDOM_SAMPLE_SIZE: 15,
    ERROR_HISTORY_STORAGE_KEY: "quiz.error.history.v1",
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
