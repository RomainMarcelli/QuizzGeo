(function registerQuizState(root) {
  const modules = (root.QuizAppModules = root.QuizAppModules || {});

  function createInitialState(QUIZ_TYPES) {
    return {
      activeQuizType: QUIZ_TYPES.CAPITAL_ONLY,
      selectedMenuQuizType: QUIZ_TYPES.CAPITAL_ONLY,
      activeScopeKey: null,
      fullModeList: [],
      countries: [],
      wrongAnswers: [],
      answeredIndexes: new Set(),
      score: 0,
      revealedRows: new Set(),
    };
  }

  function resetQuizSession(state) {
    state.wrongAnswers = [];
    state.answeredIndexes = new Set();
    state.score = 0;
    state.revealedRows = new Set();
  }

  function resetToMenu(state, QUIZ_TYPES) {
    state.activeQuizType = QUIZ_TYPES.CAPITAL_ONLY;
    state.activeScopeKey = null;
    state.fullModeList = [];
    state.countries = [];
    state.wrongAnswers = [];
    state.answeredIndexes = new Set();
    state.score = 0;
    state.revealedRows = new Set();
  }

  modules.state = {
    createInitialState,
    resetQuizSession,
    resetToMenu,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
