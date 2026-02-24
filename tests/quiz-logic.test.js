const test = require("node:test");
const assert = require("node:assert/strict");

const QuizLogic = require("../quiz-logic");
const QUIZ_DATA = require("../data");

test("normalizeText retire accents, ponctuation et casse", () => {
  const value = QuizLogic.normalizeText("  S\u00E3o-Tom\u00E9 d'\u00C1vila !! ");
  assert.equal(value, "saotomedavila");
});

test("normalizeTextRelaxed ignore ile/iles et tolere le s final", () => {
  const value = QuizLogic.normalizeTextRelaxed("Iles Caimans");
  const valueNoIle = QuizLogic.normalizeTextRelaxed("Caiman");
  assert.equal(value, "caiman");
  assert.equal(valueNoIle, "caiman");
});

test("buildAcceptedAnswers inclut la valeur principale et les alternatives normalisees", () => {
  const answers = QuizLogic.buildAcceptedAnswers("Port-d'Espagne", ["Port of Spain", null, ""]);
  assert.deepEqual(answers, ["portdespagne", "portofspain"]);
});

test("isCapitalAnswerCorrect accepte la capitale principale et les alternatives", () => {
  const entry = {
    country: "Trinite-et-Tobago",
    capital: "Port-d'Espagne",
    alternates: ["Port of Spain"],
  };

  assert.equal(QuizLogic.isCapitalAnswerCorrect(entry, "port d espagne"), true);
  assert.equal(QuizLogic.isCapitalAnswerCorrect(entry, "PORT OF SPAIN"), true);
  assert.equal(QuizLogic.isCapitalAnswerCorrect(entry, "Bridgetown"), false);
});

test("isFlagChallengeCorrect exige pays + capitale corrects", () => {
  const entry = {
    country: "Etats-Unis",
    countryAlternates: ["USA", "United States"],
    capital: "Washington",
    alternates: ["Washington DC"],
  };

  assert.equal(QuizLogic.isFlagChallengeCorrect(entry, "usa", "washington dc"), true);
  assert.equal(QuizLogic.isFlagChallengeCorrect(entry, "usa", "new york"), false);
  assert.equal(QuizLogic.isFlagChallengeCorrect(entry, "canada", "washington"), false);
});

test("isCountryAnswerCorrect valide uniquement le pays", () => {
  const entry = {
    country: "Palaos (palau)",
    capital: "Ngerulmud",
    countryAlternates: ["Palau"],
  };

  assert.equal(QuizLogic.isCountryAnswerCorrect(entry, "palaos"), true);
  assert.equal(QuizLogic.isCountryAnswerCorrect(entry, "palau"), true);
  assert.equal(QuizLogic.isCountryAnswerCorrect(entry, "fidji"), false);
});

test("isFlagChallengeCorrect tolere tirets, ile/iles et s final", () => {
  const entry = {
    country: "Iles Caimans",
    capital: "George Town",
  };

  assert.equal(QuizLogic.isFlagChallengeCorrect(entry, "ile caiman", "george-town"), true);
});

test("isFlagChallengeCorrect accepte la version courte d'un pays avec parenthese", () => {
  const entry = {
    country: "Palaos (palau)",
    capital: "Ngerulmud",
  };

  assert.equal(QuizLogic.isFlagChallengeCorrect(entry, "palaos", "ngerulmud"), true);
});

test("isCapitalAnswerCorrect tolere tiret et s final", () => {
  const entry = {
    country: "Grece",
    capital: "Athenes",
  };

  assert.equal(QuizLogic.isCapitalAnswerCorrect(entry, "athene"), true);
});

test("shuffleCopy renvoie un nouveau tableau sans muter la source", () => {
  const source = [1, 2, 3, 4];
  const shuffled = QuizLogic.shuffleCopy(source, () => 0.5);

  assert.notEqual(shuffled, source);
  assert.deepEqual(source, [1, 2, 3, 4]);
  assert.deepEqual([...shuffled].sort((a, b) => a - b), [1, 2, 3, 4]);
});

