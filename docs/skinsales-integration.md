# Animal Farm Ranked — skinsales.gg Integration Plan

Ship **Animal Farm Ranked** (community tier lists) as a standalone product at **`ranked.goodvibes.gg`**, discoverable from **skinsales.gg**. The tier-list UI and Hono API live in the **kato-ranking** repo until/unless the backend is ported to csfloat-monitor.

---

## Domain layout

| Service | Domain | Notes |
|---------|--------|--------|
| **Frontend (SPA)** | `https://ranked.goodvibes.gg` | kato-ranking Vite build on Cloudflare Pages |
| **API** | `https://api.ranked.goodvibes.gg` | kato-ranking Hono server (recommended) |
| **Alternative API** | `https://ranked.goodvibes.gg/api/*` | Same host via CF Pages Functions or reverse proxy |

**skinsales.gg** only links out — it does not host the app.

```
skinsales.gg  ──link──►  ranked.goodvibes.gg
                              │
                              └──► api.ranked.goodvibes.gg
```

### DNS (goodvibes.gg zone)

| Record | Type | Target |
|--------|------|--------|
| `ranked` | CNAME | Cloudflare Pages project |
| `api.ranked` | CNAME | API host (Fly / Railway / CF Worker / etc.) |

---

## Phase 1 scope

**In scope:** discovery links on skinsales.gg, deploy frontend + API, DNS, CORS, Turso prod DB.

**Out of scope:** porting tier-list UI into skinsales.gg `src/`, reimplementing API in csfloat-monitor, reusing `/sales/ranked-float` routes (that name means global float rank sales, not user tier lists).

---

## What the skinsales.gg agent should CREATE

### 1. Discovery & navigation (skinsales.gg repo)

| Item | Location | Details |
|------|----------|---------|
| Home index row | `src/pages/HomePage.tsx`, `HomePage.css` | New row, e.g. **Animal Farm Ranked** — community tier lists for stickers/skins. External link (env-driven). |
| Top nav link | `src/components/Navigation.tsx` | Optional **Ranked** link to the same URL. |
| Config | `src/config.ts` | `VITE_RANKED_URL=https://ranked.goodvibes.gg` |
| Page meta | `src/constants/pageMeta.ts` | Only if adding an internal landing page. |

**Copy guidance:** Use “community tier list” / “rank stickers”. Avoid “ranked float” language.

### 2. Cloudflare Pages — ranked frontend

Deploy from the **kato-ranking** repo (separate CF Pages project from skinsales-gg):

| Item | Details |
|------|---------|
| Project name | e.g. `goodvibes-ranked` |
| Custom domain | `ranked.goodvibes.gg` |
| Build command | `npm run build` |
| Output directory | `dist/` |
| Env | `VITE_API_URL=https://api.ranked.goodvibes.gg` (or `/api` if proxied on same host) |
| SPA fallback | `/* /index.html 200` (Cloudflare Pages redirects or `_redirects`) |

**Client routes that must work:**

- `/`
- `/kato-2014-holos`
- `/kato-2014-holos/rank`
- `/kato-2014-holos/r/:id`

### 3. API hosting

**Option A — Keep kato-ranking Hono (recommended for Phase 1)**

| Item | Details |
|------|---------|
| Source | `server/` in kato-ranking |
| Host | Fly.io, Railway, CF Worker + adapter, or similar |
| Domain | `api.ranked.goodvibes.gg` |
| Database | Turso (production) |
| Health check | `GET /health` |

**Option B — Port to csfloat-monitor (later)**

Reimplement endpoints in Litestar/Python. Not Phase 1 unless explicitly requested.

### 4. CORS & cookies

The ranked API uses cookie credentials on submit (`afr_session`). CORS must allow:

- `https://ranked.goodvibes.gg`
- `http://localhost:3000` (local dev)
- Optionally `https://skinsales.gg` (if ever embedded)

Settings: `credentials: true`, appropriate `SameSite` on session cookie.

### 5. Optional Phase 1.5

| Item | Purpose |
|------|---------|
| Sticker catalog API | Replace hardcoded Steam CDN URLs in kato-ranking list definitions |
| OG / social previews | Rich previews for share URLs `/kato-2014-holos/r/:id` |

---

## What the skinsales agent should NOT do

- Tier board UI, dnd-kit drag-and-drop, rank / community / share pages (stay in kato-ranking)
- List definitions in `src/lists/` unless moving to a shared API-driven catalog
- Aggregation logic (`src/lib/aggregate.ts`)
- Hono route handlers (unless choosing Option B)

---

## API contract (reference)

Base path: `/rankings/:listId`

