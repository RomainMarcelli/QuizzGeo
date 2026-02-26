(function registerQuizDom(root) {
  const modules = (root.QuizAppModules = root.QuizAppModules || {});

  function getDomElements(doc = document) {
    return {
      menuSection: doc.getElementById("menuSection"),
      quizSection: doc.getElementById("quizSection"),
      modeGrid: doc.getElementById("modeGrid"),
      progressTrack: doc.querySelector(".progress-track"),
      progressBar: doc.getElementById("progressBar"),
      countryList: doc.getElementById("countryList"),
      finalScore: doc.getElementById("finalScore"),
      liveScore: doc.getElementById("liveScore"),
      floatingLiveScore: doc.getElementById("floatingLiveScore"),
      modeTag: doc.getElementById("modeTag"),
      stepTag: doc.getElementById("stepTag"),
      restartBtn: doc.getElementById("restartBtn"),
      perfectMenuBtn: doc.getElementById("perfectMenuBtn"),
      retryWrongBtn: doc.getElementById("retryWrongBtn"),
      clearErrorsBtn: doc.getElementById("clearErrorsBtn"),
      backBtn: doc.getElementById("backBtn"),
      refreshDrawBtn: doc.getElementById("refreshDrawBtn"),
      toggleModePanelBtn: doc.getElementById("toggleModePanelBtn"),
      inQuizModePanel: doc.getElementById("inQuizModePanel"),
      quickCountryTypeBtn: doc.getElementById("quickCountryTypeBtn"),
      quickCapitalTypeBtn: doc.getElementById("quickCapitalTypeBtn"),
      quickFlagTypeBtn: doc.getElementById("quickFlagTypeBtn"),
      quickCapitalToCountryTypeBtn: doc.getElementById("quickCapitalToCountryTypeBtn"),
      quickScopeSelect: doc.getElementById("quickScopeSelect"),
      applyModeBtn: doc.getElementById("applyModeBtn"),
      menuClearErrorsBtn: doc.getElementById("menuClearErrorsBtn"),
      countryTypeBtn: doc.getElementById("countryTypeBtn"),
      capitalTypeBtn: doc.getElementById("capitalTypeBtn"),
      flagTypeBtn: doc.getElementById("flagTypeBtn"),
      capitalToCountryTypeBtn: doc.getElementById("capitalToCountryTypeBtn"),
      scopeTitle: doc.getElementById("scopeTitle"),
      scopeDescription: doc.getElementById("scopeDescription"),
      questionCountSelect: doc.getElementById("questionCountSelect"),
      mixConfigPanel: doc.getElementById("mixConfigPanel"),
      mixConfigTitle: doc.getElementById("mixConfigTitle"),
      mixConfigDescription: doc.getElementById("mixConfigDescription"),
      mixRegionGrid: doc.getElementById("mixRegionGrid"),
      mixConfigHint: doc.getElementById("mixConfigHint"),
      startMixBtn: doc.getElementById("startMixBtn"),
      flagModal: doc.getElementById("flagModal"),
      flagModalBackdrop: doc.getElementById("flagModalBackdrop"),
      flagModalClose: doc.getElementById("flagModalClose"),
      flagModalImage: doc.getElementById("flagModalImage"),
      flagModalLabel: doc.getElementById("flagModalLabel"),
      quickQuestionCountSelect: doc.getElementById("quickQuestionCountSelect"),
    };
  }

  modules.dom = {
    getDomElements,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
