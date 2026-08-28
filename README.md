# Animal Farm Ranked

Community tier lists — rank items, submit your list, see the aggregate.

**Live:** https://ranked.goodvibes.gg

Legacy GitHub URL (`skinsalesgg.github.io/animal-farm-ranked/`) is not used when a custom domain is configured.

## Local development

```bash
npm install
npm run db:migrate
npm run seed
npm run dev
```

- App: http://localhost:3000
- API: http://127.0.0.1:8787 (proxied at `/api`)

## GitHub Pages note

GitHub Pages hosts the **static frontend only**. Rankings, submissions, and community data require the Hono API (`server/`). Until the API is deployed, set a repository variable:

- **`VITE_API_URL`** — public API base URL (e.g. `https://api.ranked.goodvibes.gg`)

In GitHub: **Settings → Secrets and variables → Actions → Variables**.

## Production API (Docker on VPS)

The API runs in a **separate** container from `csfloat-monitor` — own compose file, own network, **one SQLite file** for data. See **[docs/docker-api.md](./docs/docker-api.md)** for full setup (compose, nginx, DNS).

Quick start on the VPS:

```bash
cp .env.example .env   # CORS_ORIGINS + DATABASE_PATH (defaults are fine)
docker compose up -d --build
```

## Stack

- Vite + React 19 + react-router-dom
- @dnd-kit for drag-and-drop tier boards
- Hono + SQLite API (single `ranked.db` file — no DB server)

## Docs

- [Docker API deploy (VPS)](./docs/docker-api.md)
- [skinsales.gg integration plan](./docs/skinsales-integration.md)
