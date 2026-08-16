// The dataset behind the timeline. One idea: great civilisations did not run
// one after another, they overlapped. Each entry is a bar spanning the years it
// existed. Years are signed integers, negative for BCE, and year zero is never
// used (there is no year 0 between 1 BCE and 1 CE). Dates are rounded to the
// conventional textbook figures a general reader would recognise.
//
// Each civilisation also carries where its heartland sat (lat/lon, for the world
// map) and how it relates to others (relations, for the branching view). Dates
// and places are approximate on purpose: this is an explainer, not an atlas.

export const REGIONS = [
  "Mesopotamia",
  "Egypt & Africa",
  "South Asia",
  "East Asia",
  "Mediterranean & Europe",
  "Persia & Near East",
  "Mesoamerica",
  "Andes",
] as const;

export type Region = (typeof REGIONS)[number];

// Finer than a region: a group is a labelled column of the timeline (a family of
// civilisations that share a seat and a story), so the reader can see the set
// broken into smaller, named clusters. Same-region groups are kept contiguous in
// this order, so each region still reads as one colour band left to right. The
// region drives the colour; the name is the column header.
export interface Group {
  id: string;
  name: string;
  region: Region;
}

export const GROUPS: Group[] = [
  { id: "classical-med", name: "Classical Mediterranean", region: "Mediterranean & Europe" },
  { id: "medieval-europe", name: "Medieval Europe", region: "Mediterranean & Europe" },
  { id: "modern-europe", name: "Modern Europe", region: "Mediterranean & Europe" },
  { id: "mesopotamia", name: "Mesopotamia", region: "Mesopotamia" },
  { id: "levant", name: "Levant & Anatolia", region: "Persia & Near East" },
  { id: "persia", name: "Persia", region: "Persia & Near East" },
  { id: "islamic-world", name: "Islamic World", region: "Persia & Near East" },
  { id: "nile-egypt", name: "Nile & Egypt", region: "Egypt & Africa" },
  { id: "sub-saharan-africa", name: "Sub-Saharan Africa", region: "Egypt & Africa" },
  { id: "ancient-india", name: "Ancient India", region: "South Asia" },
  { id: "medieval-india", name: "Medieval India", region: "South Asia" },
  { id: "steppe", name: "Steppe & Central Asia", region: "East Asia" },
  { id: "china", name: "China", region: "East Asia" },
  { id: "japan-korea", name: "Japan & Korea", region: "East Asia" },
  { id: "southeast-asia", name: "Southeast Asia", region: "East Asia" },
  { id: "mesoamerica", name: "Mesoamerica", region: "Mesoamerica" },
  { id: "andes", name: "Andes", region: "Andes" },
];

export const groupById: Map<string, Group> = new Map(GROUPS.map((g) => [g.id, g]));

export interface CivEvent {
  year: number;
  text: string;
}

// The kinds of tie one civilisation can have to another. "successor" is a later
// power rising in the same seat, "influence" is ideas or trade passed on,
// "rival" is a power it fought or competed with.
export const RELATION_KINDS = ["successor", "influence", "rival"] as const;

export type RelationKind = (typeof RELATION_KINDS)[number];

export interface Relation {
  /** id of the related civilisation. */
  to: string;
  kind: RelationKind;
}

export interface Civilisation {
  id: string;
  name: string;
  region: Region;
  /** id of the {@link Group} column this civilisation packs into. */
  group: string;
  /** Architecture-icon id for the focus medallion; defaults to {@link group}. */
  icon?: string;
  /** First year, signed (negative = BCE). Never 0. */
  start: number;
  /** Last year, signed (negative = BCE). Never 0. */
  end: number;
  /** Heartland centroid latitude, signed degrees (north positive). */
  lat: number;
  /** Heartland centroid longitude, signed degrees (east positive). */
  lon: number;
  blurb: string;
  events?: CivEvent[];
  /** Directed ties from this civilisation to others, by id. */
  relations?: Relation[];
}

/** The architecture-icon id for a civilisation's medallion: its own if set,
 * otherwise its group's representative building. */
export function iconFor(civ: Pick<Civilisation, "icon" | "group">): string {
  return civ.icon ?? civ.group;
}

