const QUIZ_DATA = {
  oceania: {
    name: "Oceanie",
    emoji: "🌊",
    countries: [
      { country: "Australie", capital: "Canberra", code: "au" },
      { country: "Fidji", capital: "Suva", code: "fj" },
      { country: "Guam", capital: "Hagåtña", code: "gu" },
      { country: "Île norfolk", capital: "Kingston", code: "nf" },
      { country: "Îles cook", capital: "Avarua", code: "ck" },
      { country: "Îles mariannes du nord", capital: "Saipan", code: "mp" },
      { country: "Îles marshall", capital: "Majuro", code: "mh" },
      { country: "Îles mineures éloignées des états-unis", capital: "Washington dc", code: "um"},
      { country: "Îles pitcairn", capital: "Adamstown", code: "pn" },
      { country: "Îles salomon", capital: "Honiara", code: "sb" },
      { country: "Kiribati", capital: "South tarawa", code: "ki" },
      { country: "Micronésie", capital: "Palikir", code: "fm" },
      { country: "Nauru", capital: "Yaren", code: "nr" },
      { country: "Niue", capital: "Alofi", code: "nu" },
      { country: "Nouvelle-calédonie", capital: "Nouméa", code: "nc" },
      {
        country: "Nouvelle-zélande",
        capital: "Wellington",
        code: "nz",
        countryAlternates: ["NZE"],
      },
      { country: "Palaos (palau)", capital: "Ngerulmud", code: "pw" },
      {country: "Papouasie-nouvelle-guinée", capital: "Port moresby", code: "pg"},
      { country: "Polynésie française", capital: "Papeetē", code: "pf" },
      { country: "Samoa", capital: "Apia", code: "ws" },
      { country: "Samoa américaines", capital: "Pago pago", code: "as" },
      { country: "Tokelau", capital: "Fakaofo", code: "tk" },
      { country: "Tonga", capital: "Nuku'alofa", code: "to" },
      { country: "Tuvalu", capital: "Funafuti", code: "tv" },
      { country: "Vanuatu", capital: "Port vila", code: "vu" },
      { country: "Wallis-et-futuna", capital: "Mata-utu", code: "wf" },
    ],
  },
  northAmerica: {
    name: "Amerique du Nord",
    emoji: "🌎",
    countries: [
      { country: "Anguilla", capital: "The Valley", code: "ai" },
      { country: "Antigua-et-Barbuda", capital: "Saint John's", code: "ag" },
      { country: "Aruba", capital: "Oranjestad", code: "aw" },
      { country: "Bahamas", capital: "Nassau", code: "bs" },
      { country: "Barbade", capital: "Bridgetown", code: "bb" },
      { country: "Belize", capital: "Belmopan", code: "bz" },
      { country: "Bermudes", capital: "Hamilton", code: "bm" },
      { country: "Canada", capital: "Ottawa", code: "ca" },
      { country: "Costa Rica", capital: "San Jose", code: "cr" },
      { country: "Cuba", capital: "La Havane", code: "cu" },
      { country: "Curacao", capital: "Willemstad", code: "cw" },
      { country: "Dominique", capital: "Roseau", code: "dm" },
      {
        country: "Etats-Unis",
        capital: "Washington",
        code: "us",
        alternates: ["Washington DC", "Washington D.C."],
        countryAlternates: ["USA"],
      },
      {
        country: "Grenade",
        capital: "Saint-Georges",
        code: "gd",
        alternates: ["St George's"],
      },
      { country: "Groenland", capital: "Nuuk", code: "gl" },
      { country: "Guadeloupe", capital: "Basse-Terre", code: "gp" },
      { country: "Guatemala", capital: "Guatemala City", code: "gt" },
      { country: "Haiti", capital: "Port-au-Prince", code: "ht" },
      { country: "Honduras", capital: "Tegucigalpa", code: "hn" },
      { country: "Iles Caimans", capital: "George Town", code: "ky" },
      {
        country: "Iles Turques-et-Caiques",
        capital: "Cockburn Town",
        code: "tc",
      },
      {
        country: "Iles Vierges britanniques",
        capital: "Road Town",
        code: "vg",
      },
      {
        country: "Iles Vierges des Etats-Unis",
        capital: "Charlotte Amalie",
        code: "vi",
      },
      { country: "Jamaique", capital: "Kingston", code: "jm" },
      { country: "Martinique", capital: "Fort-de-France", code: "mq" },
      {
        country: "Mexique",
        capital: "Mexico",
        code: "mx",
        alternates: ["Mexico City"],
      },
      { country: "Montserrat", capital: "Plymouth", code: "ms" },
      { country: "Nicaragua", capital: "Managua", code: "ni" },
      { country: "Panama", capital: "Panama City", code: "pa" },
      { country: "Pays-Bas caribeen", capital: "Kralendijk", code: "bq" },
      { country: "Porto Rico", capital: "San Juan", code: "pr" },
      {
        country: "Republique dominicaine",
        capital: "Saint-Domingue",
        code: "do",
        alternates: ["Santo Domingo"],
      },
      { country: "Saint-Barthelemy", capital: "Gustavia", code: "bl" },
      {
        country: "Saint-Christophe-et-Nieves",
        capital: "Basseterre",
        code: "kn",
        countryAlternates: ["Saint-Christophe", "Saint Christophe"],
      },
      { country: "Saint-Martin (NL)", capital: "Philipsburg", code: "sx" },
      { country: "Saint-Martin (FR)", capital: "Marigot", code: "mf" },
      {
        country: "Saint-Pierre-et-Miquelon",
        capital: "Saint-Pierre",
        code: "pm",
      },
      {
        country: "Saint-Vincent-et-les-Grenadines",
        capital: "Kingstown",
        code: "vc",
        countryAlternates: ["Saint-Vincent", "Saint Vincent"],
      },
      { country: "Sainte-Lucie", capital: "Castries", code: "lc" },
      { country: "Salvador", capital: "San Salvador", code: "sv" },
      {
        country: "Trinite-et-Tobago",
        capital: "Port-d'Espagne",
        code: "tt",
        alternates: ["Port of Spain", "Port d Espagne"],
      },
    ],
  },
  southAmerica: {
    name: "Amerique du Sud",
    emoji: "🌄",
    countries: [
      { country: "Argentine", capital: "Buenos Aires", code: "ar" },
      { country: "Bolivie", capital: "Sucre", code: "bo" },
      { country: "Bresil", capital: "Brasilia", code: "br" },
      { country: "Chili", capital: "Santiago", code: "cl" },
      { country: "Colombie", capital: "Bogota", code: "co" },
      { country: "Equateur", capital: "Quito", code: "ec" },
      { country: "Guyana", capital: "Georgetown", code: "gy" },
      { country: "Guyane", capital: "Cayenne", code: "gf" },
      { country: "Iles Malouines", capital: "Stanley", code: "fk" },
      { country: "Paraguay", capital: "Asuncion", code: "py" },
      { country: "Perou", capital: "Lima", code: "pe" },
      { country: "Suriname", capital: "Paramaribo", code: "sr" },
      { country: "Uruguay", capital: "Montevideo", code: "uy" },
      { country: "Venezuela", capital: "Caracas", code: "ve" },
    ],
  },
  europe: {
    name: "Europe",
    emoji: "🏰",
    countries: [
      { country: "Aland", capital: "Mariehamn", code: "ax" },
      { country: "Albanie", capital: "Tirana", code: "al" },
      { country: "Allemagne", capital: "Berlin", code: "de" },
      { country: "Andorre", capital: "Andorre-la-Vieille", code: "ad", alternates: ["Andorra la Vella"] },
      { country: "Autriche", capital: "Vienne", code: "at", alternates: ["Vienna"] },
      { country: "Belgique", capital: "Bruxelles", code: "be", alternates: ["Brussels"] },
      { country: "Bielorussie", capital: "Minsk", code: "by" },
      { country: "Bosnie-Herzegovine", countryAlternates: ["Bosnie"], capital: "Sarajevo", code: "ba" },
      { country: "Bulgarie", capital: "Sofia", code: "bg" },
      {
        country: "Cite du Vatican",
        countryAlternates: ["Vatican"],
        capital: "Vatican",
        code: "va",
        alternates: ["Vatican City"],
      },
      { country: "Croatie", capital: "Zagreb", code: "hr" },
      { country: "Danemark", capital: "Copenhague", code: "dk", alternates: ["Copenhagen"] },
      { country: "Espagne", capital: "Madrid", code: "es" },
      { country: "Estonie", capital: "Tallinn", code: "ee" },
      { country: "Finlande", capital: "Helsinki", code: "fi" },
      { country: "France", capital: "Paris", code: "fr" },
      { country: "Gibraltar", capital: "Gibraltar", code: "gi" },
      { country: "Grece", capital: "Athenes", code: "gr", alternates: ["Athens"] },
      { country: "Guernesey", capital: "St Peter Port", code: "gg", alternates: ["Saint Peter Port"] },
      { country: "Hongrie", capital: "Budapest", code: "hu" },
      { country: "Ile de Man", capital: "Douglas", code: "im" },
      { country: "Iles Feroe", capital: "Torshavn", code: "fo", alternates: ["Tórshavn"] },
      { country: "Irlande", capital: "Dublin", code: "ie" },
      { country: "Islande", capital: "Reykjavik", code: "is" },
      { country: "Italie", capital: "Rome", code: "it" },
      { country: "Jersey", capital: "Saint Helier", code: "je", alternates: ["St Helier"] },
      { country: "Kosovo", capital: "Pristina", code: "xk" },
      { country: "Lettonie", capital: "Riga", code: "lv" },
      { country: "Liechtenstein", capital: "Vaduz", code: "li" },
      { country: "Lituanie", capital: "Vilnius", code: "lt" },
      { country: "Luxembourg", capital: "Luxembourg", code: "lu" },
      { country: "Macedoine du Nord", capital: "Skopje", code: "mk" },
      { country: "Malte", capital: "La Valette", code: "mt", alternates: ["Valletta"] },
      { country: "Moldavie", capital: "Chisinau", code: "md" },
      { country: "Monaco", capital: "Monaco", code: "mc" },
      { country: "Montenegro", capital: "Podgorica", code: "me" },
      { country: "Norvege", capital: "Oslo", code: "no" },
      { country: "Pays-Bas", capital: "Amsterdam", code: "nl" },
      { country: "Pologne", capital: "Varsovie", code: "pl", alternates: ["Warsaw"] },
      { country: "Portugal", capital: "Lisbonne", code: "pt", alternates: ["Lisbon"] },
      { country: "Republique tcheque", capital: "Prague", code: "cz" },
      { country: "Roumanie", capital: "Bucarest", code: "ro", alternates: ["Bucharest"] },
      { country: "Royaume-Uni", capital: "Londres", code: "gb", alternates: ["London"] },
      { country: "Russie", capital: "Moscou", code: "ru", alternates: ["Moscow"] },
      { country: "Saint-Marin", capital: "Saint-Marin", code: "sm", alternates: ["San Marino"] },
      { country: "Serbie", capital: "Belgrade", code: "rs" },
      { country: "Slovaquie", capital: "Bratislava", code: "sk" },
      { country: "Slovenie", capital: "Ljubljana", code: "si" },
      { country: "Suede", capital: "Stockholm", code: "se" },
      { country: "Suisse", capital: "Berne", code: "ch" },
      { country: "Svalbard et Jan Mayen", capital: "Longyearbyen", code: "sj" },
      { country: "Ukraine", capital: "Kiev", code: "ua", alternates: ["Kyiv"] },
    ],
  },
};

