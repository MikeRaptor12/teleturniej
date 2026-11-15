// Filmy do etapu 2 – Zgadnij film. Tylko własne sformułowania i fakty:
// żadnych cytatów, kadrów ani plakatów.
//
// `title`  – polski tytuł, pokazywany przy odsłonięciu (i jako maska w ostatniej podpowiedzi)
// `accept` – wszystkie tytuły uznawane za poprawne (polski, oryginalny, skróty)
// `hints`  – 4 podpowiedzi od najtrudniejszej: emoji, fabuła „na opak”, fakt, fakt.
//            Piątą (maskę tytułu) generuje serwer.

export interface Film {
  title: string;
  accept: string[];
  hints: [string, string, string, string];
}

export const FILMS: Film[] = [
  {
    title: "Titanic",
    accept: ["Titanic", "Tytanik"],
    hints: [
      "🚢 🧊 💔",
      "Na opak: statek bez przeszkód dopływa do Nowego Jorku, a biedny malarz i bogata panna nie zamieniają ze sobą ani słowa.",
      "Rok 1997. Dramat i romans, który zdobył 11 Oscarów.",
      "Reżyseria: James Cameron. W rolach głównych Leonardo DiCaprio i Kate Winslet.",
    ],
  },
  {
    title: "Park Jurajski",
    accept: ["Park Jurajski", "Jurassic Park"],
    hints: [
      "🦖 🏝️ 🧬",
      "Na opak: na tropikalnej wyspie otwiera się spokojny ogród botaniczny, a goście nudzą się, bo nic ich nie goni.",
      "Rok 1993. Film przygodowy na podstawie powieści Michaela Crichtona.",
      "Reżyseria: Steven Spielberg. Naukowcy odtwarzają wymarłe gady z DNA.",
    ],
  },
  {
    title: "Shrek",
    accept: ["Shrek"],
    hints: [
      "🧅 🐉 🫏",
      "Na opak: przystojny książę mieszka w zamku i marzy, żeby do jego ogrodu wprowadziło się jak najwięcej bajkowych postaci.",
      "Rok 2001. Animacja studia DreamWorks – pierwszy zdobywca Oscara za najlepszy pełnometrażowy film animowany.",
      "Główny bohater to zielony olbrzym, któremu towarzyszy gadatliwy osioł.",
    ],
  },
  {
    title: "Król Lew",
    accept: ["Król Lew", "The Lion King", "Lion King"],
    hints: [
      "🦁 👑 🌅",
      "Na opak: wujek bardzo kocha bratanka i z radością ustępuje mu miejsca na tronie.",
      "Rok 1994. Animacja Disneya inspirowana m.in. „Hamletem”.",
      "Piosenki do filmu napisali Elton John i Tim Rice. Akcja toczy się na afrykańskiej sawannie.",
    ],
  },
  {
    title: "Matrix",
    accept: ["Matrix", "The Matrix"],
    hints: [
      "💊 🕶️ 🐇",
      "Na opak: haker wybiera niebieską pigułkę i spokojnie wraca do pracy w biurze.",
      "Rok 1999. Film science fiction, który spopularyzował efekt „bullet time”.",
      "Reżyseria: Lana i Lilly Wachowskie. W roli głównej Keanu Reeves.",
    ],
  },
  {
    title: "Gwiezdne wojny: Nowa nadzieja",
    accept: ["Gwiezdne wojny", "Nowa nadzieja", "Star Wars", "A New Hope", "Gwiezdne wojny Nowa nadzieja"],
    hints: [
      "🌌 ⚔️ 🤖",
      "Na opak: chłopak z pustynnej farmy nigdy jej nie opuszcza, a ogromna stacja bojowa działa bez jednej usterki.",
      "Rok 1977. Pierwszy nakręcony film słynnej kosmicznej sagi.",
      "Reżyseria: George Lucas. Występują m.in. Mark Hamill, Harrison Ford i Carrie Fisher.",
    ],
  },
  {
    title: "Kevin sam w domu",
    accept: ["Kevin sam w domu", "Home Alone", "Sam w domu"],
    hints: [
      "🏠 🎄 🪤",
      "Na opak: rodzina zabiera chłopca na świąteczny wyjazd, a włamywacze bez przeszkód plądrują pusty dom.",
      "Rok 1990. Familijna komedia, którą w Polsce emituje się w telewizji niemal co święta.",
      "W roli głównej Macaulay Culkin. Scenariusz napisał John Hughes.",
    ],
  },
  {
    title: "Gdzie jest Nemo?",
    accept: ["Gdzie jest Nemo", "Finding Nemo", "Nemo"],
    hints: [
      "🐠 🌊 🔍",
      "Na opak: ojciec cieszy się, że syn odpłynął, i do końca filmu nie wychyla się z ukwiału.",
      "Rok 2003. Animacja studia Pixar.",
      "Reżyseria: Andrew Stanton. Akcja dzieje się m.in. na Wielkiej Rafie Koralowej i w Sydney.",
    ],
  },
  {
    title: "Forrest Gump",
    accept: ["Forrest Gump"],
    hints: [
      "🏃 🍫 🪶",
      "Na opak: mężczyzna przez całe życie siedzi w jednym miejscu i nie styka się z żadnym ważnym wydarzeniem w historii swojego kraju.",
      "Rok 1994. Komediodramat nagrodzony sześcioma Oscarami, w tym za najlepszy film.",
      "Reżyseria: Robert Zemeckis. W roli głównej Tom Hanks.",
    ],
  },
  {
    title: "Harry Potter i Kamień Filozoficzny",
    accept: [
      "Harry Potter i Kamień Filozoficzny",
      "Harry Potter",
      "Kamień Filozoficzny",
      "Harry Potter and the Philosopher's Stone",
      "Harry Potter and the Sorcerer's Stone",
    ],
    hints: [
      "⚡ 🧙 🦉",
      "Na opak: chłopiec dowiaduje się, że jest całkowicie zwyczajny, i zostaje na stałe w komórce pod schodami.",
      "Rok 2001. Pierwsza ekranizacja serii powieści J.K. Rowling.",
      "Reżyseria: Chris Columbus. W roli głównej Daniel Radcliffe.",
    ],
  },
  {
    title: "Szczęki",
    accept: ["Szczęki", "Jaws"],
    hints: [
      "🦈 🏖️ 🚤",
      "Na opak: burmistrz zamyka plażę przy pierwszym sygnale niebezpieczeństwa i wakacje mijają w ciszy i spokoju.",
      "Rok 1975. Thriller uważany za pierwszy wakacyjny blockbuster w historii kina.",
      "Reżyseria: Steven Spielberg. Na podstawie powieści Petera Benchleya.",
    ],
  },
  {
    title: "Powrót do przyszłości",
    accept: ["Powrót do przyszłości", "Back to the Future"],
    hints: [
      "🚗 ⚡ ⏰",
      "Na opak: nastolatek nigdy nie opuszcza swojej epoki, a jego rodzice poznają się bez niczyjej pomocy.",
      "Rok 1985. Komedia science fiction o podróżach w czasie.",
      "Reżyseria: Robert Zemeckis. Wehikuł czasu zbudowano z samochodu DeLorean.",
    ],
  },
  {
    title: "Kraina lodu",
    accept: ["Kraina lodu", "Frozen"],
    hints: [
      "❄️ 👭 ⛄",
      "Na opak: młoda królowa sprowadza na królestwo upał, a dwie siostry od początku do końca szczerze się nie znoszą.",
      "Rok 2013. Animacja Disneya luźno inspirowana baśnią Andersena o Królowej Śniegu.",
      "Bohaterkami są siostry Anna i Elsa, a towarzyszy im gadający bałwan.",
    ],
  },
  {
    title: "Avatar",
    accept: ["Avatar"],
    hints: [
      "🪐 💙 🌳",
      "Na opak: ludzie przylatują na obcy księżyc wyłącznie po to, żeby sadzić drzewa i nikomu nie przeszkadzać.",
      "Rok 2009. Przez lata najbardziej dochodowy film w historii kina.",
      "Reżyseria: James Cameron. Akcja toczy się na Pandorze, zamieszkanej przez niebieskoskórych Na'vi.",
    ],
  },
  {
    title: "Incepcja",
    accept: ["Incepcja", "Inception"],
    hints: [
      "🌀 💤 🏙️",
      "Na opak: złodziej okrada wyłącznie zwykłe sejfy w prawdziwym świecie i nigdy nie zasypia.",
      "Rok 2010. Thriller science fiction o wchodzeniu do cudzych snów.",
      "Reżyseria: Christopher Nolan. W roli głównej Leonardo DiCaprio.",
    ],
  },
  {
    title: "Rocky",
    accept: ["Rocky"],
    hints: [
      "🥊 🥚 🏃",
      "Na opak: mistrz świata wagi ciężkiej odmawia walki z nieznanym zawodnikiem i nikt nie biega po schodach muzeum.",
      "Rok 1976. Dramat sportowy, który zdobył Oscara za najlepszy film.",
      "Scenariusz napisał i zagrał główną rolę Sylvester Stallone. Akcja w Filadelfii.",
    ],
  },
  {
    title: "Toy Story",
    accept: ["Toy Story"],
    hints: [
      "🤠 🚀 🧸",
      "Na opak: kowboj i kosmonauta od pierwszej minuty są najlepszymi przyjaciółmi i nigdy nie wychodzą z pokoju.",
      "Rok 1995. Pierwszy pełnometrażowy film w całości animowany komputerowo.",
      "Studio Pixar, reżyseria John Lasseter. Bohaterami są ożywające zabawki.",
    ],
  },
  {
    title: "Ojciec chrzestny",
    accept: ["Ojciec chrzestny", "The Godfather", "Godfather"],
    hints: [
      "🍊 🐴 🤵",
      "Na opak: rodzina prowadzi uczciwy sklep spożywczy, a najmłodszy syn wcale nie zostaje wciągnięty w rodzinne interesy.",
      "Rok 1972. Dramat gangsterski na podstawie powieści Mario Puzo.",
      "Reżyseria: Francis Ford Coppola. Występują Marlon Brando i Al Pacino.",
    ],
  },
  {
    title: "E.T.",
    accept: ["E.T.", "ET", "E.T. the Extra-Terrestrial"],
    hints: [
      "👽 🚲 🌕",
      "Na opak: przybysz z kosmosu z radością zostaje na Ziemi, a chłopiec od razu oddaje go naukowcom.",
      "Rok 1982. Familijny film science fiction.",
      "Reżyseria: Steven Spielberg. Ikoniczna scena: rower na tle księżyca.",
    ],
  },
  {
    title: "Pulp Fiction",
    accept: ["Pulp Fiction"],
    hints: [
      "💼 💃 🍔",
      "Na opak: wszystkie wątki opowiedziane są po kolei, a w tajemniczej walizce leży zwykła kanapka.",
      "Rok 1994. Film nagrodzony Złotą Palmą w Cannes.",
      "Reżyseria: Quentin Tarantino. Występują m.in. John Travolta, Uma Thurman i Samuel L. Jackson.",
    ],
  },
  {
    title: "Władca Pierścieni: Drużyna Pierścienia",
    accept: [
      "Władca Pierścieni",
      "Drużyna Pierścienia",
      "Władca Pierścieni Drużyna Pierścienia",
      "The Lord of the Rings",
      "Lord of the Rings",
      "The Fellowship of the Ring",
    ],
    hints: [
      "💍 🌋 🧝",
      "Na opak: hobbit zatrzymuje znaleziony skarb na pamiątkę i nigdy nie wychodzi poza swoją wioskę.",
      "Rok 2001. Pierwsza część trylogii fantasy kręconej w Nowej Zelandii.",
      "Reżyseria: Peter Jackson. Na podstawie powieści J.R.R. Tolkiena.",
    ],
  },
];
