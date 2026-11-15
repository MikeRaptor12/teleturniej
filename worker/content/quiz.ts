// Pytania do etapu 1 – Szybki strzał. Własne sformułowania, same fakty.
// `correct` to indeks poprawnej odpowiedzi w `options`.

export interface QuizQuestion {
  q: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { q: "Jaka jest stolica Australii?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], correct: 2 },
  { q: "Ile nóg ma pająk?", options: ["6", "8", "10", "12"], correct: 1 },
  { q: "Który pierwiastek ma symbol Fe?", options: ["Fluor", "Żelazo", "Fosfor", "Ferm"], correct: 1 },
  { q: "W którym roku Polska wstąpiła do Unii Europejskiej?", options: ["1999", "2001", "2004", "2007"], correct: 2 },
  { q: "Która rzeka jest najdłuższa w Polsce?", options: ["Odra", "Warta", "Wisła", "Bug"], correct: 2 },
  { q: "Kto jest autorem „Pana Tadeusza”?", options: ["Juliusz Słowacki", "Adam Mickiewicz", "Henryk Sienkiewicz", "Bolesław Prus"], correct: 1 },
  { q: "Ile wynosi pierwiastek kwadratowy ze 144?", options: ["11", "12", "13", "14"], correct: 1 },
  { q: "Która planeta Układu Słonecznego jest największa?", options: ["Saturn", "Jowisz", "Neptun", "Uran"], correct: 1 },
  { q: "Jaki kolor powstaje po zmieszaniu niebieskiej i żółtej farby?", options: ["Zielony", "Fioletowy", "Pomarańczowy", "Brązowy"], correct: 0 },
  { q: "Jak nazywa się najwyższy szczyt w Polsce?", options: ["Śnieżka", "Rysy", "Giewont", "Babia Góra"], correct: 1 },
  { q: "Ile minut ma doba?", options: ["1240", "1400", "1440", "1640"], correct: 2 },
  { q: "Jaki jest wzór chemiczny wody?", options: ["H₂O", "CO₂", "O₂", "H₂O₂"], correct: 0 },
  { q: "W którym kraju leży Machu Picchu?", options: ["Meksyk", "Peru", "Chile", "Boliwia"], correct: 1 },
  { q: "Kto namalował „Bitwę pod Grunwaldem”?", options: ["Jan Matejko", "Stanisław Wyspiański", "Józef Chełmoński", "Wojciech Kossak"], correct: 0 },
  { q: "Ile kości ma dorosły człowiek?", options: ["186", "206", "226", "246"], correct: 1 },
  { q: "Który ocean jest największy?", options: ["Atlantycki", "Indyjski", "Spokojny", "Arktyczny"], correct: 2 },
  { q: "Jak nazywa się waluta Japonii?", options: ["Juan", "Won", "Jen", "Baht"], correct: 2 },
  { q: "Ilu zawodników jednej drużyny gra jednocześnie na boisku w piłce nożnej?", options: ["9", "10", "11", "12"], correct: 2 },
  { q: "Którego gazu jest najwięcej w atmosferze Ziemi?", options: ["Tlenu", "Azotu", "Dwutlenku węgla", "Argonu"], correct: 1 },
  { q: "W którym mieście znajduje się Wawel?", options: ["Kraków", "Warszawa", "Gniezno", "Poznań"], correct: 0 },
  { q: "Kto odkrył penicylinę?", options: ["Ludwik Pasteur", "Alexander Fleming", "Robert Koch", "Maria Skłodowska-Curie"], correct: 1 },
  { q: "Które zwierzę lądowe jest najszybsze?", options: ["Gepard", "Lew", "Antylopa gnu", "Chart"], correct: 0 },
  { q: "Ile boków ma sześciokąt?", options: ["5", "6", "7", "8"], correct: 1 },
  { q: "Na jakim kontynencie leży Egipt?", options: ["Azja", "Europa", "Afryka", "Ameryka Płd."], correct: 2 },
];
