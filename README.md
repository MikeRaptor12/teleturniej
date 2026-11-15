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

Otwórz adres z terminala w dwóch kartach, żeby zasymulować dwóch graczy.

## Wdrożenie

Automatycznie: w panelu Cloudflare **Workers & Pages → Create → Import a repository** wskaż to repo. Każdy push do `main` się wdroży.

Ręcznie: `npm run deploy`.

## Status

- [x] Lobby: tworzenie pokoju, dołączanie po kodzie lub linku, host, powrót po rozłączeniu
- [ ] Etap 1 – Szybki strzał
- [ ] Etap 2 – Zgadnij film
- [ ] Etap 3 – Kłamczuch
- [ ] Etap 4 – Gdzie to jest? / Bliżej = lepiej
- [ ] Etap 5 – Wielki Finał
