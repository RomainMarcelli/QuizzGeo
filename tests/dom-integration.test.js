const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

let JSDOM = null;
try {
  ({ JSDOM } = require("jsdom"));
} catch (_error) {
  JSDOM = null;
}

const ERROR_HISTORY_STORAGE_KEY = "quiz.error.history.v1";

function getQuizHtml() {
  return fs.readFileSync(path.resolve(__dirname, "..", "quizz.html"), "utf8");
}

function setGlobalValue(key, value) {
  const hadValue = Object.prototype.hasOwnProperty.call(globalThis, key);
  const previousValue = globalThis[key];
  globalThis[key] = value;

  return () => {
    if (hadValue) {
      globalThis[key] = previousValue;
      return;
    }
    delete globalThis[key];
  };
}

function loadScript(relativePath) {
  const resolved = require.resolve(relativePath);
  delete require.cache[resolved];
  require(relativePath);
}

function setupAppWithDom({ initialErrorHistory = null } = {}) {
  const dom = new JSDOM(getQuizHtml(), {
    url: "https://quiz.test",
    pretendToBeVisual: true,
  });

  if (typeof dom.window.HTMLElement.prototype.scrollIntoView !== "function") {
    dom.window.HTMLElement.prototype.scrollIntoView = function noopScrollIntoView() {};
  }

  const restoreWindow = setGlobalValue("window", dom.window);
  const restoreDocument = setGlobalValue("document", dom.window.document);
  const restoreStorage = setGlobalValue("localStorage", dom.window.localStorage);
  const restoreNavigator = setGlobalValue("navigator", dom.window.navigator);

  delete globalThis.QuizAppModules;
  delete globalThis.QUIZ_DATA;
  delete globalThis.QuizLogic;

  loadScript("../quiz-logic.js");
  loadScript("../data.js");
  loadScript("../src/js/modules/constants.js");
  loadScript("../src/js/modules/state.js");
  loadScript("../src/js/modules/dom.js");
  loadScript("../src/js/modules/icons.js");
  loadScript("../src/js/modules/renderers.js");
  loadScript("../src/js/modules/storage.js");
  loadScript("../src/js/modules/quiz-app.js");

  if (Array.isArray(initialErrorHistory)) {
    dom.window.localStorage.setItem(
      ERROR_HISTORY_STORAGE_KEY,
      JSON.stringify(initialErrorHistory)
    );
  }

  const app = globalThis.QuizAppModules.quizApp.createQuizApp();
  app.init();

  return {
    window: dom.window,
    document: dom.window.document,
    cleanup() {
      restoreNavigator();
      restoreStorage();
      restoreDocument();
      restoreWindow();
      dom.window.close();
      delete globalThis.QuizAppModules;
      delete globalThis.QUIZ_DATA;
      delete globalThis.QuizLogic;
    },
  };
}

