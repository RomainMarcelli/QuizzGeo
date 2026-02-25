(function registerQuizApp(root) {
  const modules = (root.QuizAppModules = root.QuizAppModules || {});

  function createQuizApp() {
    const {
      constants,
      state: stateTools,
      dom: domTools,
      icons,
      renderers,
      storage,
    } = modules;

    if (!constants || !stateTools || !domTools || !icons || !renderers || !storage) {
      throw new Error("QuizApp modules are not fully loaded.");
    }

    if (!root.QuizLogic || !root.QUIZ_DATA) {
      throw new Error("Quiz logic or data are not available.");
    }

    const quizLogic = root.QuizLogic;
    const quizData = root.QUIZ_DATA;
    const {
      QUIZ_TYPES,
      RANDOM_SAMPLE_SIZE,
      QUESTION_COUNT_OPTIONS,
      ERROR_HISTORY_STORAGE_KEY,
    } = constants;

    const {
      QUIZ_SCOPE_KEYS,
      MIX_FILTER_KEYS,
      autoCapitalizeWords,
      isCountryAnswerCorrect,
      isCapitalAnswerCorrect,
      getFlagChallengeErrorType,
      formatFlagChallengeWrongFeedback,
      buildScopeOptions,
      getCustomMixRegionKeys,
      buildCustomMixCountries,
      pickQuizCountries,
      formatQuestionCountSelection,
      resolveScopeCountries,
      getRevealText,
      toggleRevealState,
      getPostAnswerButtonState,
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
    } = quizLogic;

    const dom = domTools.getDomElements();
    const state = stateTools.createInitialState(QUIZ_TYPES);
    const baseScopeOptions = buildScopeOptions(quizData, RANDOM_SAMPLE_SIZE);
    const mixRegionKeys = getCustomMixRegionKeys(quizData);

    const errorStore = storage.createErrorHistoryStore({
      storageKey: ERROR_HISTORY_STORAGE_KEY,
      mergeUniqueCountryLists,
      removeCountryFromList,
      normalizeEntries: (entries) => alignEntriesWithQuizData(entries, quizData),
    });
    let inQuizSelectedQuizType = QUIZ_TYPES.CAPITAL_ONLY;
    let inQuizSelectedScopeKey = null;
    let inQuizSelectedQuestionCount = "all";

    function init() {
      errorStore.load();
      ensureSelectedMixFilters();
      renderQuestionCountSelectOptions();
      setMenuQuestionCount("all");
      attachGlobalEvents();
      setMenuQuizType(QUIZ_TYPES.CAPITAL_ONLY);
      refreshRetryButtonLabel();
      updateSavedErrorActionButtonsVisibility();
      syncInQuizModeControls(QUIZ_TYPES.CAPITAL_ONLY, null);
      hideMixConfigPanel();
    }

    function attachGlobalEvents() {
      dom.restartBtn.addEventListener("click", () => startQuiz(getRestartCountries()));
      dom.perfectMenuBtn.addEventListener("click", backToMenu);
      dom.retryWrongBtn.addEventListener("click", () => startQuiz(getRetryCountries()));
      dom.clearErrorsBtn.addEventListener("click", clearPersistedErrorHistory);
      dom.menuClearErrorsBtn.addEventListener("click", clearPersistedErrorHistory);
      dom.backBtn.addEventListener("click", backToMenu);
      dom.refreshDrawBtn.addEventListener("click", refreshCurrentDraw);

      dom.countryTypeBtn.addEventListener("click", () => setMenuQuizType(QUIZ_TYPES.COUNTRY_ONLY));
      dom.capitalTypeBtn.addEventListener("click", () => setMenuQuizType(QUIZ_TYPES.CAPITAL_ONLY));
      dom.flagTypeBtn.addEventListener("click", () =>
        setMenuQuizType(QUIZ_TYPES.FLAG_COUNTRY_CAPITAL)
      );
      dom.questionCountSelect.addEventListener("change", () => {
        setMenuQuestionCount(dom.questionCountSelect.value);
        setInQuizQuestionCount(state.selectedQuestionCount);
      });
      dom.startMixBtn.addEventListener("click", startCustomMixMode);

      dom.flagModalClose.addEventListener("click", closeFlagModal);
      dom.flagModalBackdrop.addEventListener("click", closeFlagModal);
      dom.toggleModePanelBtn.addEventListener("click", toggleInQuizModePanel);
      dom.quickCountryTypeBtn.addEventListener("click", () =>
        setInQuizQuizType(QUIZ_TYPES.COUNTRY_ONLY)
      );
      dom.quickCapitalTypeBtn.addEventListener("click", () =>
        setInQuizQuizType(QUIZ_TYPES.CAPITAL_ONLY)
      );
      dom.quickFlagTypeBtn.addEventListener("click", () =>
        setInQuizQuizType(QUIZ_TYPES.FLAG_COUNTRY_CAPITAL)
      );
      dom.quickScopeSelect.addEventListener("change", () => {
        inQuizSelectedScopeKey = dom.quickScopeSelect.value;
      });
      dom.quickQuestionCountSelect.addEventListener("change", () => {
        setInQuizQuestionCount(dom.quickQuestionCountSelect.value);
      });
      dom.applyModeBtn.addEventListener("click", applyInQuizModeSelection);

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !dom.flagModal.classList.contains("hidden")) {
          closeFlagModal();
        }
      });
    }

    function getQuizLabelForType(quizType) {
      if (quizType === QUIZ_TYPES.COUNTRY_ONLY) {
        return "Pays";
      }
      if (quizType === QUIZ_TYPES.CAPITAL_ONLY) {
        return "Capitales";
      }
      return "Pays + Capitale";
    }

    function setModeTag(scopeKey, sourceCount) {
      const scopeOption = getMenuScopeOptions().find((option) => option.key === scopeKey);
      const quizLabel = getQuizLabelForType(state.activeQuizType);

      dom.modeTag.textContent = `${quizLabel} | ${
        scopeOption ? scopeOption.name : scopeKey
      } | ${formatQuestionCountSelection(state.activeQuestionCount, sourceCount)}`;
    }

    function resolveSourceListForActiveScope() {
      if (state.activeScopeKey === QUIZ_SCOPE_KEYS.SAVED_ERRORS) {
        return getRetryCountries();
      }

      if (state.activeScopeKey === QUIZ_SCOPE_KEYS.CUSTOM_MIX) {
        return buildCustomMixCountries(quizData, state.activeMixFilters);
      }

      return resolveScopeCountries(quizData, state.activeScopeKey, RANDOM_SAMPLE_SIZE);
    }

    function refreshCurrentDraw() {
      if (!state.activeScopeKey) {
        return;
      }

      const refreshedSource = resolveSourceListForActiveScope();
      if (!Array.isArray(refreshedSource) || refreshedSource.length === 0) {
        backToMenu();
        return;
      }

      state.fullModeList = refreshedSource;
      setModeTag(state.activeScopeKey, refreshedSource.length);
      startQuiz(refreshedSource);
    }

    function normalizeQuestionCountValue(value) {
      const optionValues = new Set(QUESTION_COUNT_OPTIONS.map((option) => String(option)));
      const normalized = String(value ?? "all");
      if (optionValues.has(normalized)) {
        return normalized;
      }
      return "all";
    }

    function formatQuestionCountOptionLabel(value) {
      if (String(value) === "all") {
        return "Toutes";
      }
      return `${value} questions`;
    }

    function renderQuestionCountSelectOptions() {
      const optionsHtml = QUESTION_COUNT_OPTIONS.map(
        (value) =>
          `<option value="${value}">${formatQuestionCountOptionLabel(value)}</option>`
      ).join("");

      dom.questionCountSelect.innerHTML = optionsHtml;
      dom.quickQuestionCountSelect.innerHTML = optionsHtml;
    }

    function setMenuQuestionCount(value) {
      state.selectedQuestionCount = normalizeQuestionCountValue(value);
      dom.questionCountSelect.value = state.selectedQuestionCount;
    }

    function setInQuizQuestionCount(value) {
      inQuizSelectedQuestionCount = normalizeQuestionCountValue(value);
      dom.quickQuestionCountSelect.value = inQuizSelectedQuestionCount;
    }

    function createDefaultMixFilters() {
      const filters = {};
      mixRegionKeys.forEach((regionKey) => {
        filters[regionKey] = MIX_FILTER_KEYS.OFF;
      });
      return filters;
    }

    function ensureSelectedMixFilters() {
      const defaults = createDefaultMixFilters();
      state.selectedMixFilters = {
        ...defaults,
        ...(state.selectedMixFilters || {}),
      };
    }

    function clearMixValidationMessage() {
      dom.mixConfigHint.textContent = "";
      dom.mixConfigHint.classList.add("hidden");
    }

    function showMixValidationMessage(message) {
      dom.mixConfigHint.textContent = message;
      dom.mixConfigHint.classList.remove("hidden");
    }

    function renderMixConfigRows() {
      ensureSelectedMixFilters();

      dom.mixRegionGrid.innerHTML = mixRegionKeys
        .map(
          (regionKey) => `
            <label class="mix-region-row" for="mixFilter-${regionKey}">
              <span class="mix-region-label">${quizData[regionKey].name}</span>
              <select id="mixFilter-${regionKey}" data-region="${regionKey}" class="mode-select mix-region-select">
                <option value="${MIX_FILTER_KEYS.OFF}">Ignorer</option>
                <option value="${MIX_FILTER_KEYS.ALL}">Tout</option>
                <option value="${MIX_FILTER_KEYS.MAINLAND}">Pays uniquement</option>
                <option value="${MIX_FILTER_KEYS.ISLANDS}">Iles uniquement</option>
              </select>
            </label>
          `
        )
        .join("");

      dom.mixRegionGrid.querySelectorAll("select[data-region]").forEach((selectElement) => {
        const regionKey = selectElement.getAttribute("data-region");
        selectElement.value = state.selectedMixFilters[regionKey] || MIX_FILTER_KEYS.OFF;
        selectElement.addEventListener("change", () => {
          state.selectedMixFilters[regionKey] = selectElement.value;
          clearMixValidationMessage();
        });
      });
    }

    function openMixConfigPanel(keepValidationMessage = false) {
      if (!keepValidationMessage) {
        clearMixValidationMessage();
      }
      renderMixConfigRows();
      dom.mixConfigPanel.classList.remove("hidden");
    }

    function hideMixConfigPanel() {
      dom.mixConfigPanel.classList.add("hidden");
      clearMixValidationMessage();
    }

    function startCustomMixMode() {
      startMode(state.selectedMenuQuizType, QUIZ_SCOPE_KEYS.CUSTOM_MIX);
    }

    function setMenuQuizType(quizType) {
      state.selectedMenuQuizType = quizType;

      dom.countryTypeBtn.classList.toggle("active", quizType === QUIZ_TYPES.COUNTRY_ONLY);
      dom.capitalTypeBtn.classList.toggle("active", quizType === QUIZ_TYPES.CAPITAL_ONLY);
      dom.flagTypeBtn.classList.toggle("active", quizType === QUIZ_TYPES.FLAG_COUNTRY_CAPITAL);

      dom.scopeTitle.textContent =
        quizType === QUIZ_TYPES.COUNTRY_ONLY
          ? "Etape 2: Choisis la zone du quiz des pays"
          : quizType === QUIZ_TYPES.CAPITAL_ONLY
            ? "Etape 2: Choisis la zone du quiz des capitales"
            : "Etape 2: Choisis la zone du quiz pays + capitale";

      dom.scopeDescription.textContent =
        quizType === QUIZ_TYPES.COUNTRY_ONLY
          ? "Tu saisis uniquement le pays/l'ile a partir du drapeau."
          : quizType === QUIZ_TYPES.CAPITAL_ONLY
            ? "Tu saisis uniquement la capitale."
            : "Tu saisis le pays/l'ile et la capitale a partir du drapeau.";

      renderScopeCards();
    }

    function renderScopeCards() {
      renderers.renderScopeCards({
        modeGrid: dom.modeGrid,
        options: getMenuScopeOptions(),
        onSelectOption: (option) => {
          if (option.key === QUIZ_SCOPE_KEYS.CUSTOM_MIX) {
            openMixConfigPanel();
            return;
          }

          hideMixConfigPanel();
          startMode(state.selectedMenuQuizType, option.key);
        },
        getModeIconSvg: icons.getModeIconSvg,
      });
    }

    function startMode(quizType, scopeKey) {
      state.activeQuizType = quizType;
      state.activeScopeKey = scopeKey;
      state.activeQuestionCount = normalizeQuestionCountValue(state.selectedQuestionCount);

      if (scopeKey === QUIZ_SCOPE_KEYS.SAVED_ERRORS) {
        state.activeMixFilters = {};
        state.fullModeList = getRetryCountries();
      } else if (scopeKey === QUIZ_SCOPE_KEYS.CUSTOM_MIX) {
        ensureSelectedMixFilters();
        state.activeMixFilters = { ...state.selectedMixFilters };
        state.fullModeList = buildCustomMixCountries(quizData, state.activeMixFilters);

        if (state.fullModeList.length === 0) {
          showMixValidationMessage("Selectionne au moins une zone pour lancer le melange.");
          openMixConfigPanel(true);
          return;
        }
      } else {
        state.activeMixFilters = {};
        state.fullModeList = resolveScopeCountries(quizData, scopeKey, RANDOM_SAMPLE_SIZE);
      }

      setModeTag(scopeKey, state.fullModeList.length);

      hideMixConfigPanel();
      dom.menuSection.classList.add("hidden");
      dom.quizSection.classList.remove("hidden");
      dom.inQuizModePanel.classList.add("hidden");
      syncInQuizModeControls(quizType, scopeKey);
      startQuiz(state.fullModeList);
    }

    function startQuiz(sourceList) {
      if (!Array.isArray(sourceList) || sourceList.length === 0) {
        backToMenu();
        return;
      }

      state.countries = pickQuizCountries(sourceList, state.activeQuestionCount);
      if (state.countries.length === 0) {
        backToMenu();
        return;
      }
      stateTools.resetQuizSession(state);

      dom.finalScore.textContent = "";
      dom.restartBtn.classList.add("hidden");
      dom.perfectMenuBtn.classList.add("hidden");
      dom.retryWrongBtn.classList.add("hidden");
      dom.clearErrorsBtn.classList.add("hidden");
      refreshRetryButtonLabel();

      renderCountryRows();
      updateProgress();
      updateScoreBadge();
      focusInput(0);
    }

    function renderCountryRows() {
      renderers.renderCountryRows({
        countryList: dom.countryList,
        countries: state.countries,
        activeQuizType: state.activeQuizType,
        quizTypes: QUIZ_TYPES,
        onCheck: checkAnswer,
        onReveal: revealAnswer,
        onOpenFlag: openFlagModal,
        onFocus: highlightActiveRow,
        onInputChange: handleInputChange,
      });
    }

    function handleInputChange(inputElement) {
      if (!inputElement) {
        return;
      }

      const currentValue = inputElement.value;
      const capitalizedValue = autoCapitalizeWords(currentValue);
      if (capitalizedValue === currentValue) {
        return;
      }

      const selectionStart = inputElement.selectionStart;
      const selectionEnd = inputElement.selectionEnd;
      inputElement.value = capitalizedValue;

      if (document.activeElement === inputElement && selectionStart !== null) {
        inputElement.setSelectionRange(selectionStart, selectionEnd);
      }
    }

    function focusInput(index) {
      highlightActiveRow(index);

      if (isCountryInputQuizType(state.activeQuizType)) {
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
      if (state.answeredIndexes.has(index)) {
        return;
      }

      state.revealedRows.delete(index);

      const country = state.countries[index];
      const checkButton = document.getElementById(`btn-${index}`);
      const revealButton = document.getElementById(`reveal-${index}`);
      const feedback = document.getElementById(`fb-${index}`);
      const row = document.getElementById(`row-${index}`);

      if (state.activeQuizType === QUIZ_TYPES.FLAG_COUNTRY_CAPITAL) {
        handleFlagCountryCapitalAnswer(index, country, feedback, row);
      } else if (state.activeQuizType === QUIZ_TYPES.COUNTRY_ONLY) {
        handleCountryOnlyAnswer(index, country, feedback, row);
      } else {
        handleCapitalOnlyAnswer(index, country, feedback, row);
      }

      const postAnswerButtonState = getPostAnswerButtonState();
      checkButton.disabled = postAnswerButtonState.checkDisabled;
      revealButton.disabled = postAnswerButtonState.revealDisabled;

      state.answeredIndexes.add(index);
      updateProgress();
      updateScoreBadge();

      const nextIndex = getNextUnansweredIndex(
        state.answeredIndexes,
        state.countries.length,
        index + 1
      );

      if (nextIndex !== -1) {
        focusInput(nextIndex);
        scrollToRow(nextIndex);
      } else {
        finishQuiz();
      }
    }

    function handleFlagCountryCapitalAnswer(index, country, feedback, row) {
      const countryInput = document.getElementById(`input-country-${index}`);
      const capitalInput = document.getElementById(`input-capital-${index}`);
      const countryIsCorrect = isCountryAnswerCorrect(country, countryInput.value);
      const capitalIsCorrect = isCapitalAnswerCorrect(country, capitalInput.value);
      const errorType = getFlagChallengeErrorType(countryIsCorrect, capitalIsCorrect);
      const isCorrect = errorType === "none";

      countryInput.disabled = true;
      capitalInput.disabled = true;

      if (isCorrect) {
        state.score += 1;
        feedback.textContent = "";
        feedback.className = "feedback hidden";
        row.classList.add("success");
        resolvePersistentError(country);
        return;
      }

      feedback.textContent = formatFlagChallengeWrongFeedback(errorType, country);
      feedback.className = "feedback wrong";
      row.classList.add("error");
      state.wrongAnswers.push(country);
      registerPersistentError(country);
    }

    function handleCountryOnlyAnswer(index, country, feedback, row) {
      const countryInput = document.getElementById(`input-country-${index}`);
      const isCorrect = isCountryAnswerCorrect(country, countryInput.value);

      countryInput.disabled = true;

      if (isCorrect) {
        state.score += 1;
        feedback.textContent = "";
        feedback.className = "feedback hidden";
        row.classList.add("success");
        resolvePersistentError(country);
        return;
      }

      feedback.textContent = `Faux: ${country.country}`;
      feedback.className = "feedback wrong";
      row.classList.add("error");
      state.wrongAnswers.push(country);
      registerPersistentError(country);
    }

    function handleCapitalOnlyAnswer(index, country, feedback, row) {
      const input = document.getElementById(`input-${index}`);
      const isCorrect = isCapitalAnswerCorrect(country, input.value);

      input.disabled = true;

      if (isCorrect) {
        state.score += 1;
        feedback.textContent = "";
        feedback.className = "feedback hidden";
        row.classList.add("success");
        resolvePersistentError(country);
        return;
      }

      feedback.textContent = `Faux: ${country.capital}`;
      feedback.className = "feedback wrong";
      row.classList.add("error");
      state.wrongAnswers.push(country);
      registerPersistentError(country);
    }

    function revealAnswer(index) {
      const feedback = document.getElementById(`fb-${index}`);
      const country = state.countries[index];
      const currentlyVisible = state.revealedRows.has(index);
      const nextVisible = toggleRevealState(currentlyVisible);

      if (nextVisible) {
        feedback.textContent = getRevealText(state.activeQuizType, country);
        feedback.className = "feedback hint";
        state.revealedRows.add(index);
      } else {
        feedback.textContent = "";
        feedback.className = "feedback";
        state.revealedRows.delete(index);
      }

      if (isCountryInputQuizType(state.activeQuizType)) {
        document.getElementById(`input-country-${index}`).focus();
      } else {
        document.getElementById(`input-${index}`).focus();
      }
    }

    function updateProgress() {
      const answeredCount = state.answeredIndexes.size;
      const percent = getCompletionPercent(answeredCount, state.countries.length);
      dom.progressBar.style.width = `${percent}%`;
      dom.progressTrack.setAttribute("aria-valuenow", String(percent));
      dom.stepTag.textContent = `Traitees ${answeredCount} / ${state.countries.length}`;
    }

    function scrollToRow(index) {
      const row = document.getElementById(`row-${index}`);
      if (!row) {
        return;
      }

      row.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    function updateScoreBadge() {
      dom.liveScore.textContent = `Bonnes reponses: ${state.score}`;
    }

    function finishQuiz() {
      highlightActiveRow(-1);

      const percent = Math.round((state.score / state.countries.length) * 100);
      dom.finalScore.textContent = `Score final: ${state.score}/${state.countries.length} (${percent}%)`;

      dom.restartBtn.classList.remove("hidden");
      const showPerfectMenu = shouldShowPerfectSavedErrorsMenuButton(
        state.activeScopeKey,
        state.score,
        state.countries.length
      );
      dom.perfectMenuBtn.classList.toggle("hidden", !showPerfectMenu);
      refreshRetryButtonLabel();
      updateSavedErrorActionButtonsVisibility();

      if (percent >= 80) {
        launchConfetti();
      }
    }

    function backToMenu() {
      closeFlagModal();
      dom.quizSection.classList.add("hidden");
      dom.menuSection.classList.remove("hidden");

      stateTools.resetToMenu(state, QUIZ_TYPES);
      hideMixConfigPanel();
      dom.inQuizModePanel.classList.add("hidden");
      syncInQuizModeControls(state.selectedMenuQuizType, state.activeScopeKey);
      renderScopeCards();
    }

    function openFlagModal(country) {
      const presentation = getFlagModalPresentation(state.activeQuizType, country);
      dom.flagModalImage.src = `https://flagcdn.com/w1280/${country.code}.png`;
      dom.flagModalImage.alt = presentation.alt;
      dom.flagModalLabel.textContent = presentation.label;
      dom.flagModalLabel.classList.toggle("hidden", !presentation.showLabel);

      dom.flagModal.classList.remove("hidden");
      dom.flagModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }

    function closeFlagModal() {
      dom.flagModal.classList.add("hidden");
      dom.flagModal.setAttribute("aria-hidden", "true");
      dom.flagModalImage.src = "";
      dom.flagModalImage.alt = "";
      dom.flagModalLabel.classList.remove("hidden");
      dom.flagModalLabel.textContent = "";
      document.body.classList.remove("modal-open");
    }

    function registerPersistentError(country) {
      errorStore.register(country);
      refreshRetryButtonLabel();
    }

    function resolvePersistentError(country) {
      errorStore.resolve(country);
      refreshRetryButtonLabel();
    }

    function getRetryCountries() {
      return errorStore.getAll();
    }

    function getRestartCountries() {
      if (state.activeScopeKey === QUIZ_SCOPE_KEYS.SAVED_ERRORS) {
        return getRetryCountries();
      }

      if (state.activeScopeKey === QUIZ_SCOPE_KEYS.CUSTOM_MIX) {
        state.fullModeList = buildCustomMixCountries(quizData, state.activeMixFilters);
        return state.fullModeList;
      }

      if (shouldGenerateNewRandomSampleOnRestart(state.activeScopeKey)) {
        state.fullModeList = resolveScopeCountries(
          quizData,
          state.activeScopeKey,
          RANDOM_SAMPLE_SIZE
        );
        return state.fullModeList;
      }

      return state.fullModeList;
    }

    function refreshRetryButtonLabel() {
      const count = errorStore.getCount();
      dom.retryWrongBtn.textContent = formatRetryButtonLabel(count);
      const clearLabel = formatClearErrorsButtonLabel(count);
      dom.clearErrorsBtn.textContent = clearLabel;
      dom.menuClearErrorsBtn.textContent = clearLabel;
      renderInQuizScopeOptions(inQuizSelectedScopeKey || state.activeScopeKey);
    }

    function clearPersistedErrorHistory() {
      errorStore.clear();
      refreshRetryButtonLabel();
      updateSavedErrorActionButtonsVisibility();
      renderScopeCards();
    }

    function updateSavedErrorActionButtonsVisibility() {
      const shouldShow = shouldShowSavedErrorActions(errorStore.getCount());
      dom.retryWrongBtn.classList.toggle("hidden", !shouldShow);
      dom.clearErrorsBtn.classList.toggle("hidden", !shouldShow);
      dom.menuClearErrorsBtn.disabled = !shouldShow;
      dom.menuClearErrorsBtn.classList.toggle("is-disabled", !shouldShow);
    }

    function getMenuScopeOptions() {
      const options = [...baseScopeOptions];
      if (shouldShowSavedErrorActions(errorStore.getCount())) {
        options.push(buildSavedErrorsScopeOption(errorStore.getCount()));
      }
      return options;
    }

    function toggleInQuizModePanel() {
      const isHidden = dom.inQuizModePanel.classList.contains("hidden");
      if (isHidden) {
        syncInQuizModeControls(state.activeQuizType, state.activeScopeKey);
        dom.inQuizModePanel.classList.remove("hidden");
        return;
      }
      dom.inQuizModePanel.classList.add("hidden");
    }

    function setInQuizQuizType(quizType) {
      inQuizSelectedQuizType = quizType;
      dom.quickCountryTypeBtn.classList.toggle("active", quizType === QUIZ_TYPES.COUNTRY_ONLY);
      dom.quickCapitalTypeBtn.classList.toggle("active", quizType === QUIZ_TYPES.CAPITAL_ONLY);
      dom.quickFlagTypeBtn.classList.toggle(
        "active",
        quizType === QUIZ_TYPES.FLAG_COUNTRY_CAPITAL
      );
    }

    function renderInQuizScopeOptions(preferredScopeKey) {
      const options = getMenuScopeOptions();
      const selectedScopeKey = resolvePreferredScopeKey(options, preferredScopeKey);

      dom.quickScopeSelect.innerHTML = options
        .map((option) => `<option value="${option.key}">${option.name}</option>`)
        .join("");

      if (selectedScopeKey) {
        dom.quickScopeSelect.value = selectedScopeKey;
      }
      inQuizSelectedScopeKey = selectedScopeKey;
    }

    function syncInQuizModeControls(preferredQuizType, preferredScopeKey) {
      setInQuizQuizType(preferredQuizType || QUIZ_TYPES.CAPITAL_ONLY);
      renderInQuizScopeOptions(preferredScopeKey);
      setInQuizQuestionCount(state.selectedQuestionCount);
    }

    function applyInQuizModeSelection() {
      if (!inQuizSelectedScopeKey) {
        return;
      }

      setMenuQuestionCount(inQuizSelectedQuestionCount);
      setMenuQuizType(inQuizSelectedQuizType);
      dom.inQuizModePanel.classList.add("hidden");
      startMode(inQuizSelectedQuizType, inQuizSelectedScopeKey);
    }

    function isCountryInputQuizType(quizType) {
      return quizType === QUIZ_TYPES.COUNTRY_ONLY || quizType === QUIZ_TYPES.FLAG_COUNTRY_CAPITAL;
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

    return {
      init,
    };
  }

  modules.quizApp = {
    createQuizApp,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