export const CIVILISATIONS: Civilisation[] = [
  {
    id: "sumer",
    name: "Sumer",
    region: "Mesopotamia",
    group: "mesopotamia",
    start: -3500,
    end: -1900,
    lat: 31,
    lon: 46.1,
    blurb:
      "The first cities rose between the Tigris and Euphrates, and with them the first writing, the wheel, and the earliest laws.",
    events: [
      { year: -3200, text: "Cuneiform, the first known writing" },
      { year: -2334, text: "Sargon forges the Akkadian Empire" },
    ],
    relations: [{ to: "babylon", kind: "successor" }],
  },
  {
    id: "babylon",
    name: "Babylonia",
    region: "Mesopotamia",
    group: "mesopotamia",
    start: -1894,
    end: -539,
    lat: 32.5,
    lon: 44.4,
    blurb:
      "Babylon inherited Sumer's cities and gave the world a written code of law and a lasting tradition of astronomy.",
    events: [
      { year: -1754, text: "Hammurabi's law code is carved in stone" },
      { year: -586, text: "Neo-Babylonian empire at its height" },
    ],
    relations: [
      { to: "achaemenid", kind: "successor" },
      { to: "greece", kind: "influence" },
    ],
  },
  {
    id: "egypt",
    name: "Ancient Egypt",
    region: "Egypt & Africa",
    group: "nile-egypt",
    start: -3100,
    end: -30,
    lat: 26,
    lon: 32,
    blurb:
      "Unified along the Nile for three thousand years, Egypt built the pyramids and left one of history's deepest written records.",
    events: [
      { year: -2560, text: "The Great Pyramid of Giza is completed" },
      { year: -1332, text: "Tutankhamun takes the throne" },
      { year: -31, text: "Cleopatra falls, Rome takes Egypt" },
    ],
    relations: [
      { to: "kush", kind: "influence" },
      { to: "rome", kind: "influence" },
    ],
  },
  {
    id: "kush",
    name: "Kingdom of Kush",
    region: "Egypt & Africa",
    group: "nile-egypt",
    start: -1070,
    end: 350,
    lat: 17,
    lon: 33.7,
    blurb:
      "A Nubian power south of Egypt whose kings once ruled Egypt itself, rich on gold, iron, and the trade of the upper Nile.",
    events: [
      { year: -750, text: "Kushite pharaohs rule over Egypt" },
      { year: 350, text: "Aksum brings the kingdom to an end" },
    ],
    relations: [{ to: "aksum", kind: "successor" }],
  },
  {
    id: "aksum",
    name: "Kingdom of Aksum",
    region: "Egypt & Africa",
    group: "sub-saharan-africa",
    start: 100,
    end: 940,
    lat: 14.1,
    lon: 38.7,
    blurb:
      "An Ethiopian trading empire on the Red Sea, minting its own coins and among the first states to adopt Christianity.",
    events: [
      { year: 330, text: "Aksum adopts Christianity" },
      { year: 520, text: "Trade with Rome and India peaks" },
    ],
    relations: [{ to: "caliphates", kind: "rival" }],
  },
  {
    id: "indus",
    name: "Indus Valley",
    region: "South Asia",
    group: "ancient-india",
    start: -3300,
    end: -1300,
    lat: 27.3,
    lon: 68.1,
    blurb:
      "A civilisation of planned brick cities with drains and standard weights, whose script we still cannot read.",
    events: [
      { year: -2600, text: "Harappa and Mohenjo-daro flourish" },
      { year: -1900, text: "The great cities are abandoned" },
    ],
    relations: [{ to: "maurya", kind: "influence" }],
  },
  {
    id: "maurya",
    name: "Maurya Empire",
    region: "South Asia",
    group: "ancient-india",
    start: -322,
    end: -185,
    lat: 25.6,
    lon: 85.1,
    blurb:
      "The first empire to unite most of the Indian subcontinent, remembered for a king who renounced war for Buddhism.",
    events: [
      { year: -268, text: "Ashoka begins his reign" },
      { year: -250, text: "Buddhism spreads across Asia" },
    ],
    relations: [{ to: "gupta", kind: "successor" }],
  },
  {
    id: "gupta",
    name: "Gupta Empire",
    region: "South Asia",
    group: "ancient-india",
    start: 320,
    end: 550,
    lat: 25.6,
    lon: 85.1,
    blurb:
      "A golden age of Indian science and art, when mathematicians formalised zero and the decimal system.",
    events: [
      { year: 499, text: "Aryabhata measures the heavens" },
      { year: 550, text: "The empire fragments" },
    ],
  },
  {
    id: "china-early",
    name: "Shang & Zhou China",
    region: "East Asia",
    group: "china",
    start: -1600,
    end: -256,
    lat: 35,
    lon: 113,
    blurb:
      "China's earliest dynasties, casting ritual bronzes and setting down the ideas Confucius would later shape.",
    events: [
      { year: -1200, text: "Oracle bone script records the future" },
      { year: -551, text: "Confucius is born" },
    ],
    relations: [{ to: "han", kind: "successor" }],
  },
  {
    id: "han",
    name: "Han Dynasty",
    region: "East Asia",
    group: "china",
    start: -206,
    end: 220,
    lat: 34.3,
    lon: 108.9,
    blurb:
      "A four-century empire that opened the Silk Road, invented paper, and set the mould for imperial China.",
    events: [
      { year: -130, text: "The Silk Road opens to the west" },
      { year: 105, text: "Paper is invented" },
    ],
    relations: [{ to: "tang", kind: "successor" }],
  },
  {
    id: "tang",
    name: "Tang Dynasty",
    region: "East Asia",
    group: "china",
    start: 618,
    end: 907,
    lat: 34.3,
    lon: 108.9,
    blurb:
      "Medieval China at its most cosmopolitan, its capital the largest city on earth and its poetry never bettered.",
    events: [
      { year: 751, text: "Silk Road trade at its height" },
      { year: 868, text: "The first dated printed book" },
    ],
    relations: [{ to: "caliphates", kind: "rival" }],
  },
  {
    id: "greece",
    name: "Ancient Greece",
    region: "Mediterranean & Europe",
    group: "classical-med",
    start: -800,
    end: -146,
    lat: 38,
    lon: 23.7,
    blurb:
      "City-states that gave the west democracy, philosophy, and drama before Alexander carried Greek ideas to India.",
    events: [
      { year: -508, text: "Athens invents democracy" },
      { year: -336, text: "Alexander begins his conquests" },
    ],
    relations: [
      { to: "rome", kind: "influence" },
      { to: "maurya", kind: "influence" },
    ],
  },
  {
    id: "rome",
    name: "Roman Empire",
    region: "Mediterranean & Europe",
    group: "classical-med",
    start: -509,
    end: 476,
    lat: 41.9,
    lon: 12.5,
    blurb:
      "From republic to empire, Rome ringed the Mediterranean with roads, law, and cities that outlasted it by centuries.",
    events: [
      { year: -27, text: "Augustus becomes the first emperor" },
      { year: 80, text: "The Colosseum opens in Rome" },
      { year: 476, text: "The western empire falls" },
    ],
    relations: [{ to: "byzantine", kind: "successor" }],
  },
  {
    id: "byzantine",
    name: "Byzantine Empire",
    region: "Mediterranean & Europe",
    group: "medieval-europe",
    start: 330,
    end: 1453,
    lat: 41,
    lon: 28.9,
    blurb:
      "The eastern half of Rome that lived on for a thousand more years, guarding Greek learning behind the walls of Constantinople.",
    events: [
      { year: 537, text: "Hagia Sophia is completed" },
      { year: 1453, text: "Constantinople falls to the Ottomans" },
    ],
    relations: [
      { to: "ottoman", kind: "successor" },
      { to: "caliphates", kind: "rival" },
    ],
  },
  {
    id: "achaemenid",
    name: "Achaemenid Persia",
    region: "Persia & Near East",
    group: "persia",
    start: -550,
    end: -330,
    lat: 30.2,
    lon: 53.2,
    blurb:
      "The first empire to span three continents, ruling a patchwork of peoples through roads, satraps, and tolerance.",
    events: [
      { year: -539, text: "Cyrus the Great takes Babylon" },
      { year: -330, text: "Alexander topples the empire" },
    ],
    relations: [{ to: "greece", kind: "rival" }],
  },
  {
    id: "caliphates",
    name: "Islamic Caliphates",
    region: "Persia & Near East",
    group: "islamic-world",
    start: 632,
    end: 1258,
    lat: 33.3,
    lon: 44.4,
    blurb:
      "A world empire born within a century of Islam, whose scholars preserved and advanced Greek, Persian, and Indian learning.",
    events: [
      { year: 762, text: "Baghdad is founded" },
      { year: 830, text: "The House of Wisdom gathers the world's books" },
      { year: 1258, text: "The Mongols sack Baghdad" },
    ],
    relations: [{ to: "ottoman", kind: "influence" }],
  },
  {
    id: "ottoman",
    name: "Ottoman Empire",
    region: "Persia & Near East",
    group: "islamic-world",
    start: 1299,
    end: 1922,
    lat: 41,
    lon: 28.9,
    blurb:
      "A six-century empire straddling Europe, Asia, and Africa, whose fall reshaped the modern Middle East.",
    events: [
      { year: 1453, text: "Mehmed II takes Constantinople" },
      { year: 1683, text: "The tide turns at the gates of Vienna" },
      { year: 1922, text: "The sultanate is abolished" },
    ],
  },
  {
    id: "maya",
    name: "Maya",
    region: "Mesoamerica",
    group: "mesoamerica",
    start: -2000,
    end: 1524,
    lat: 17.2,
    lon: -89.6,
    blurb:
      "Mesoamerican cities of pyramids and glyphs, with a calendar and a concept of zero worked out independently of the old world.",
    events: [
      { year: 250, text: "Classic Maya cities flourish" },
      { year: 900, text: "The southern cities collapse" },
      { year: 1524, text: "Spanish conquest begins" },
    ],
    relations: [{ to: "aztec", kind: "influence" }],
  },
  {
    id: "aztec",
    name: "Aztec Empire",
    region: "Mesoamerica",
    group: "mesoamerica",
    start: 1345,
    end: 1521,
    lat: 19.4,
    lon: -99.1,
    blurb:
      "A young, fierce empire ruled from Tenochtitlan, an island capital larger than most cities in Europe at the time.",
    events: [
      { year: 1428, text: "The Triple Alliance is formed" },
      { year: 1521, text: "Tenochtitlan falls to Cortes" },
    ],
  },
  {
    id: "caral",
    name: "Norte Chico (Caral)",
    region: "Andes",
    group: "andes",
    start: -3500,
    end: -1800,
    lat: -10.9,
    lon: -77.5,
    blurb:
      "The oldest known civilisation in the Americas, raising monumental pyramids on the Peruvian coast without pottery or writing.",
    events: [{ year: -3000, text: "Pyramids rise at Caral" }],
    relations: [{ to: "inca", kind: "influence" }],
  },
  {
    id: "inca",
    name: "Inca Empire",
    region: "Andes",
    group: "andes",
    start: 1438,
    end: 1533,
    lat: -13.5,
    lon: -72,
    blurb:
      "The largest empire the Americas ever saw, bound together by mountain roads and knotted-string records rather than writing.",
    events: [
      { year: 1450, text: "Machu Picchu is built" },
      { year: 1533, text: "Spanish conquest ends the empire" },
    ],
  },
  {
    id: "british",
    name: "British Empire",
    region: "Mediterranean & Europe",
    group: "modern-europe",
    start: 1707,
    end: 1997,
    lat: 52,
    lon: -1.5,
    blurb:
      "The empire on which the sun never set, spreading the industrial revolution, the English language, and its own undoing.",
    events: [
      { year: 1760, text: "The Industrial Revolution begins" },
      { year: 1837, text: "Victoria takes the throne" },
      { year: 1947, text: "India wins independence" },
      { year: 1997, text: "Hong Kong is handed back" },
    ],
    relations: [{ to: "ottoman", kind: "rival" }],
  },

  // --- the expansion: more parallel civilisations, filling out each group ---

  // Classical Mediterranean
  {
    id: "minoan",
    name: "Minoan Crete",
    region: "Mediterranean & Europe",
    group: "classical-med",
    start: -2700,
    end: -1450,
    lat: 35.3,
    lon: 25.1,
    blurb:
      "Europe's first civilisation, a seafaring Bronze Age culture of Crete whose painted palaces had running water.",
    events: [
      { year: -1900, text: "The palace of Knossos rises" },
      { year: -1450, text: "Collapse after eruption and invasion" },
    ],
    relations: [{ to: "mycenaean", kind: "influence" }],
  },
  {
    id: "mycenaean",
    name: "Mycenaean Greece",
    region: "Mediterranean & Europe",
    group: "classical-med",
    start: -1600,
    end: -1100,
    lat: 37.7,
    lon: 22.8,
    blurb:
      "The warrior kingdoms of Homer's Greece, keeping palace records in the earliest Greek script.",
    events: [
      { year: -1250, text: "The legendary war with Troy" },
      { year: -1100, text: "Swept away in the Bronze Age collapse" },
    ],
    relations: [{ to: "greece", kind: "successor" }],
  },

  // Medieval Europe
  {
    id: "franks",
    name: "Frankish Empire",
    region: "Mediterranean & Europe",
    group: "medieval-europe",
    start: 481,
    end: 843,
    lat: 50.8,
    lon: 6.1,
    blurb:
      "The realm that reunited western Europe after Rome and crowned Charlemagne emperor on Christmas Day.",
    events: [
      { year: 800, text: "Charlemagne is crowned emperor" },
      { year: 843, text: "The empire is split at Verdun" },
    ],
    relations: [
      { to: "rome", kind: "influence" },
      { to: "holy-roman", kind: "successor" },
    ],
  },
  {
    id: "holy-roman",
    name: "Holy Roman Empire",
    region: "Mediterranean & Europe",
    group: "medieval-europe",
    start: 962,
    end: 1806,
    lat: 50.1,
    lon: 8.7,
    blurb:
      "A patchwork of German states under an elected emperor that lasted eight centuries in the heart of Europe.",
    events: [
      { year: 962, text: "Otto I is crowned in Rome" },
      { year: 1806, text: "Dissolved under Napoleon" },
    ],
    relations: [{ to: "spanish", kind: "influence" }],
  },

  // Modern Europe
  {
    id: "spanish",
    name: "Spanish Empire",
    region: "Mediterranean & Europe",
    group: "modern-europe",
    start: 1492,
    end: 1898,
    lat: 40.4,
    lon: -3.7,
    blurb:
      "The first empire on which the sun never set, funded by American silver and spread by conquistadors.",
    events: [
      { year: 1492, text: "Columbus reaches the Americas" },
      { year: 1588, text: "The Armada sails against England" },
      { year: 1898, text: "The last colonies are lost" },
    ],
    relations: [
      { to: "aztec", kind: "rival" },
      { to: "inca", kind: "rival" },
    ],
  },
  {
    id: "russian-empire",
    name: "Russian Empire",
    region: "Mediterranean & Europe",
    group: "modern-europe",
    start: 1721,
    end: 1917,
    lat: 59.9,
    lon: 30.3,
    blurb:
      "A vast empire spanning eleven time zones, from the Baltic to the Pacific, until revolution swept it away.",
    events: [
      { year: 1812, text: "Napoleon's army is destroyed in the retreat" },
      { year: 1917, text: "Revolution ends the empire" },
    ],
    relations: [
      { to: "byzantine", kind: "influence" },
      { to: "ottoman", kind: "rival" },
    ],
  },

  // Mesopotamia
  {
    id: "akkad",
    name: "Akkadian Empire",
    region: "Mesopotamia",
    group: "mesopotamia",
    start: -2334,
    end: -2154,
    lat: 33.1,
    lon: 44.1,
    blurb:
      "The world's first empire, forged when Sargon united the city-states of Sumer under one crown.",
    events: [
      { year: -2334, text: "Sargon unites the cities of Sumer" },
      { year: -2200, text: "Reaches from the Gulf to the sea" },
    ],
    relations: [{ to: "babylon", kind: "successor" }],
  },
  {
    id: "assyria",
    name: "Assyria",
    region: "Mesopotamia",
    group: "mesopotamia",
    start: -1365,
    end: -609,
    lat: 36.4,
    lon: 43.2,
    blurb:
      "A militarised northern empire that ruled the Near East with siege engines, deportations, and great libraries.",
    events: [
      { year: -700, text: "Nineveh becomes the world's largest city" },
      { year: -612, text: "Nineveh falls to Babylon and the Medes" },
    ],
    relations: [{ to: "babylon", kind: "rival" }],
  },

  // Levant & Anatolia
  {
    id: "hittite",
    name: "Hittite Empire",
    region: "Persia & Near East",
    group: "levant",
    start: -1650,
    end: -1180,
    lat: 40,
    lon: 34.6,
    blurb:
      "An Anatolian power that rivalled Egypt for the Levant and was among the first to work iron.",
    events: [
      { year: -1274, text: "The Battle of Kadesh against Egypt" },
      { year: -1180, text: "Falls in the Bronze Age collapse" },
    ],
    relations: [
      { to: "egypt", kind: "rival" },
      { to: "phoenicia", kind: "influence" },
    ],
  },
  {
    id: "phoenicia",
    name: "Phoenicia",
    region: "Persia & Near East",
    group: "levant",
    start: -1200,
    end: -539,
    lat: 34.1,
    lon: 35.6,
    blurb:
      "Sea traders of the Levant who founded Carthage and spread the alphabet across the Mediterranean.",
    events: [
      { year: -814, text: "Carthage is founded" },
      { year: -539, text: "Persia absorbs the cities" },
    ],
    relations: [
      { to: "greece", kind: "influence" },
      { to: "achaemenid", kind: "successor" },
    ],
  },
  {
    id: "israel-judah",
    name: "Israel & Judah",
    region: "Persia & Near East",
    group: "levant",
    start: -1020,
    end: -586,
    lat: 31.8,
    lon: 35.2,
    blurb:
      "The kingdoms of the Hebrew Bible, whose monotheism would shape three of the world's religions.",
    events: [
      { year: -957, text: "Solomon's Temple is built in Jerusalem" },
      { year: -586, text: "Babylon destroys Jerusalem" },
    ],
    relations: [
      { to: "phoenicia", kind: "influence" },
      { to: "babylon", kind: "rival" },
    ],
  },

  // Persia
  {
    id: "parthia",
    name: "Parthian Empire",
    region: "Persia & Near East",
    group: "persia",
    start: -247,
    end: 224,
    lat: 36.2,
    lon: 57,
    blurb:
      "Horse-archers who held the Silk Road for four centuries and fought Rome to a standstill in the east.",
    events: [
      { year: -53, text: "Rome is crushed at Carrhae" },
      { year: 224, text: "The Sassanids take over" },
    ],
    relations: [
      { to: "sassanid", kind: "successor" },
      { to: "rome", kind: "rival" },
    ],
  },
  {
    id: "sassanid",
    name: "Sassanid Persia",
    region: "Persia & Near East",
    group: "persia",
    start: 224,
    end: 651,
    lat: 33.1,
    lon: 44.6,
    blurb:
      "The last Persian empire before Islam, Rome's great eastern rival and a centre of art and learning.",
    events: [
      { year: 260, text: "A Roman emperor is captured in battle" },
      { year: 651, text: "The Arab conquest ends the empire" },
    ],
    relations: [
      { to: "caliphates", kind: "successor" },
      { to: "byzantine", kind: "rival" },
    ],
  },

  // Islamic World
  {
    id: "seljuk",
    name: "Seljuk Empire",
    region: "Persia & Near East",
    group: "islamic-world",
    start: 1037,
    end: 1194,
    lat: 32.6,
    lon: 51.7,
    blurb:
      "Turkic sultans who ruled the medieval Islamic heartland and whose advance helped spark the Crusades.",
    events: [
      { year: 1071, text: "Victory at Manzikert opens Anatolia" },
      { year: 1194, text: "The empire fragments" },
    ],
    relations: [
      { to: "ottoman", kind: "influence" },
      { to: "byzantine", kind: "rival" },
    ],
  },
  {
    id: "safavid",
    name: "Safavid Persia",
    region: "Persia & Near East",
    group: "islamic-world",
    start: 1501,
    end: 1736,
    lat: 32.6,
    lon: 51.7,
    blurb:
      "The dynasty that made Iran Shia and raised Isfahan into one of the great capitals of the age.",
    events: [
      { year: 1501, text: "Ismail proclaims the Shia state" },
      { year: 1598, text: "Isfahan becomes the capital" },
    ],
    relations: [
      { to: "ottoman", kind: "rival" },
      { to: "mughal", kind: "influence" },
    ],
  },

  // Nile & Egypt
  {
    id: "ptolemaic",
    name: "Ptolemaic Egypt",
    region: "Egypt & Africa",
    group: "nile-egypt",
    start: -305,
    end: -30,
    lat: 31.2,
    lon: 29.9,
    blurb:
      "Greek pharaohs whose Alexandria, with its library and lighthouse, was the mind of the ancient world.",
    events: [
      { year: -283, text: "The Library of Alexandria flourishes" },
      { year: -30, text: "Cleopatra's death ends the line" },
    ],
    relations: [
      { to: "greece", kind: "influence" },
      { to: "rome", kind: "successor" },
    ],
  },

  // Sub-Saharan Africa
  {
    id: "ghana",
    name: "Ghana Empire",
    region: "Egypt & Africa",
    group: "sub-saharan-africa",
    start: 300,
    end: 1200,
    lat: 15.7,
    lon: -8,
    blurb:
      "A West African empire grown rich controlling the trade of gold and salt across the Sahara.",
    events: [
      { year: 800, text: "The trans-Saharan gold trade peaks" },
      { year: 1076, text: "Almoravid pressure begins its decline" },
    ],
    relations: [{ to: "mali", kind: "successor" }],
  },
  {
    id: "mali",
    name: "Mali Empire",
    region: "Egypt & Africa",
    group: "sub-saharan-africa",
    start: 1235,
    end: 1670,
    lat: 12.6,
    lon: -8,
    blurb:
      "The empire of Mansa Musa, whose gold pilgrimage and the scholars of Timbuktu became legend.",
    events: [
      { year: 1324, text: "Mansa Musa's pilgrimage to Mecca" },
      { year: 1450, text: "Timbuktu is a centre of learning" },
    ],
    relations: [{ to: "caliphates", kind: "influence" }],
  },

  // Ancient India
  {
    id: "chola",
    name: "Chola Empire",
    region: "South Asia",
    group: "ancient-india",
    start: 848,
    end: 1279,
    lat: 10.8,
    lon: 79.1,
    blurb:
      "A Tamil sea empire that projected power across the Bay of Bengal and raided Southeast Asia.",
    events: [
      { year: 1010, text: "The great temple at Thanjavur is built" },
      { year: 1025, text: "A naval raid strikes Srivijaya" },
    ],
    relations: [{ to: "srivijaya", kind: "rival" }],
  },

  // Medieval India
  {
    id: "delhi-sultanate",
    name: "Delhi Sultanate",
    region: "South Asia",
    group: "medieval-india",
    start: 1206,
    end: 1526,
    lat: 28.6,
    lon: 77.2,
    blurb:
      "The first great Muslim power in India, holding the north for three centuries until the Mughals.",
    events: [
      { year: 1206, text: "The sultanate is founded at Delhi" },
      { year: 1526, text: "Babur wins the field at Panipat" },
    ],
    relations: [{ to: "mughal", kind: "successor" }],
  },
  {
    id: "mughal",
    name: "Mughal Empire",
    region: "South Asia",
    group: "medieval-india",
    start: 1526,
    end: 1857,
    lat: 27.2,
    lon: 78,
    blurb:
      "The empire of the Taj Mahal, uniting the subcontinent in wealth and Indo-Islamic art.",
    events: [
      { year: 1556, text: "Akbar begins his long reign" },
      { year: 1631, text: "The Taj Mahal is begun" },
      { year: 1857, text: "The British depose the last emperor" },
    ],
    relations: [
      { to: "maratha", kind: "rival" },
      { to: "british", kind: "rival" },
    ],
  },
  {
    id: "maratha",
    name: "Maratha Confederacy",
    region: "South Asia",
    group: "medieval-india",
    start: 1674,
    end: 1818,
    lat: 18.5,
    lon: 73.9,
    blurb:
      "A Hindu power that broke Mughal dominance across India before falling to the British.",
    events: [
      { year: 1674, text: "Shivaji is crowned" },
      { year: 1818, text: "The British defeat the confederacy" },
    ],
    relations: [{ to: "british", kind: "rival" }],
  },

  // Steppe & Central Asia
  {
    id: "xiongnu",
    name: "Xiongnu",
    region: "East Asia",
    group: "steppe",
    start: -209,
    end: 155,
    lat: 47.9,
    lon: 106.9,
    blurb:
      "A nomad confederation on China's northern frontier that the Great Wall was raised against.",
    events: [
      { year: -200, text: "Han China buys peace with tribute" },
      { year: 89, text: "Shattered by Han armies" },
    ],
    relations: [
      { to: "han", kind: "rival" },
      { to: "mongol", kind: "influence" },
    ],
  },
  {
    id: "mongol",
    name: "Mongol Empire",
    region: "East Asia",
    group: "steppe",
    start: 1206,
    end: 1368,
    lat: 47.9,
    lon: 106.9,
    blurb:
      "The largest contiguous land empire ever, stretching from Korea to Hungary within a single lifetime.",
    events: [
      { year: 1206, text: "Genghis Khan unites the tribes" },
      { year: 1258, text: "Baghdad falls to the horde" },
      { year: 1279, text: "All of China is conquered" },
    ],
    relations: [
      { to: "song", kind: "rival" },
      { to: "caliphates", kind: "rival" },
      { to: "timurid", kind: "influence" },
    ],
  },
  {
    id: "timurid",
    name: "Timurid Empire",
    region: "East Asia",
    group: "steppe",
    start: 1370,
    end: 1507,
    lat: 39.7,
    lon: 66.9,
    blurb:
      "Tamerlane's empire and the Samarkand renaissance of science and art that seeded the Mughal line.",
    events: [
      { year: 1398, text: "Timur sacks Delhi" },
      { year: 1420, text: "Ulugh Beg's observatory at Samarkand" },
    ],
    relations: [
      { to: "mughal", kind: "influence" },
      { to: "ottoman", kind: "rival" },
    ],
  },

  // China
  {
    id: "qin",
    name: "Qin Dynasty",
    region: "East Asia",
    group: "china",
    start: -221,
    end: -206,
    lat: 34.4,
    lon: 109,
    blurb:
      "The short, ruthless dynasty that first unified China and began the Great Wall and a single script.",
    events: [
      { year: -221, text: "China is unified under the First Emperor" },
      { year: -210, text: "The terracotta army is buried" },
    ],
    relations: [{ to: "han", kind: "successor" }],
  },
  {
    id: "song",
    name: "Song Dynasty",
    region: "East Asia",
    group: "china",
    start: 960,
    end: 1279,
    lat: 30.2,
    lon: 120.2,
    blurb:
      "An age of gunpowder, printing, and paper money, and arguably the world's first industrial economy.",
    events: [
      { year: 1040, text: "Movable-type printing is invented" },
      { year: 1088, text: "Gunpowder weapons come into use" },
    ],
    relations: [{ to: "ming", kind: "successor" }],
  },
  {
    id: "ming",
    name: "Ming Dynasty",
    region: "East Asia",
    group: "china",
    start: 1368,
    end: 1644,
    lat: 39.9,
    lon: 116.4,
    blurb:
      "The dynasty of the Forbidden City and the treasure fleets that reached the coast of Africa.",
    events: [
      { year: 1405, text: "Zheng He's fleets set sail" },
      { year: 1420, text: "The Forbidden City is finished" },
    ],
    relations: [{ to: "qing", kind: "successor" }],
  },
  {
    id: "qing",
    name: "Qing Dynasty",
    region: "East Asia",
    group: "china",
    start: 1636,
    end: 1912,
    lat: 39.9,
    lon: 116.4,
    blurb:
      "China's last imperial dynasty, Manchu rulers who doubled its size before the empire collapsed.",
    events: [
      { year: 1683, text: "Taiwan is annexed" },
      { year: 1839, text: "The Opium Wars begin" },
      { year: 1912, text: "The last emperor abdicates" },
    ],
    relations: [
      { to: "british", kind: "rival" },
      { to: "russian-empire", kind: "rival" },
    ],
  },

  // Japan & Korea
  {
    id: "heian",
    name: "Heian Japan",
    region: "East Asia",
    group: "japan-korea",
    start: 794,
    end: 1185,
    lat: 35,
    lon: 135.8,
    blurb:
      "Japan's classical age of courtly refinement, when the world's first novel was written.",
    events: [
      { year: 794, text: "The capital moves to Kyoto" },
      { year: 1008, text: "The Tale of Genji is written" },
    ],
    relations: [
      { to: "tang", kind: "influence" },
      { to: "tokugawa", kind: "successor" },
    ],
  },
  {
    id: "tokugawa",
    name: "Tokugawa Japan",
    region: "East Asia",
    group: "japan-korea",
    start: 1603,
    end: 1868,
    lat: 35.7,
    lon: 139.7,
    blurb:
      "Two centuries of peace under the shogun, sealed off from the world until the West forced it open.",
    events: [
      { year: 1603, text: "The shogunate is founded at Edo" },
      { year: 1853, text: "American ships force the ports open" },
      { year: 1868, text: "The Meiji Restoration" },
    ],
    relations: [{ to: "joseon", kind: "rival" }],
  },
  {
    id: "joseon",
    name: "Joseon Korea",
    region: "East Asia",
    group: "japan-korea",
    start: 1392,
    end: 1897,
    lat: 37.6,
    lon: 127,
    blurb:
      "A long Korean dynasty that gave the peninsula its own alphabet and a Confucian golden age.",
    events: [
      { year: 1443, text: "Hangul, the Korean alphabet, is created" },
      { year: 1592, text: "The Imjin War with Japan" },
    ],
    relations: [{ to: "ming", kind: "influence" }],
  },

  // Southeast Asia
  {
    id: "khmer",
    name: "Khmer Empire",
    region: "East Asia",
    group: "southeast-asia",
    start: 802,
    end: 1431,
    lat: 13.4,
    lon: 103.9,
    blurb:
      "The empire of Angkor Wat, the largest religious monument on earth, at the heart of mainland Southeast Asia.",
    events: [
      { year: 1113, text: "Angkor Wat is begun" },
      { year: 1431, text: "The Thai sack Angkor" },
    ],
    relations: [{ to: "srivijaya", kind: "rival" }],
  },
  {
    id: "srivijaya",
    name: "Srivijaya",
    region: "East Asia",
    group: "southeast-asia",
    start: 671,
    end: 1288,
    lat: -3,
    lon: 104.8,
    blurb:
      "A Buddhist sea power that controlled the straits and the trade between India and China.",
    events: [
      { year: 700, text: "A great centre of Buddhist learning" },
      { year: 1025, text: "The Chola navy raids its ports" },
    ],
    relations: [
      { to: "chola", kind: "rival" },
      { to: "majapahit", kind: "successor" },
    ],
  },
  {
    id: "majapahit",
    name: "Majapahit",
    region: "East Asia",
    group: "southeast-asia",
    start: 1293,
    end: 1527,
    lat: -7.5,
    lon: 112.4,
    blurb:
      "The last great Hindu-Buddhist empire of the islands, remembered as Indonesia's golden age.",
    events: [
      { year: 1350, text: "Its power reaches across the archipelago" },
      { year: 1527, text: "Islamic states supplant it" },
    ],
    relations: [{ to: "khmer", kind: "rival" }],
  },

  // Mesoamerica
  {
    id: "olmec",
    name: "Olmec",
    region: "Mesoamerica",
    group: "mesoamerica",
    start: -1500,
    end: -400,
    lat: 17.9,
    lon: -94.6,
    blurb:
      "The mother culture of Mesoamerica, carvers of the colossal stone heads on the Gulf coast.",
    events: [
      { year: -1200, text: "San Lorenzo, the first great centre" },
      { year: -900, text: "The colossal heads are carved" },
    ],
    relations: [{ to: "maya", kind: "influence" }],
  },
  {
    id: "teotihuacan",
    name: "Teotihuacan",
    region: "Mesoamerica",
    group: "mesoamerica",
    start: -100,
    end: 750,
    lat: 19.7,
    lon: -98.9,
    blurb:
      "A vast planned city of pyramids whose builders and language remain unknown to this day.",
    events: [
      { year: 100, text: "The Pyramid of the Sun rises" },
      { year: 550, text: "The city is burned and abandoned" },
    ],
    relations: [
      { to: "maya", kind: "influence" },
      { to: "aztec", kind: "influence" },
    ],
  },

  // Andes
  {
    id: "chavin",
    name: "Chavin",
    region: "Andes",
    group: "andes",
    start: -900,
    end: -200,
    lat: -9.6,
    lon: -77.2,
    blurb:
      "An Andean religious culture whose art and cult spread across the highlands and coast of early Peru.",
    events: [{ year: -500, text: "Chavin de Huantar at its height" }],
    relations: [{ to: "inca", kind: "influence" }],
  },
];
