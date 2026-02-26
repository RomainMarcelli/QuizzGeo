const test = require("node:test");
const assert = require("node:assert/strict");

function loadModule(relativePath, { resetModules = true } = {}) {
  if (resetModules) {
    delete globalThis.QuizAppModules;
  }

  const modulePath = require.resolve(relativePath);
  delete require.cache[modulePath];
  require(modulePath);
  return globalThis.QuizAppModules;
}

function createMockStorage(initialState = {}, { throwOnSet = false } = {}) {
  const store = { ...initialState };

  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      if (throwOnSet) {
        throw new Error("set failed");
      }
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    _dump() {
      return { ...store };
    },
  };
}

function mergeUniqueByCode(baseList, incomingList) {
  const seen = new Set();
  const output = [];

  [...baseList, ...incomingList].forEach((entry) => {
    if (!entry || !entry.code) {
      return;
    }
    const key = String(entry.code).toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    output.push({ ...entry });
  });

  return output;
}

function removeByCode(list, countryEntry) {
  const code = String(countryEntry?.code || "").toLowerCase();
  return list.filter((entry) => String(entry?.code || "").toLowerCase() !== code);
}

test("constants: expose tous les types et options de quantite", () => {
  const modules = loadModule("../src/js/modules/constants.js");
  const { constants } = modules;

  assert.equal(constants.QUIZ_TYPES.CAPITAL_ONLY, "capital-only");
  assert.equal(constants.QUIZ_TYPES.COUNTRY_ONLY, "country-only");
  assert.equal(constants.QUIZ_TYPES.FLAG_COUNTRY_CAPITAL, "flag-country-capital");
  assert.equal(constants.QUIZ_TYPES.CAPITAL_TO_COUNTRY, "capital-to-country");
  assert.deepEqual(constants.QUESTION_COUNT_OPTIONS, ["all", 5, 10, 15, 20, 30, 50]);
});

test("state: createInitialState initialise les valeurs par defaut", () => {
  const modules = loadModule("../src/js/modules/state.js");
  const QUIZ_TYPES = {
    CAPITAL_ONLY: "capital-only",
    COUNTRY_ONLY: "country-only",
    FLAG_COUNTRY_CAPITAL: "flag-country-capital",
    CAPITAL_TO_COUNTRY: "capital-to-country",
  };

  const state = modules.state.createInitialState(QUIZ_TYPES);
  assert.equal(state.activeQuizType, QUIZ_TYPES.CAPITAL_ONLY);
  assert.equal(state.selectedMenuQuizType, QUIZ_TYPES.CAPITAL_ONLY);
  assert.equal(state.selectedQuestionCount, "all");
  assert.equal(state.activeQuestionCount, "all");
  assert.deepEqual(state.selectedMixFilters, {});
  assert.deepEqual(state.activeMixFilters, {});
  assert.ok(state.answeredIndexes instanceof Set);
  assert.ok(state.revealedRows instanceof Set);
});

test("state: resetQuizSession remet uniquement la session en cours", () => {
  const modules = loadModule("../src/js/modules/state.js");
  const state = {
    activeQuizType: "capital-only",
    wrongAnswers: [{ code: "fr" }],
    answeredIndexes: new Set([0, 2]),
    score: 7,
    revealedRows: new Set([0]),
  };

  modules.state.resetQuizSession(state);
  assert.deepEqual(state.wrongAnswers, []);
  assert.equal(state.answeredIndexes.size, 0);
  assert.equal(state.score, 0);
  assert.equal(state.revealedRows.size, 0);
  assert.equal(state.activeQuizType, "capital-only");
});

test("state: resetToMenu remet le mode et garde le nombre choisi", () => {
  const modules = loadModule("../src/js/modules/state.js");
  const QUIZ_TYPES = {
    CAPITAL_ONLY: "capital-only",
  };

  const state = {
    activeQuizType: "country-only",
    selectedQuestionCount: "15",
    activeQuestionCount: "5",
    activeMixFilters: { europe: "all" },
    activeScopeKey: "europe",
    fullModeList: [{ code: "fr" }],
    countries: [{ code: "fr" }],
    wrongAnswers: [{ code: "de" }],
    answeredIndexes: new Set([0]),
    score: 1,
    revealedRows: new Set([0]),
  };

  modules.state.resetToMenu(state, QUIZ_TYPES);
  assert.equal(state.activeQuizType, "capital-only");
  assert.equal(state.activeQuestionCount, "15");
  assert.deepEqual(state.activeMixFilters, {});
  assert.equal(state.activeScopeKey, null);
  assert.deepEqual(state.fullModeList, []);
  assert.deepEqual(state.countries, []);
  assert.deepEqual(state.wrongAnswers, []);
  assert.equal(state.answeredIndexes.size, 0);
  assert.equal(state.score, 0);
  assert.equal(state.revealedRows.size, 0);
});

test("icons: retourne une icone valide et fallback sur all", () => {
  const modules = loadModule("../src/js/modules/icons.js");
  const getModeIconSvg = modules.icons.getModeIconSvg;

  assert.match(getModeIconSvg("oceania"), /<svg/);
  assert.match(getModeIconSvg("mix"), /<svg/);
  assert.equal(getModeIconSvg("unknown-key"), getModeIconSvg("all"));
});

