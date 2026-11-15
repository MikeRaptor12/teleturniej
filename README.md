# 🎤 Teleturniej

Gra w stylu teleturnieju dla znajomych, na komputerze w przeglądarce. Działa na Cloudflare (Workers + Durable Objects).

## Przebieg gry

| # | Etap | Opis |
|---|------|------|
| 1 | Szybki strzał | Pytania ABCD, bonus za szybkość |
| 2 | Zgadnij film | Stopniowo odsłaniane podpowiedzi: emoji, fakty, fabuła „na opak” |
| 3 | Kłamczuch | Wymyśl fałszywą odpowiedź i znajdź prawdziwą |
| 4 | Gdzie to jest? / Bliżej = lepiej | Pinezka na mapie i pytania liczbowe |
| 5 | Wielki Finał | Tablica kategorii, tajne zakłady punktów, na koniec Va banque |

Zawartość gry to wyłącznie fakty, własne teksty i materiały na otwartych licencjach (bez kadrów i plakatów filmowych).

## Architektura

```
Przeglądarka (React + Vite)
     │ WebSocket
     ▼
Worker (worker/index.ts) ──► GameRoom Durable Object (worker/room.ts)
                               1 pokój = 1 instancja, stan + WebSockety
```

- `shared/protocol.ts` – typy komunikatów klient ↔ serwer
- `worker/` – serwer (Cloudflare Worker + Durable Object)
- `src/` – frontend

## Uruchomienie lokalnie

```bash
npm install
npm run dev
```

Lokalne hasło do strony ustaw w pliku `.dev.vars` (nie trafia do repo):

```
ACCESS_PASSWORD="jakies-haslo"
```

Żeby zasymulować dwóch graczy, otwórz grę w zwykłym oknie i w oknie incognito.

## Zabezpieczenia

- **Hasło do strony** – sekret `ACCESS_PASSWORD` w Cloudflare. Bez niego strona jest zamknięta. Po 5 błędnych próbach z jednego IP blokada na 15 minut.
- **Tylko założone pokoje** – zgadnięty kod nic nie daje, pokoje powstają wyłącznie przyciskiem „Załóż nowy pokój”.
- **Poczekalnia** – każdy poza zakładającym czeka, aż host go wpuści. Odrzuceni i wyrzuceni nie mogą wrócić.

## Wdrożenie

Automatycznie: w panelu Cloudflare **Workers & Pages → Create → Import a repository** wskaż to repo. Każdy push do `main` się wdroży.

Ręcznie: `npm run deploy`.

Hasło: w panelu Cloudflare worker → **Settings → Variables and Secrets → Add** → typ **Secret**, nazwa `ACCESS_PASSWORD`. Albo `npx wrangler secret put ACCESS_PASSWORD`.

## Status

- [x] Lobby: tworzenie pokoju, dołączanie po kodzie lub linku, host, powrót po rozłączeniu
- [x] Przejścia między etapami, ekran końcowy, „zagraj jeszcze raz”
- [x] Etap 1 – Szybki strzał (pytania w `worker/content/quiz.ts`)
- [ ] Etap 2 – Zgadnij film
- [ ] Etap 3 – Kłamczuch
- [ ] Etap 4 – Gdzie to jest? / Bliżej = lepiej
- [ ] Etap 5 – Wielki Finał
