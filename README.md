# what-ya-get

A small Express API that answers one question: *what do you actually get if you hire me?*

Instead of a CV, it returns a list of playful, countable facts — cups of Earl Grey, daily stand-ups
attended, Friday panic deploys, merge conflicts resolved — each one projected forward from **today**
until the retirement date. The numbers grow smaller every day the offer isn't taken.

Each item also carries a link to a piece of "art" (a YouTube track that fits the item) and a weight
that a frontend can use to decide how prominently to show it.

## How it works

1. On startup, the server reads [wyg.yaml](wyg.yaml) — the data source for all items.
2. It calculates the time left until the retirement date (`2042-12-12`) in fractional years, using
   an average year of 365.2425 days.
3. For each entry it multiplies that number of years by the entry's `constant` (a per-year rate) and
   rounds it, producing the projected total.
4. The result is served as JSON from [server.js:76](server.js#L76).

Because the projection is computed at startup, a long-running instance keeps serving the numbers from
the moment it booted. Restart the server (or container) to refresh them.

## API

Base URL: `http://localhost:3000`

| Method | Path             | Description                          |
| ------ | ---------------- | ------------------------------------ |
| `GET`  | `/`              | Health/hello message                 |
| `GET`  | `/api/items`     | All projected items                  |
| `GET`  | `/api/items/:id` | A single item by its numeric id      |

### Example

```bash
curl http://localhost:3000/api/items
```

```json
[
  {
    "Id": 1,
    "Name": "Number of days with me over time until my retirement",
    "Nth": 6015,
    "Unit": "Days with me!",
    "Art": "https://www.youtube.com/watch?v=Y0pdQU87dc8",
    "Weight": 1
  }
]
```

> **Note:** `/api/items/:id` currently looks up a lowercase `id` property while the items are built
> with a capitalised `Id`, so it always responds `404`. Use `/api/items` and filter client-side, or
> change the lookup in [server.js:81](server.js#L81) to `i.Id`.

## The data format

Items live in [wyg.yaml](wyg.yaml) as a plain YAML list. Adding a new one means appending a block —
no code changes needed:

```yaml
- name: "Number of cups of black coffee I will drink"
  id: 17
  constant: 69
  unit: "Black coffee Cups"
  round: floor
  art: "https://www.youtube.com/watch?v=zTbJBnkRkFo"
  weight: 1
```

| Field      | Meaning                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------- |
| `name`     | The human-readable claim, rendered as the item's title.                                       |
| `id`       | Unique numeric identifier.                                                                    |
| `constant` | Rate **per year** — multiplied by the years remaining until retirement. Ignored when `round: fixed`. |
| `unit`     | Label for the resulting number (e.g. `"Black coffee Cups"`).                                   |
| `round`    | `ceil`, `floor`, or `fixed`. `fixed` skips the projection and returns `constant` verbatim.      |
| `art`      | A link to the accompanying track.                                                              |
| `weight`   | Relative importance, for a frontend to sort or size by.                                        |

## Running it

Requires Node.js (see [.tool-versions](.tool-versions) — `24.15.0`; the Docker image pins `node:20-alpine`).

```bash
npm install
cp .env.example .env     # PORT=3000
npm run dev              # nodemon, reloads on change
# or
npm start                # plain node
```

### Docker

```bash
docker compose up --build
```

The compose file reads `PORT` from your `.env` and publishes `3000:3000`.

## Security middleware

The server is wrapped in three layers, all configured in [server.js:13-38](server.js#L13-L38):

- **helmet** — standard hardening headers.
- **cors** — an allowlist of `http://localhost:5173` (SvelteKit dev) and `https://app.pennache.art`.
  Requests with no `Origin` (curl, Postman, native apps) are allowed through.
- **express-rate-limit** — 100 requests per IP per 15 minutes, reported via `RateLimit-*` headers.

[ratelimit-test.sh](ratelimit-test.sh) fires 105 requests at `/api/items` and prints the status codes,
so you can watch the limiter start returning `429`.

## Project layout

```
server.js           Express app, YAML loading, projection maths, routes
wyg.yaml            The items — the only file you need to edit to change content
Dockerfile          node:20-alpine, production deps only
docker-compose.yml  Single `api` service on port 3000
ratelimit-test.sh   Manual check that the rate limiter trips
```
