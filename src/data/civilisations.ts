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
];
