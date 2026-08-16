// The dataset behind the timeline. One idea: great civilisations did not run
// one after another, they overlapped. Each entry is a bar spanning the years it
// existed. Years are signed integers, negative for BCE, and year zero is never
// used (there is no year 0 between 1 BCE and 1 CE). Dates are rounded to the
// conventional textbook figures a general reader would recognise.

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

export interface CivEvent {
  year: number;
  text: string;
}

export interface Civilisation {
  id: string;
  name: string;
  region: Region;
  /** First year, signed (negative = BCE). Never 0. */
  start: number;
  /** Last year, signed (negative = BCE). Never 0. */
  end: number;
  blurb: string;
  events?: CivEvent[];
}

export const CIVILISATIONS: Civilisation[] = [
  {
    id: "sumer",
    name: "Sumer",
    region: "Mesopotamia",
    start: -3500,
    end: -1900,
    blurb:
      "The first cities rose between the Tigris and Euphrates, and with them the first writing, the wheel, and the earliest laws.",
    events: [
      { year: -3200, text: "Cuneiform, the first known writing" },
      { year: -2334, text: "Sargon forges the Akkadian Empire" },
    ],
  },
  {
    id: "babylon",
    name: "Babylonia",
    region: "Mesopotamia",
    start: -1894,
    end: -539,
    blurb:
      "Babylon inherited Sumer's cities and gave the world a written code of law and a lasting tradition of astronomy.",
    events: [
      { year: -1754, text: "Hammurabi's law code is carved in stone" },
      { year: -586, text: "Neo-Babylonian empire at its height" },
    ],
  },
  {
    id: "egypt",
    name: "Ancient Egypt",
    region: "Egypt & Africa",
    start: -3100,
    end: -30,
    blurb:
      "Unified along the Nile for three thousand years, Egypt built the pyramids and left one of history's deepest written records.",
    events: [
      { year: -2560, text: "The Great Pyramid of Giza is completed" },
      { year: -1332, text: "Tutankhamun takes the throne" },
      { year: -31, text: "Cleopatra falls, Rome takes Egypt" },
    ],
  },
  {
    id: "kush",
    name: "Kingdom of Kush",
    region: "Egypt & Africa",
    start: -1070,
    end: 350,
    blurb:
      "A Nubian power south of Egypt whose kings once ruled Egypt itself, rich on gold, iron, and the trade of the upper Nile.",
    events: [
      { year: -750, text: "Kushite pharaohs rule over Egypt" },
      { year: 350, text: "Aksum brings the kingdom to an end" },
    ],
  },
  {
    id: "aksum",
    name: "Kingdom of Aksum",
    region: "Egypt & Africa",
    start: 100,
    end: 940,
    blurb:
      "An Ethiopian trading empire on the Red Sea, minting its own coins and among the first states to adopt Christianity.",
    events: [
      { year: 330, text: "Aksum adopts Christianity" },
      { year: 520, text: "Trade with Rome and India peaks" },
    ],
  },
  {
    id: "indus",
    name: "Indus Valley",
    region: "South Asia",
    start: -3300,
    end: -1300,
    blurb:
      "A civilisation of planned brick cities with drains and standard weights, whose script we still cannot read.",
    events: [
      { year: -2600, text: "Harappa and Mohenjo-daro flourish" },
      { year: -1900, text: "The great cities are abandoned" },
    ],
  },
  {
    id: "maurya",
    name: "Maurya Empire",
    region: "South Asia",
    start: -322,
    end: -185,
    blurb:
      "The first empire to unite most of the Indian subcontinent, remembered for a king who renounced war for Buddhism.",
    events: [
      { year: -268, text: "Ashoka begins his reign" },
      { year: -250, text: "Buddhism spreads across Asia" },
    ],
  },
  {
    id: "gupta",
    name: "Gupta Empire",
    region: "South Asia",
    start: 320,
    end: 550,
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
    start: -1600,
    end: -256,
    blurb:
      "China's earliest dynasties, casting ritual bronzes and setting down the ideas Confucius would later shape.",
    events: [
      { year: -1200, text: "Oracle bone script records the future" },
      { year: -551, text: "Confucius is born" },
    ],
  },
  {
    id: "han",
    name: "Han Dynasty",
    region: "East Asia",
    start: -206,
    end: 220,
    blurb:
      "A four-century empire that opened the Silk Road, invented paper, and set the mould for imperial China.",
    events: [
      { year: -130, text: "The Silk Road opens to the west" },
      { year: 105, text: "Paper is invented" },
    ],
  },
  {
    id: "tang",
    name: "Tang Dynasty",
    region: "East Asia",
    start: 618,
    end: 907,
    blurb:
      "Medieval China at its most cosmopolitan, its capital the largest city on earth and its poetry never bettered.",
    events: [
      { year: 751, text: "Silk Road trade at its height" },
      { year: 868, text: "The first dated printed book" },
    ],
  },
  {
    id: "greece",
    name: "Ancient Greece",
    region: "Mediterranean & Europe",
    start: -800,
    end: -146,
    blurb:
      "City-states that gave the west democracy, philosophy, and drama before Alexander carried Greek ideas to India.",
    events: [
      { year: -508, text: "Athens invents democracy" },
      { year: -336, text: "Alexander begins his conquests" },
    ],
  },
  {
    id: "rome",
    name: "Roman Empire",
    region: "Mediterranean & Europe",
    start: -509,
    end: 476,
    blurb:
      "From republic to empire, Rome ringed the Mediterranean with roads, law, and cities that outlasted it by centuries.",
    events: [
      { year: -27, text: "Augustus becomes the first emperor" },
      { year: 80, text: "The Colosseum opens in Rome" },
      { year: 476, text: "The western empire falls" },
    ],
  },
  {
    id: "byzantine",
    name: "Byzantine Empire",
    region: "Mediterranean & Europe",
    start: 330,
    end: 1453,
    blurb:
      "The eastern half of Rome that lived on for a thousand more years, guarding Greek learning behind the walls of Constantinople.",
    events: [
      { year: 537, text: "Hagia Sophia is completed" },
      { year: 1453, text: "Constantinople falls to the Ottomans" },
    ],
  },
  {
    id: "achaemenid",
    name: "Achaemenid Persia",
    region: "Persia & Near East",
    start: -550,
    end: -330,
    blurb:
      "The first empire to span three continents, ruling a patchwork of peoples through roads, satraps, and tolerance.",
    events: [
      { year: -539, text: "Cyrus the Great takes Babylon" },
      { year: -330, text: "Alexander topples the empire" },
    ],
  },
  {
    id: "caliphates",
    name: "Islamic Caliphates",
    region: "Persia & Near East",
    start: 632,
    end: 1258,
    blurb:
      "A world empire born within a century of Islam, whose scholars preserved and advanced Greek, Persian, and Indian learning.",
    events: [
      { year: 762, text: "Baghdad is founded" },
      { year: 830, text: "The House of Wisdom gathers the world's books" },
      { year: 1258, text: "The Mongols sack Baghdad" },
    ],
  },
  {
    id: "ottoman",
    name: "Ottoman Empire",
    region: "Persia & Near East",
    start: 1299,
    end: 1922,
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
    start: -2000,
    end: 1524,
    blurb:
      "Mesoamerican cities of pyramids and glyphs, with a calendar and a concept of zero worked out independently of the old world.",
    events: [
      { year: 250, text: "Classic Maya cities flourish" },
      { year: 900, text: "The southern cities collapse" },
      { year: 1524, text: "Spanish conquest begins" },
    ],
  },
  {
    id: "aztec",
    name: "Aztec Empire",
    region: "Mesoamerica",
    start: 1345,
    end: 1521,
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
    start: -3500,
    end: -1800,
    blurb:
      "The oldest known civilisation in the Americas, raising monumental pyramids on the Peruvian coast without pottery or writing.",
    events: [{ year: -3000, text: "Pyramids rise at Caral" }],
  },
  {
    id: "inca",
    name: "Inca Empire",
    region: "Andes",
    start: 1438,
    end: 1533,
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
    start: 1707,
    end: 1997,
    blurb:
      "The empire on which the sun never set, spreading the industrial revolution, the English language, and its own undoing.",
    events: [
      { year: 1760, text: "The Industrial Revolution begins" },
      { year: 1837, text: "Victoria takes the throne" },
      { year: 1947, text: "India wins independence" },
      { year: 1997, text: "Hong Kong is handed back" },
    ],
  },
];
