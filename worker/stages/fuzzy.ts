// Porównywanie wpisanych odpowiedzi z tolerancją literówek.

/** Małe litery, bez polskich znaków, interpunkcji i spacji. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "i")
    .replace(/[^a-z0-9]/g, "");
}

/** Odległość Levenshteina (wstawienie / usunięcie / zamiana = 1). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Ile literówek wybaczamy przy danej długości odpowiedzi. */
function tolerance(len: number): number {
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  if (len <= 12) return 2;
  return 3;
}

/** Czy `guess` pasuje do którejkolwiek z akceptowanych odpowiedzi. */
export function matches(guess: string, accepted: readonly string[]): boolean {
  const g = normalize(guess);
  if (!g) return false;
  return accepted.some((a) => {
    const n = normalize(a);
    return levenshtein(g, n) <= tolerance(n.length);
  });
}
