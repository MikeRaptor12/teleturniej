# Teleturniej – instrukcje dla Claude

Gra w stylu teleturnieju dla znajomych, tylko na komputer (desktop), online. Język UI i komentarzy: polski.

## Stack
- Cloudflare Workers + Durable Objects (`worker/`), 1 pokój = 1 instancja `GameRoom`, WebSocket Hibernation API, alarmy jako timery.
- Frontend: React + TypeScript + Vite (`src/`), `@cloudflare/vite-plugin`.
- Wspólne typy komunikatów: `shared/protocol.ts`.
- Deploy: push do `main` → Cloudflare Workers Builds (`npm run build`, `npx wrangler deploy`).

## Zasady
- Serwer jest jedynym źródłem prawdy: liczy punkty i czas; poprawne odpowiedzi nigdy nie trafiają do klienta przed odsłonięciem.
- Każdy etap to czysta logika w `worker/stages/<etap>.ts` (start / akcja gracza / advance / view) + komponent w `src/stages/`.
- Treści pytań w `worker/content/` – tylko fakty i własne sformułowania. Żadnych kadrów, plakatów, cytatów z filmów, muzyki ani innych materiałów chronionych prawem autorskim; grafiki tylko z wolnych licencji.

## Plan etapów
1. Szybki strzał – ABCD, bonus za szybkość ✅
2. Zgadnij film – stopniowo odsłaniane podpowiedzi (emoji, fakty, fabuła „na opak”), wpisywanie tytułu z tolerancją literówek, mniej punktów za późniejsze trafienie
3. Kłamczuch – gracze wpisują fałszywe odpowiedzi, potem głosują na prawdziwą
4. Gdzie to jest? (pinezka na mapie OSM/Leaflet) / Bliżej = lepiej (pytania liczbowe)
5. Wielki Finał – tablica 5 kategorii × 4 pola, pole wybiera ostatni w rankingu, każdy tajnie obstawia punkty (max = wartość pola), ostatnie pole „Va banque”

## Commity
Commituj i pushuj do `main` po każdym skończonym kawałku pracy. Przed pushem: `npm run build`.