test("getAllCountries combine tous les modes et clone les objets", () => {
  const all = QuizLogic.getAllCountries(QUIZ_DATA);
  const expectedCount = Object.values(QUIZ_DATA).reduce(
    (sum, mode) => sum + mode.countries.length,
    0
  );

  assert.equal(all.length, expectedCount);
  assert.notEqual(all[0], Object.values(QUIZ_DATA)[0].countries[0]);
});

test("buildScopeOptions expose continents + all + random15", () => {
  const options = QuizLogic.buildScopeOptions(QUIZ_DATA, 15);
  const keys = options.map((option) => option.key);

  for (const key of Object.keys(QUIZ_DATA)) {
    assert.ok(keys.includes(key), `scope region manquant: ${key}`);
  }

  assert.ok(keys.includes(QuizLogic.QUIZ_SCOPE_KEYS.ALL));
  assert.ok(keys.includes(QuizLogic.QUIZ_SCOPE_KEYS.RANDOM_15));

  const allOption = options.find((option) => option.key === QuizLogic.QUIZ_SCOPE_KEYS.ALL);
  const randomOption = options.find(
    (option) => option.key === QuizLogic.QUIZ_SCOPE_KEYS.RANDOM_15
  );
  assert.equal(allOption.name, "Tour du Monde");
  assert.equal(randomOption.name, "Sprint 15");
});

test("resolveScopeCountries retourne la bonne liste pour un continent", () => {
  const oceania = QuizLogic.resolveScopeCountries(QUIZ_DATA, "oceania", 15);
  assert.equal(oceania.length, QUIZ_DATA.oceania.countries.length);
  assert.notEqual(oceania[0], QUIZ_DATA.oceania.countries[0]);
});

test("resolveScopeCountries retourne tous les pays pour le scope all", () => {
  const all = QuizLogic.resolveScopeCountries(QUIZ_DATA, QuizLogic.QUIZ_SCOPE_KEYS.ALL, 15);
  const expectedCount = Object.values(QUIZ_DATA).reduce(
    (sum, mode) => sum + mode.countries.length,
    0
  );

  assert.equal(all.length, expectedCount);
});

test("resolveScopeCountries retourne 15 elements pour random15", () => {
  const random = QuizLogic.resolveScopeCountries(
    QUIZ_DATA,
    QuizLogic.QUIZ_SCOPE_KEYS.RANDOM_15,
    15,
    () => 0.1234
  );

  assert.equal(random.length, 15);

  const allCodes = new Set(QuizLogic.getAllCountries(QUIZ_DATA).map((entry) => entry.code));
  for (const entry of random) {
    assert.ok(allCodes.has(entry.code));
  }
});

test("resolveScopeCountries leve une erreur sur un scope inconnu", () => {
  assert.throws(() => {
    QuizLogic.resolveScopeCountries(QUIZ_DATA, "unknown-scope", 15);
  });
});

test("getRevealText adapte le texte selon le type de quiz", () => {
  const entry = { country: "Argentine", capital: "Buenos Aires" };

  assert.equal(
    QuizLogic.getRevealText("capital-only", entry),
    "Reponse: Buenos Aires"
  );
  assert.equal(
    QuizLogic.getRevealText("flag-country-capital", entry),
    "Reponse: Argentine - Buenos Aires"
  );
  assert.equal(
    QuizLogic.getRevealText("country-only", entry),
    "Reponse: Argentine"
  );
});

test("toggleRevealState bascule visible/masque", () => {
  assert.equal(QuizLogic.toggleRevealState(false), true);
  assert.equal(QuizLogic.toggleRevealState(true), false);
});

test("mergeUniqueCountryLists fusionne sans doublons", () => {
  const a = [
    { country: "France", capital: "Paris", code: "fr" },
    { country: "Espagne", capital: "Madrid", code: "es" },
  ];
  const b = [
    { country: "France", capital: "Paris", code: "fr" },
    { country: "Italie", capital: "Rome", code: "it" },
  ];

  const merged = QuizLogic.mergeUniqueCountryLists(a, b);
  assert.equal(merged.length, 3);
  assert.deepEqual(
    merged.map((entry) => entry.code).sort(),
    ["es", "fr", "it"]
  );
});