const ISLAND_CODES = [
  // Oceanie
  "as",
  "ck",
  "fm",
  "gu",
  "mh",
  "mp",
  "nc",
  "nf",
  "nu",
  "pf",
  "pn",
  "tk",
  "um",
  "wf",
  // Amerique du Nord / Caraibes
  "ai",
  "ag",
  "aw",
  "bb",
  "bm",
  "bl",
  "bq",
  "bs",
  "cu",
  "cw",
  "dm",
  "gd",
  "gl",
  "gp",
  "ht",
  "kn",
  "ky",
  "lc",
  "mf",
  "mq",
  "ms",
  "pm",
  "pr",
  "sx",
  "tc",
  "tt",
  "vc",
  "vg",
  "vi",
  // Amerique du Sud
  "fk",
  // Europe
  "ax",
  "fo",
  "gg",
  "im",
  "je",
  "sj",
];

function buildIslandCountries(data, islandCodes) {
  const codeSet = new Set(islandCodes.map((code) => String(code).toLowerCase()));
  const byCode = new Map();

  Object.entries(data).forEach(([modeKey, mode]) => {
    if (!mode || !Array.isArray(mode.countries) || modeKey === "islands") {
      return;
    }

    mode.countries.forEach((entry) => {
      const code = String(entry.code || "").toLowerCase();
      if (!codeSet.has(code)) {
        return;
      }

      if (!byCode.has(code)) {
        byCode.set(code, { ...entry });
      }
    });
  });

  return Array.from(byCode.values()).sort((a, b) =>
    String(a.country || "").localeCompare(String(b.country || ""), "fr", {
      sensitivity: "base",
    })
  );
}

QUIZ_DATA.islands = {
  name: "Iles",
  emoji: "🏝️",
  countries: buildIslandCountries(QUIZ_DATA, ISLAND_CODES),
};

if (typeof module === "object" && module.exports) {
  module.exports = QUIZ_DATA;
}

if (typeof globalThis !== "undefined") {
  globalThis.QUIZ_DATA = QUIZ_DATA;
}