if (!JSDOM) {
  test("integration DOM (jsdom): precondition", { skip: "jsdom is not installed" }, () => {});
} else {
  test("integration DOM: mode Capitale -> Pays affiche capitale et input pays", () => {
    const ctx = setupAppWithDom();

    try {
      ctx.document.getElementById("capitalToCountryTypeBtn").click();
      const firstScopeButton = ctx.document.querySelector(".mode-card");
      assert.ok(firstScopeButton);
      firstScopeButton.click();

      assert.ok(ctx.document.getElementById("quizSection"));
      assert.ok(!ctx.document.getElementById("quizSection").classList.contains("hidden"));
      assert.ok(ctx.document.querySelector(".capital-clue-card"));
      assert.ok(ctx.document.getElementById("input-country-0"));
      assert.equal(ctx.document.getElementById("input-capital-0"), null);

      ctx.document.getElementById("reveal-0").click();
      const feedback = ctx.document.getElementById("fb-0");
      assert.match(feedback.textContent, /^Reponse:\s+/);
    } finally {
      ctx.cleanup();
    }
  });

  test("integration DOM: Capitale -> Pays accepte un autre pays si capitale partagee", () => {
    const ctx = setupAppWithDom();

    try {
      ctx.document.getElementById("capitalToCountryTypeBtn").click();
      const scopeCards = Array.from(ctx.document.querySelectorAll(".mode-card"));
      const worldCard = scopeCards.find((card) => card.textContent.includes("Tour du Monde"));
      assert.ok(worldCard);
      worldCard.click();

      const rows = Array.from(ctx.document.querySelectorAll(".country-item"));
      const targetRow = rows.find((row) => {
        const capitalValue = row.querySelector(".capital-clue-value");
        return capitalValue && /kingston/i.test(capitalValue.textContent);
      });
      assert.ok(targetRow);

      const rowId = targetRow.id || "";
      const index = Number(rowId.replace("row-", ""));
      assert.ok(Number.isInteger(index));

      ctx.document.getElementById(`reveal-${index}`).click();
      const revealed = ctx.document.getElementById(`fb-${index}`).textContent;
      assert.match(revealed, /^Reponse:\s+/);

      const alternateAnswer = /jamaique/i.test(revealed) ? "Ile norfolk" : "Jamaique";
      const input = ctx.document.getElementById(`input-country-${index}`);
      input.value = alternateAnswer;
      ctx.document.getElementById(`btn-${index}`).click();

      assert.match(targetRow.className, /success/);
      assert.equal(ctx.document.getElementById(`fb-${index}`).className.includes("wrong"), false);
    } finally {
      ctx.cleanup();
    }
  });

  test("integration DOM: mode Melange Libre ouvre la config puis lance le quiz", () => {
    const ctx = setupAppWithDom();

    try {
      const modeCards = Array.from(ctx.document.querySelectorAll(".mode-card"));
      const mixCard = modeCards.find((card) => card.textContent.includes("Melange Libre"));
      assert.ok(mixCard);
      mixCard.click();

      const panel = ctx.document.getElementById("mixConfigPanel");
      assert.ok(!panel.classList.contains("hidden"));

      const northAmerica = ctx.document.getElementById("mixFilter-northAmerica");
      const europe = ctx.document.getElementById("mixFilter-europe");
      assert.ok(northAmerica);
      assert.ok(europe);

      northAmerica.value = "mainland";
      northAmerica.dispatchEvent(new ctx.window.Event("change", { bubbles: true }));
      europe.value = "islands";
      europe.dispatchEvent(new ctx.window.Event("change", { bubbles: true }));

      ctx.document.getElementById("startMixBtn").click();

      assert.ok(!ctx.document.getElementById("quizSection").classList.contains("hidden"));
      assert.match(ctx.document.getElementById("modeTag").textContent, /Melange Libre/);
      assert.ok(ctx.document.querySelectorAll(".country-item").length > 0);
    } finally {
      ctx.cleanup();
    }
  });

  test("integration DOM: capitale inconnue accepte une reponse vide", () => {
    const ctx = setupAppWithDom();

    try {
      ctx.document.getElementById("capitalTypeBtn").click();
      const scopeCards = Array.from(ctx.document.querySelectorAll(".mode-card"));
      const antarcticaCard = scopeCards.find((card) => card.textContent.includes("Antarctique"));
      assert.ok(antarcticaCard);
      antarcticaCard.click();

      const input = ctx.document.getElementById("input-0");
      assert.ok(input);
      input.value = "";
      ctx.document.getElementById("btn-0").click();

      const row = ctx.document.getElementById("row-0");
      assert.match(row.className, /success/);
    } finally {
      ctx.cleanup();
    }
  });

  test("integration DOM: Sprint 15 permet de filtrer continents et type", () => {
    const ctx = setupAppWithDom();

    try {
      ctx.document.getElementById("questionCountSelect").value = "15";
      ctx.document
        .getElementById("questionCountSelect")
        .dispatchEvent(new ctx.window.Event("change", { bubbles: true }));

      const modeCards = Array.from(ctx.document.querySelectorAll(".mode-card"));
      const sprintCard = modeCards.find((card) => card.textContent.includes("Sprint 15"));
      assert.ok(sprintCard);
      sprintCard.click();

      assert.ok(!ctx.document.getElementById("mixConfigPanel").classList.contains("hidden"));
      assert.match(ctx.document.getElementById("mixConfigTitle").textContent, /Sprint/);

      const oceania = ctx.document.getElementById("mixFilter-oceania");
      const northAmerica = ctx.document.getElementById("mixFilter-northAmerica");
      const southAmerica = ctx.document.getElementById("mixFilter-southAmerica");
      const europe = ctx.document.getElementById("mixFilter-europe");

      oceania.value = "off";
      northAmerica.value = "off";
      southAmerica.value = "off";
      europe.value = "mainland";

      [oceania, northAmerica, southAmerica, europe].forEach((selectElement) => {
        selectElement.dispatchEvent(new ctx.window.Event("change", { bubbles: true }));
      });

      ctx.document.getElementById("startMixBtn").click();

      assert.ok(!ctx.document.getElementById("quizSection").classList.contains("hidden"));
      assert.match(ctx.document.getElementById("modeTag").textContent, /Sprint 15/);
      assert.match(ctx.document.getElementById("modeTag").textContent, /15 questions|Toutes \(15\)/);
      assert.equal(ctx.document.querySelectorAll(".country-item").length, 15);

      const countryNames = Array.from(
        ctx.document.querySelectorAll(".country-item .country-name")
      ).map((element) => element.textContent.trim());
      assert.equal(countryNames.includes("Aland"), false);
    } finally {
      ctx.cleanup();
    }
  });

  test("integration DOM: Nouveau tirage relance une session fraiche", () => {
    const ctx = setupAppWithDom();

    try {
      ctx.document.getElementById("capitalTypeBtn").click();
      const firstScopeButton = ctx.document.querySelector(".mode-card");
      assert.ok(firstScopeButton);
      firstScopeButton.click();

      ctx.document.getElementById("btn-0").click();
      assert.match(ctx.document.getElementById("stepTag").textContent, /Traitees 1 \//);

      ctx.document.getElementById("refreshDrawBtn").click();
      assert.match(ctx.document.getElementById("stepTag").textContent, /Traitees 0 \//);
      assert.match(
        ctx.document.getElementById("liveScore").textContent,
        /Bonnes reponses:\s*0/
      );
    } finally {
      ctx.cleanup();
    }
  });

  test("integration DOM: renderers relie les callbacks de ligne (flag quiz)", () => {
    const ctx = setupAppWithDom();

    try {
      const events = {
        checkIndexes: [],
        revealIndexes: [],
        openFlagCountries: [],
        focusIndexes: [],
        inputValues: [],
      };

      globalThis.QuizAppModules.renderers.renderCountryRows({
        countryList: ctx.document.getElementById("countryList"),
        countries: [{ country: "France", capital: "Paris", code: "fr" }],
        activeQuizType: "flag-country-capital",
        quizTypes: {
          COUNTRY_ONLY: "country-only",
          CAPITAL_ONLY: "capital-only",
          FLAG_COUNTRY_CAPITAL: "flag-country-capital",
          CAPITAL_TO_COUNTRY: "capital-to-country",
        },
        onCheck: (index) => events.checkIndexes.push(index),
        onReveal: (index) => events.revealIndexes.push(index),
        onOpenFlag: (country) => events.openFlagCountries.push(country.code),
        onFocus: (index) => events.focusIndexes.push(index),
        onInputChange: (inputElement) => events.inputValues.push(inputElement.value),
      });

      const countryInput = ctx.document.getElementById("input-country-0");
      const capitalInput = ctx.document.getElementById("input-capital-0");
      const checkButton = ctx.document.getElementById("btn-0");
      const revealButton = ctx.document.getElementById("reveal-0");
      const flagButton = ctx.document.getElementById("flagbtn-0");

      countryInput.value = "fra";
      countryInput.focus();
      countryInput.dispatchEvent(new ctx.window.Event("input", { bubbles: true }));
      countryInput.dispatchEvent(
        new ctx.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      );

      capitalInput.value = "pari";
      capitalInput.focus();
      capitalInput.dispatchEvent(new ctx.window.Event("input", { bubbles: true }));
      capitalInput.dispatchEvent(
        new ctx.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      );

      checkButton.click();
      revealButton.click();
      flagButton.click();

      assert.equal(events.checkIndexes.length, 3);
      assert.deepEqual(events.revealIndexes, [0]);
      assert.deepEqual(events.openFlagCountries, ["fr"]);
      assert.deepEqual(events.focusIndexes, [0, 0]);
      assert.deepEqual(events.inputValues, ["fra", "pari"]);
    } finally {
      ctx.cleanup();
    }
  });

  test("integration DOM: bouton Voir reste utilisable apres une validation", () => {
    const ctx = setupAppWithDom();

    try {
      ctx.document.getElementById("capitalTypeBtn").click();
      const firstScopeButton = ctx.document.querySelector(".mode-card");
      assert.ok(firstScopeButton);
      firstScopeButton.click();

      const answerInput = ctx.document.getElementById("input-0");
      answerInput.value = "mauvaise reponse";
      ctx.document.getElementById("btn-0").click();

      const revealButton = ctx.document.getElementById("reveal-0");
      assert.equal(revealButton.disabled, false);
      revealButton.click();

      const feedback = ctx.document.getElementById("fb-0");
      assert.match(feedback.textContent, /^Reponse:\s+/);
      assert.match(feedback.className, /hint/);
    } finally {
      ctx.cleanup();
    }
  });

  test("integration DOM: une erreur corrigee disparait du mode Revision Ciblee", () => {
    const ctx = setupAppWithDom({
      initialErrorHistory: [{ country: "France", capital: "Paris", code: "fr" }],
    });

    try {
      const modeCards = Array.from(ctx.document.querySelectorAll(".mode-card"));
      const savedErrorsCard = modeCards.find((card) =>
        card.textContent.includes("Revision Ciblee")
      );
      assert.ok(savedErrorsCard);
      savedErrorsCard.click();

      const answerInput = ctx.document.getElementById("input-0");
      assert.ok(answerInput);
      answerInput.value = "Paris";
      ctx.document.getElementById("btn-0").click();

      assert.match(ctx.document.getElementById("finalScore").textContent, /1\/1/);
      assert.ok(ctx.document.getElementById("retryWrongBtn").classList.contains("hidden"));
      assert.ok(!ctx.document.getElementById("perfectMenuBtn").classList.contains("hidden"));

      const rawErrors = ctx.window.localStorage.getItem(ERROR_HISTORY_STORAGE_KEY);
      assert.ok(rawErrors);
      assert.equal(JSON.parse(rawErrors).length, 0);

      ctx.document.getElementById("perfectMenuBtn").click();
      const cardsAfterFix = Array.from(ctx.document.querySelectorAll(".mode-card"));
      const savedErrorsCardAfterFix = cardsAfterFix.find((card) =>
        card.textContent.includes("Revision Ciblee")
      );
      assert.equal(savedErrorsCardAfterFix, undefined);
    } finally {
      ctx.cleanup();
    }
  });
}
