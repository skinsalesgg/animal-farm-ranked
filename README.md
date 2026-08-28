# Animal Farm Ranked

Community tier lists — rank items, submit your list, see the aggregate.

**Live (GitHub Pages):** https://skinsalesgg.github.io/animal-farm-ranked/

Production domain (planned): https://ranked.goodvibes.gg

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

## Stack

- Vite + React 19 + react-router-dom
- @dnd-kit for drag-and-drop tier boards
- Hono + libSQL/SQLite API

## Docs

- [skinsales.gg integration plan](./docs/skinsales-integration.md)