| Method | Path | Response / purpose |
|--------|------|-------------------|
| `GET` | `/community` | `{ submissionCount, aggregated }` |
| `GET` | `/submissions?limit=20` | `{ submissions: [{ id, displayName, createdAt }] }` |
| `GET` | `/submissions/:id` | Full submission with placements |
| `POST` | `/submissions` | Create submission → `{ id }` |

### POST `/submissions` body

```json
{
  "displayName": "goodvibes",
  "website": "",
  "placements": [
    { "itemId": "titan_holo", "tier": "S" }
  ]
}
```

| Field | Rules |
|-------|--------|
| `displayName` | **Required**, trimmed, max 40 characters |
| `website` | Honeypot — non-empty value returns 400 |
| `placements` | Every list item exactly once, valid tier (S–F) |

**Launch list ID:** `kato-2014-holos`  
**URL slug:** `kato-2014-holos`

---

## What the skinsales agent should RETURN (handoff)

Copy this template filled in when work is complete:

```markdown
## HANDOFF FOR KATO-RANKING

RANKED_PUBLIC_URL=https://ranked.goodvibes.gg
RANKED_API_PUBLIC_URL=https://api.ranked.goodvibes.gg
VITE_API_URL=https://api.ranked.goodvibes.gg

CORS_ORIGINS=https://ranked.goodvibes.gg,http://localhost:3000

TURSO_DATABASE_URL=<set in API host secrets>
TURSO_AUTH_TOKEN=<set in API host secrets>

SKINSALES_DISCOVERY_URL=https://skinsales.gg

DNS:
- ranked.goodvibes.gg → CF Pages (project: ___)
- api.ranked.goodvibes.gg → ___ (host: ___)

Deploy:
- Frontend workflow / project: ___
- API workflow / host: ___

PRs:
- skinsales.gg home + nav: ___
- ranked deploy (if in separate repo): ___
```

### Optional (if sticker catalog API is built)

```json
{
  "items": [
    {
      "id": "titan_holo",
      "name": "Titan (Holo)",
      "label": "Titan",
      "imageUrl": "https://...",
      "sortOrder": 1
    }
  ]
}
```

---

## What the kato-ranking agent updates after handoff

| Area | Change |
|------|--------|
| `.env.example` | Document production URLs and Turso vars |
| `src/config.ts` | `VITE_API_URL` for prod builds |
| `server/index.ts` | CORS allowlist from `CORS_ORIGINS` env |
| `server/db.ts` | Turso connection in production |
| Deploy config | CF Pages + API workflow for goodvibes domain |
| Share / copy link | Canonical base `https://ranked.goodvibes.gg` |
| Optional | “Back to skinsales.gg” link; fetch list items from catalog API |

---

## Acceptance criteria

### skinsales.gg

- [ ] Home page lists Animal Farm Ranked with link to `https://ranked.goodvibes.gg`
- [ ] Link resolves in production (not localhost)
- [ ] No naming collision with “Ranked Float Sales” (`/sales/ranked-float`)

### ranked.goodvibes.gg

- [ ] Home and Katowice 2014 list load
- [ ] Rank flow: drag all 16 holos, required name, submit
- [ ] Redirect to share URL `/kato-2014-holos/r/:id`
- [ ] Community aggregate and recent submissions work
- [ ] Copy link on share page works

### Handoff

- [ ] All prod URLs and env var names documented
- [ ] CORS verified from prod frontend to prod API
- [ ] Turso seeded / migrated for `kato-2014-holos`

---

## Agent prompt (copy/paste)

```text
Implement Phase 1 integration of Animal Farm Ranked (kato-ranking repo) at ranked.goodvibes.gg.

DO:
1. Add home index row + optional nav link on skinsales.gg pointing to https://ranked.goodvibes.gg (env: VITE_RANKED_URL).
2. Set up Cloudflare Pages for kato-ranking at ranked.goodvibes.gg (SPA fallback for client routes).
3. Deploy kato-ranking Hono API at api.ranked.goodvibes.gg with Turso; configure CORS for ranked.goodvibes.gg.
4. Return a completed "HANDOFF FOR KATO-RANKING" section with all prod URLs, CORS origins, Turso env names, DNS records, and PR links.

DO NOT:
- Port tier-list UI into skinsales.gg src/
- Host under skinsales.gg domain or /sales/ranked-float
- Reimplement API in csfloat-monitor (Phase 1)

Reference API: GET/POST /rankings/kato-2014-holos/* (community, submissions list, single submission, submit with required displayName).
```

---

## Related repos

| Repo | Role |
|------|------|
| **kato-ranking** | Tier-list SPA + Hono API + SQLite/Turso (source of truth for Phase 1) |
| **skinsales-gg** | Discovery links only |
| **csfloat-monitor** | Main skinsales API (backend port optional, later) |