test("mergeUniqueCountryLists ignore les entrees invalides", () => {
  const merged = QuizLogic.mergeUniqueCountryLists(
    [{ country: "Canada", capital: "Ottawa", code: "ca" }],
    [{ country: "Invalid", capital: "", code: "xx" }, null]
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0].code, "ca");
});

test("formatRetryButtonLabel inclut le compteur si > 0", () => {
  assert.equal(QuizLogic.formatRetryButtonLabel(0), "Rejouer les erreurs");
  assert.equal(QuizLogic.formatRetryButtonLabel(3), "Rejouer les erreurs (3)");
});

test("shouldShowSavedErrorActions retourne true seulement si compteur > 0", () => {
  assert.equal(QuizLogic.shouldShowSavedErrorActions(0), false);
  assert.equal(QuizLogic.shouldShowSavedErrorActions(-1), false);
  assert.equal(QuizLogic.shouldShowSavedErrorActions(1), true);
});

test("buildSavedErrorsScopeOption construit la carte du mode erreurs", () => {
  const option = QuizLogic.buildSavedErrorsScopeOption(4);

  assert.equal(option.key, QuizLogic.QUIZ_SCOPE_KEYS.SAVED_ERRORS);
  assert.equal(option.name, "Revision Ciblee");
  assert.equal(option.countLabel, "4 a corriger");
  assert.equal(option.iconKey, "savedErrors");
});

test("formatClearErrorsButtonLabel inclut le compteur si > 0", () => {
  assert.equal(QuizLogic.formatClearErrorsButtonLabel(0), "Reinitialiser les erreurs");
  assert.equal(
    QuizLogic.formatClearErrorsButtonLabel(5),
    "Reinitialiser les erreurs (5)"
  );
});

test("removeCountryFromList retire uniquement le pays corrige", () => {
  const list = [
    { country: "France", capital: "Paris", code: "fr" },
    { country: "Espagne", capital: "Madrid", code: "es" },
    { country: "Italie", capital: "Rome", code: "it" },
  ];
  const updated = QuizLogic.removeCountryFromList(list, {
    country: "Espagne",
    capital: "Madrid",
    code: "es",
  });

  assert.equal(updated.length, 2);
  assert.deepEqual(
    updated.map((entry) => entry.code).sort(),
    ["fr", "it"]
  );
});

test("getFlagModalPresentation masque le nom en mode drapeau", () => {
  const entry = { country: "Argentine", capital: "Buenos Aires", code: "ar" };
  const presentation = QuizLogic.getFlagModalPresentation("flag-country-capital", entry);

  assert.equal(presentation.showLabel, false);
  assert.equal(presentation.label, "");
  assert.equal(presentation.alt, "Drapeau a deviner");
});

test("getFlagModalPresentation masque aussi le nom en mode pays seulement", () => {
  const entry = { country: "Argentine", capital: "Buenos Aires", code: "ar" };
  const presentation = QuizLogic.getFlagModalPresentation("country-only", entry);

  assert.equal(presentation.showLabel, false);
  assert.equal(presentation.label, "");
  assert.equal(presentation.alt, "Drapeau a deviner");
});

test("getFlagModalPresentation affiche le nom hors mode drapeau", () => {
  const entry = { country: "Argentine", capital: "Buenos Aires", code: "ar" };
  const presentation = QuizLogic.getFlagModalPresentation("capital-only", entry);

  assert.equal(presentation.showLabel, true);
  assert.equal(presentation.label, "Argentine");
  assert.equal(presentation.alt, "Drapeau de Argentine");
});

test("donnees: chaque mode contient des pays avec country/capital/code", () => {
  for (const [modeKey, mode] of Object.entries(QUIZ_DATA)) {
    assert.ok(mode.countries.length > 0, `mode vide: ${modeKey}`);

    for (const country of mode.countries) {
      assert.ok(country.country, `${modeKey}: country manquant`);
      assert.ok(country.capital, `${modeKey}: capital manquant`);
      assert.match(country.code, /^[a-z]{2}$/i, `${modeKey}: code invalide ${country.code}`);
    }
  }
});
