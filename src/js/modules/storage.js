(function registerQuizStorage(root) {
  const modules = (root.QuizAppModules = root.QuizAppModules || {});

  function createErrorHistoryStore({
    storageKey,
    mergeUniqueCountryLists,
    removeCountryFromList,
    normalizeEntries,
  }) {
    let persistedWrongAnswers = [];

    function normalizePersistedEntries(entries) {
      if (typeof normalizeEntries === "function") {
        const normalized = normalizeEntries(entries);
        if (Array.isArray(normalized)) {
          return normalized;
        }
      }
      return entries;
    }

    function load() {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) {
          persistedWrongAnswers = [];
          return;
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          persistedWrongAnswers = [];
          return;
        }

        const normalized = normalizePersistedEntries(parsed);
        persistedWrongAnswers = mergeUniqueCountryLists([], normalized);
        save();
      } catch (_error) {
        persistedWrongAnswers = [];
      }
    }

    function save() {
      try {
        localStorage.setItem(storageKey, JSON.stringify(persistedWrongAnswers));
      } catch (_error) {
        // Ignore storage failures (private mode / quota).
      }
    }

    function register(country) {
      const normalized = normalizePersistedEntries([country]);
      persistedWrongAnswers = mergeUniqueCountryLists(persistedWrongAnswers, normalized);
      save();
    }

    function resolve(country) {
      persistedWrongAnswers = removeCountryFromList(persistedWrongAnswers, country);
      save();
    }

    function clear() {
      persistedWrongAnswers = [];
      save();
    }

    function getAll() {
      const normalized = normalizePersistedEntries(persistedWrongAnswers);
      return mergeUniqueCountryLists([], normalized);
    }

    function getCount() {
      return persistedWrongAnswers.length;
    }

    return {
      load,
      register,
      resolve,
      clear,
      getAll,
      getCount,
    };
  }

  modules.storage = {
    createErrorHistoryStore,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
