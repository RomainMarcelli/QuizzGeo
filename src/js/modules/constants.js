(function registerQuizConstants(root) {
  const modules = (root.QuizAppModules = root.QuizAppModules || {});

  modules.constants = {
    QUIZ_TYPES: {
      CAPITAL_ONLY: "capital-only",
      COUNTRY_ONLY: "country-only",
      FLAG_COUNTRY_CAPITAL: "flag-country-capital",
      CAPITAL_TO_COUNTRY: "capital-to-country",
    },
    RANDOM_SAMPLE_SIZE: 15,
    QUESTION_COUNT_OPTIONS: ["all", 5, 10, 15, 20, 30, 50],
    ERROR_HISTORY_STORAGE_KEY: "quiz.error.history.v1",
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