test("dom: mappe correctement les elements attendus", () => {
  const modules = loadModule("../src/js/modules/dom.js");
  const fakeDoc = {
    getElementById(id) {
      return `id:${id}`;
    },
    querySelector(selector) {
      return `selector:${selector}`;
    },
  };

  const dom = modules.dom.getDomElements(fakeDoc);
  assert.equal(dom.modeGrid, "id:modeGrid");
  assert.equal(dom.progressTrack, "selector:.progress-track");
  assert.equal(dom.refreshDrawBtn, "id:refreshDrawBtn");
  assert.equal(dom.capitalToCountryTypeBtn, "id:capitalToCountryTypeBtn");
  assert.equal(dom.quickCapitalToCountryTypeBtn, "id:quickCapitalToCountryTypeBtn");
  assert.equal(dom.quickQuestionCountSelect, "id:quickQuestionCountSelect");
  assert.equal(dom.mixConfigPanel, "id:mixConfigPanel");
  assert.equal(dom.mixConfigTitle, "id:mixConfigTitle");
  assert.equal(dom.mixConfigDescription, "id:mixConfigDescription");
});

test("storage: register, resolve et clear fonctionnent", (t) => {
  const modules = loadModule("../src/js/modules/storage.js");
  const previousStorage = globalThis.localStorage;
  const mockStorage = createMockStorage();
  globalThis.localStorage = mockStorage;

  t.after(() => {
    globalThis.localStorage = previousStorage;
  });

  const store = modules.storage.createErrorHistoryStore({
    storageKey: "errors.test",
    mergeUniqueCountryLists: mergeUniqueByCode,
    removeCountryFromList: removeByCode,
  });

  store.load();
  assert.equal(store.getCount(), 0);

  store.register({ country: "France", capital: "Paris", code: "fr" });
  store.register({ country: "France", capital: "Paris", code: "fr" });
  store.register({ country: "Allemagne", capital: "Berlin", code: "de" });
  assert.equal(store.getCount(), 2);

  store.resolve({ code: "fr" });
  assert.equal(store.getCount(), 1);
  assert.equal(store.getAll()[0].code, "de");

  store.clear();
  assert.equal(store.getCount(), 0);
});

test("storage: load ignore les donnees invalides", (t) => {
  const modules = loadModule("../src/js/modules/storage.js");
  const previousStorage = globalThis.localStorage;
  const mockStorage = createMockStorage({
    badJson: "{invalid-json",
    notArray: JSON.stringify({ code: "fr" }),
  });
  globalThis.localStorage = mockStorage;

  t.after(() => {
    globalThis.localStorage = previousStorage;
  });

  const createStore = (key) =>
    modules.storage.createErrorHistoryStore({
      storageKey: key,
      mergeUniqueCountryLists: mergeUniqueByCode,
      removeCountryFromList: removeByCode,
    });

  const badJsonStore = createStore("badJson");
  badJsonStore.load();
  assert.equal(badJsonStore.getCount(), 0);

  const notArrayStore = createStore("notArray");
  notArrayStore.load();
  assert.equal(notArrayStore.getCount(), 0);
});

test("storage: normalizeEntries est applique au load et register", (t) => {
  const modules = loadModule("../src/js/modules/storage.js");
  const previousStorage = globalThis.localStorage;
  const mockStorage = createMockStorage({
    normalized: JSON.stringify([{ country: "Frnace", capital: "Pariss", code: "fr" }]),
  });
  globalThis.localStorage = mockStorage;

  t.after(() => {
    globalThis.localStorage = previousStorage;
  });

  const store = modules.storage.createErrorHistoryStore({
    storageKey: "normalized",
    mergeUniqueCountryLists: mergeUniqueByCode,
    removeCountryFromList: removeByCode,
    normalizeEntries(entries) {
      return entries.map((entry) => ({
        ...entry,
        country: entry.code === "fr" ? "France" : entry.country,
        capital: entry.code === "fr" ? "Paris" : entry.capital,
      }));
    },
  });

  store.load();
  assert.equal(store.getAll()[0].country, "France");
  assert.equal(store.getAll()[0].capital, "Paris");

  store.register({ country: "Espagn", capital: "Madrd", code: "es" });
  const all = store.getAll();
  assert.equal(all.length, 2);
});

test("storage: les erreurs de sauvegarde localStorage sont ignorees", (t) => {
  const modules = loadModule("../src/js/modules/storage.js");
  const previousStorage = globalThis.localStorage;
  const mockStorage = createMockStorage({}, { throwOnSet: true });
  globalThis.localStorage = mockStorage;

  t.after(() => {
    globalThis.localStorage = previousStorage;
  });

  const store = modules.storage.createErrorHistoryStore({
    storageKey: "throwing",
    mergeUniqueCountryLists: mergeUniqueByCode,
    removeCountryFromList: removeByCode,
  });

  assert.doesNotThrow(() => store.load());
  assert.doesNotThrow(() =>
    store.register({ country: "France", capital: "Paris", code: "fr" })
  );
  assert.doesNotThrow(() => store.clear());
});

test("modules: plusieurs modules coexistent dans QuizAppModules", () => {
  delete globalThis.QuizAppModules;
  loadModule("../src/js/modules/constants.js", { resetModules: false });
  loadModule("../src/js/modules/icons.js", { resetModules: false });
  loadModule("../src/js/modules/state.js", { resetModules: false });

  assert.ok(globalThis.QuizAppModules.constants);
  assert.ok(globalThis.QuizAppModules.icons);
  assert.ok(globalThis.QuizAppModules.state);
});
