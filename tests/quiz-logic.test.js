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

test("autoCapitalizeWords met une majuscule au debut de chaque mot", () => {
  const value = QuizLogic.autoCapitalizeWords("saint pierre et miquelon");
  assert.equal(value, "Saint Pierre Et Miquelon");
});

test("autoCapitalizeWords gere aussi tirets, apostrophes et accents", () => {
  const value = QuizLogic.autoCapitalizeWords("cote-d'ivoire et são tomé");
  assert.equal(value, "Cote-D'Ivoire Et São Tomé");
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

test("getFlagChallengeErrorType identifie correctement le champ en erreur", () => {
  assert.equal(QuizLogic.getFlagChallengeErrorType(true, true), "none");
  assert.equal(QuizLogic.getFlagChallengeErrorType(false, true), "country");
  assert.equal(QuizLogic.getFlagChallengeErrorType(true, false), "capital");
  assert.equal(QuizLogic.getFlagChallengeErrorType(false, false), "country-and-capital");
});

test("formatFlagChallengeWrongFeedback detaille le type d'erreur", () => {
  const entry = { country: "Argentine", capital: "Buenos Aires" };

  assert.equal(
    QuizLogic.formatFlagChallengeWrongFeedback("country", entry),
    "Faux: pays seulement (attendu: Argentine)"
  );
  assert.equal(
    QuizLogic.formatFlagChallengeWrongFeedback("capital", entry),
    "Faux: capitale seulement (attendu: Buenos Aires)"
  );
  assert.equal(
    QuizLogic.formatFlagChallengeWrongFeedback("country-and-capital", entry),
    "Faux: pays + capitale (attendu: Argentine - Buenos Aires)"
  );
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

test("isCountryAnswerCorrect accepte les versions courtes de certains pays longs", () => {
  const saintChristophe = QUIZ_DATA.northAmerica.countries.find((country) => country.code === "kn");
  const saintVincent = QUIZ_DATA.northAmerica.countries.find((country) => country.code === "vc");

  assert.ok(saintChristophe);
  assert.ok(saintVincent);

  assert.equal(QuizLogic.isCountryAnswerCorrect(saintChristophe, "saint christophe"), true);
  assert.equal(QuizLogic.isCountryAnswerCorrect(saintVincent, "saint vincent"), true);
});

test("isCountryAnswerCorrect accepte USA et NZE", () => {
  const usa = QUIZ_DATA.northAmerica.countries.find((country) => country.code === "us");
  const nze = QUIZ_DATA.oceania.countries.find((country) => country.code === "nz");

  assert.ok(usa);
  assert.ok(nze);

  assert.equal(QuizLogic.isCountryAnswerCorrect(usa, "usa"), true);
  assert.equal(QuizLogic.isCountryAnswerCorrect(nze, "nze"), true);
});

test("Capitale -> Pays: accepte tous les pays partageant la meme capitale", () => {
  const jamaique = QUIZ_DATA.northAmerica.countries.find((country) => country.code === "jm");
  const ileNorfolk = QUIZ_DATA.oceania.countries.find((country) => country.code === "nf");

  assert.ok(jamaique);
  assert.ok(ileNorfolk);

  const matchingCountries = QuizLogic.getCountriesMatchingCapital(QUIZ_DATA, jamaique);
  const matchingCodes = new Set(matchingCountries.map((entry) => entry.code));

  assert.ok(matchingCodes.has("jm"));
  assert.ok(matchingCodes.has("nf"));
  assert.equal(
    QuizLogic.isCountryAnswerCorrectForCapital(QUIZ_DATA, jamaique, "Ile norfolk"),
    true
  );
  assert.equal(
    QuizLogic.isCountryAnswerCorrectForCapital(QUIZ_DATA, jamaique, "Jamaique"),
    true
  );
  assert.equal(
    QuizLogic.isCountryAnswerCorrectForCapital(QUIZ_DATA, jamaique, "Canada"),
    false
  );
});

test("Vatican accepte 'vatican' pour pays et capitale", () => {
  const entry = QUIZ_DATA.europe.countries.find((country) => country.code === "va");
  assert.ok(entry);

  assert.equal(QuizLogic.isCountryAnswerCorrect(entry, "vatican"), true);
  assert.equal(QuizLogic.isCapitalAnswerCorrect(entry, "vatican"), true);
});

test("mode drapeau: Vatican + Vatican est valide", () => {
  const entry = QUIZ_DATA.europe.countries.find((country) => country.code === "va");
  assert.ok(entry);

  assert.equal(QuizLogic.isFlagChallengeCorrect(entry, "vatican", "vatican"), true);
});

test("compatibilite ancienne donnee Vatican City: Vatican reste accepte", () => {
  const legacyEntry = {
    country: "Cite du Vatican",
    capital: "Vatican City",
    code: "va",
  };

  assert.equal(QuizLogic.isCountryAnswerCorrect(legacyEntry, "vatican"), true);
  assert.equal(QuizLogic.isCapitalAnswerCorrect(legacyEntry, "vatican"), true);
  assert.equal(QuizLogic.isFlagChallengeCorrect(legacyEntry, "vatican", "vatican"), true);
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
  const uniqueCodes = new Set(
    Object.values(QUIZ_DATA)
      .flatMap((mode) => mode.countries)
      .map((country) => String(country.code || "").toLowerCase())
      .filter(Boolean)
  );

  assert.equal(all.length, uniqueCodes.size);
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
  assert.ok(keys.includes(QuizLogic.QUIZ_SCOPE_KEYS.CUSTOM_MIX));

  const allOption = options.find((option) => option.key === QuizLogic.QUIZ_SCOPE_KEYS.ALL);
  const randomOption = options.find(
    (option) => option.key === QuizLogic.QUIZ_SCOPE_KEYS.RANDOM_15
  );
  assert.equal(allOption.name, "Tour du Monde");
  assert.equal(randomOption.name, "Sprint 15");
});

test("buildCustomMixCountries permet un melange par zone avec filtres", () => {
  const filters = {
    northAmerica: QuizLogic.MIX_FILTER_KEYS.MAINLAND,
    europe: QuizLogic.MIX_FILTER_KEYS.ISLANDS,
  };
  const mixed = QuizLogic.buildCustomMixCountries(QUIZ_DATA, filters);
  const codes = new Set(mixed.map((entry) => entry.code));

  assert.ok(codes.has("ca"), "Canada attendu (pays NA)");
  assert.ok(codes.has("ax"), "Aland attendue (ile Europe)");
  assert.equal(codes.has("bs"), false, "Bahamas ne doit pas etre inclus (ile NA)");
  assert.equal(codes.has("fr"), false, "France ne doit pas etre incluse (pays Europe)");
});

test("hasActiveRegionFilters detecte une selection valide", () => {
  assert.equal(
    QuizLogic.hasActiveRegionFilters({
      northAmerica: QuizLogic.MIX_FILTER_KEYS.OFF,
      europe: QuizLogic.MIX_FILTER_KEYS.OFF,
    }),
    false
  );

  assert.equal(
    QuizLogic.hasActiveRegionFilters({
      northAmerica: QuizLogic.MIX_FILTER_KEYS.MAINLAND,
      europe: QuizLogic.MIX_FILTER_KEYS.OFF,
    }),
    true
  );
});

test("resolveQuestionCountLimit calcule correctement la limite demandee", () => {
  assert.equal(QuizLogic.resolveQuestionCountLimit("all", 23), 23);
  assert.equal(QuizLogic.resolveQuestionCountLimit(10, 23), 10);
  assert.equal(QuizLogic.resolveQuestionCountLimit(40, 23), 23);
  assert.equal(QuizLogic.resolveQuestionCountLimit("invalid", 23), 23);
  assert.equal(QuizLogic.resolveQuestionCountLimit(0, 23), 1);
  assert.equal(QuizLogic.resolveQuestionCountLimit(10, 0), 0);
});

test("formatQuestionCountSelection retourne un libelle lisible", () => {
  assert.equal(QuizLogic.formatQuestionCountSelection("all", 20), "Toutes (20)");
  assert.equal(QuizLogic.formatQuestionCountSelection(7, 20), "7 questions");
  assert.equal(QuizLogic.formatQuestionCountSelection(70, 20), "Toutes (20)");
  assert.equal(QuizLogic.formatQuestionCountSelection(10, 0), "0 question");
});

test("pickQuizCountries melange puis limite a la quantite demandee", () => {
  const source = [
    { country: "A", capital: "A", code: "aa" },
    { country: "B", capital: "B", code: "bb" },
    { country: "C", capital: "C", code: "cc" },
    { country: "D", capital: "D", code: "dd" },
  ];

  const picked = QuizLogic.pickQuizCountries(source, 2, () => 0.37);
  assert.equal(picked.length, 2);
  assert.notEqual(picked, source);
  assert.deepEqual(source.map((entry) => entry.code), ["aa", "bb", "cc", "dd"]);
});

test("resolvePreferredScopeKey garde la valeur demandee si elle existe", () => {
  const options = QuizLogic.buildScopeOptions(QUIZ_DATA, 15);
  const key = QuizLogic.resolvePreferredScopeKey(options, QuizLogic.QUIZ_SCOPE_KEYS.RANDOM_15);
  assert.equal(key, QuizLogic.QUIZ_SCOPE_KEYS.RANDOM_15);
});

test("resolvePreferredScopeKey fallback sur le premier scope si absent", () => {
  const options = QuizLogic.buildScopeOptions(QUIZ_DATA, 15);
  const key = QuizLogic.resolvePreferredScopeKey(options, "unknown");
  assert.equal(key, options[0].key);
});

test("alignEntriesWithQuizData remplace les libelles par la reference data via code", () => {
  const legacyEntries = [
    { country: "Frnace", capital: "Pariss", code: "fr" },
    { country: "Unknown", capital: "Nowhere", code: "zz" },
  ];

  const aligned = QuizLogic.alignEntriesWithQuizData(legacyEntries, QUIZ_DATA);
  const franceRef = QUIZ_DATA.europe.countries.find((entry) => entry.code === "fr");

  assert.equal(aligned[0].country, franceRef.country);
  assert.equal(aligned[0].capital, franceRef.capital);
  assert.equal(aligned[1].country, "Unknown");
  assert.equal(legacyEntries[0].country, "Frnace");
});

test("resolveScopeCountries retourne la bonne liste pour un continent", () => {
  const oceania = QuizLogic.resolveScopeCountries(QUIZ_DATA, "oceania", 15);
  assert.equal(oceania.length, QUIZ_DATA.oceania.countries.length);
  assert.notEqual(oceania[0], QUIZ_DATA.oceania.countries[0]);
});

test("resolveScopeCountries retourne la bonne liste pour l'Asie", () => {
  const asia = QuizLogic.resolveScopeCountries(QUIZ_DATA, "asia", 15);
  assert.equal(asia.length, QUIZ_DATA.asia.countries.length);
  assert.ok(asia.some((entry) => entry.code === "af"));
  assert.ok(asia.some((entry) => entry.code === "jp"));
  assert.ok(asia.some((entry) => entry.code === "tr"));
});

test("resolveScopeCountries retourne tous les pays pour le scope all", () => {
  const all = QuizLogic.resolveScopeCountries(QUIZ_DATA, QuizLogic.QUIZ_SCOPE_KEYS.ALL, 15);
  const expectedCount = new Set(
    Object.values(QUIZ_DATA)
      .flatMap((mode) => mode.countries)
      .map((country) => String(country.code || "").toLowerCase())
      .filter(Boolean)
  ).size;

  assert.equal(all.length, expectedCount);
});

test("resolveScopeCountries retourne la liste des iles sur le scope islands", () => {
  const islands = QuizLogic.resolveScopeCountries(QUIZ_DATA, "islands", 15);

  assert.equal(islands.length, QUIZ_DATA.islands.countries.length);
  assert.ok(islands.length > 0);
  assert.notEqual(islands[0], QUIZ_DATA.islands.countries[0]);
});

test("resolveScopeCountries retourne un melange personnalise sur scope customMix", () => {
  const custom = QuizLogic.resolveScopeCountries(
    QUIZ_DATA,
    QuizLogic.QUIZ_SCOPE_KEYS.CUSTOM_MIX,
    15,
    () => 0.25,
    {
      regionFilters: {
        oceania: QuizLogic.MIX_FILTER_KEYS.ALL,
        europe: QuizLogic.MIX_FILTER_KEYS.MAINLAND,
      },
    }
  );

  const codes = new Set(custom.map((entry) => entry.code));
  assert.ok(codes.has("au"), "Australie attendue");
  assert.ok(codes.has("fr"), "France attendue");
  assert.equal(codes.has("ax"), false, "Aland non attendue (ile Europe)");
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

test("resolveScopeCountries random15 applique les filtres de continents et type", () => {
  const random = QuizLogic.resolveScopeCountries(
    QUIZ_DATA,
    QuizLogic.QUIZ_SCOPE_KEYS.RANDOM_15,
    15,
    () => 0.2,
    {
      regionFilters: {
        europe: QuizLogic.MIX_FILTER_KEYS.MAINLAND,
      },
    }
  );

  const allowedCodes = new Set(
    QUIZ_DATA.europe.countries
      .filter((entry) => !QUIZ_DATA.islands.countries.some((island) => island.code === entry.code))
      .map((entry) => entry.code)
  );

  assert.equal(random.length, 15);
  random.forEach((entry) => {
    assert.ok(allowedCodes.has(entry.code), `code non attendu dans sprint filtre: ${entry.code}`);
  });
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
  assert.equal(
    QuizLogic.getRevealText("capital-to-country", entry),
    "Reponse: Argentine"
  );
});

test("toggleRevealState bascule visible/masque", () => {
  assert.equal(QuizLogic.toggleRevealState(false), true);
  assert.equal(QuizLogic.toggleRevealState(true), false);
});

test("getPostAnswerButtonState garde 'Voir' actif apres validation", () => {
  const state = QuizLogic.getPostAnswerButtonState();
  assert.equal(state.checkDisabled, true);
  assert.equal(state.revealDisabled, false);
});

test("getCompletionPercent calcule un pourcentage borne", () => {
  assert.equal(QuizLogic.getCompletionPercent(0, 10), 0);
  assert.equal(QuizLogic.getCompletionPercent(3, 10), 30);
  assert.equal(QuizLogic.getCompletionPercent(12, 10), 100);
  assert.equal(QuizLogic.getCompletionPercent(2, 0), 0);
});

test("getNextUnansweredIndex retourne la prochaine question libre", () => {
  const next = QuizLogic.getNextUnansweredIndex(new Set([0, 1, 3]), 5, 2);
  assert.equal(next, 2);
});

test("getNextUnansweredIndex fait un wrap quand on arrive a la fin", () => {
  const next = QuizLogic.getNextUnansweredIndex([0, 1, 2, 4], 5, 5);
  assert.equal(next, 3);
});

test("getNextUnansweredIndex retourne -1 si tout est complete", () => {
  const next = QuizLogic.getNextUnansweredIndex([0, 1, 2], 3, 1);
  assert.equal(next, -1);
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

test("shouldGenerateNewRandomSampleOnRestart true uniquement pour Sprint 15", () => {
  assert.equal(
    QuizLogic.shouldGenerateNewRandomSampleOnRestart(QuizLogic.QUIZ_SCOPE_KEYS.RANDOM_15),
    true
  );
  assert.equal(QuizLogic.shouldGenerateNewRandomSampleOnRestart(QuizLogic.QUIZ_SCOPE_KEYS.ALL), false);
  assert.equal(
    QuizLogic.shouldGenerateNewRandomSampleOnRestart(QuizLogic.QUIZ_SCOPE_KEYS.SAVED_ERRORS),
    false
  );
});

test("shouldShowPerfectSavedErrorsMenuButton true seulement sur mode erreurs avec score parfait", () => {
  const key = QuizLogic.QUIZ_SCOPE_KEYS.SAVED_ERRORS;

  assert.equal(QuizLogic.shouldShowPerfectSavedErrorsMenuButton(key, 5, 5), true);
  assert.equal(QuizLogic.shouldShowPerfectSavedErrorsMenuButton(key, 4, 5), false);
  assert.equal(QuizLogic.shouldShowPerfectSavedErrorsMenuButton("all", 5, 5), false);
  assert.equal(QuizLogic.shouldShowPerfectSavedErrorsMenuButton(key, 0, 0), false);
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

test("removeCountryFromList retire aussi une entree legacy si le code est identique", () => {
  const list = [
    { country: "Cite du Vatican", capital: "Vatican City", code: "va" },
    { country: "France", capital: "Paris", code: "fr" },
  ];

  const updated = QuizLogic.removeCountryFromList(list, {
    country: "Cite du Vatican",
    capital: "Vatican",
    code: "va",
  });

  assert.equal(updated.length, 1);
  assert.equal(updated[0].code, "fr");
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
