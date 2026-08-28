# Docker API deploy (Option A)

Run the Hono API in its **own** container on your VPS — separate from `csfloat-monitor`, separate Postgres, separate deploy lifecycle. The static frontend stays on GitHub Pages / Cloudflare at `ranked.goodvibes.gg`.

## Database: one SQLite file

No Postgres. No Turso. No database server.

All tier-list data lives in a **single file**:

```text
data/ranked.db
```

Docker keeps it on the named volume `ranked_api_data` (mounted at `/app/data`). Back it up by copying that file — that's the whole database.

## Architecture

```
ranked.goodvibes.gg          → GitHub Pages / CF (static SPA)
api.ranked.goodvibes.gg      → nginx on VPS → animal_farm_ranked_api:8787
                               └── data/ranked.db (SQLite, one file on a volume)
csfloat-monitor nginx        → one-time proxy to api.ranked.goodvibes.gg (see deploy.md)
```

## GitHub configuration

All deploy config lives on **this repo** — see **[docs/deploy.md](./deploy.md)**.

| Workflow | Trigger | Needs |
|----------|---------|-------|
| `deploy-pages.yml` | push `main` | Variable `VITE_API_URL` |
| `deploy-api.yml` | push `main` | Secrets `SSH_*`, optional `DEPLOY_PATH`; vars `CORS_ORIGINS`, `SEED_ON_START` |

Nginx/TLS for `api.ranked.goodvibes.gg` is a **one-time** VPS setup (documented in deploy.md), not part of this repo's deploy workflow.

## 1. Configure env (manual)

On the VPS, clone or pull `kato-ranking` and create `.env` (or let **csfloat-monitor deploy** write it — see [GitHub configuration](#github-configuration) above):

```bash
cp .env.example .env
```

Production defaults:

```env
NODE_ENV=production
PORT=8787
DATABASE_PATH=data/ranked.db
CORS_ORIGINS=https://ranked.goodvibes.gg,http://localhost:3000
SEED_ON_START=1
```

Do **not** set `TURSO_*` unless you explicitly want hosted libSQL later.

## 2. Start the API container

From the `kato-ranking` repo root:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f ranked-api
```

Health check:

```bash
docker compose exec ranked-api wget -qO- http://127.0.0.1:8787/health
```

This creates:

- Docker network `goodvibes-ranked`
- Container `animal_farm_ranked_api`
- Volume `ranked_api_data` → `/app/data/ranked.db`

**No host ports are published** — the API is only reachable from containers on that network (or after you wire nginx).

Migrations and seed run automatically on container start.

## 3. Wire nginx (same VPS as skinsales API)

The ranked API does **not** go in `csfloat-monitor/compose.yml`. Add a **separate** nginx server block and attach nginx to the shared network.

### 3a. Join nginx to the ranked network

In `csfloat-monitor/compose.yml`, on the `nginx` service:

```yaml
    networks:
      - default
      - goodvibes-ranked

# at bottom with other networks:
networks:
  goodvibes-ranked:
    external: true
```

Then reload:

```bash
cd /path/to/csfloat-monitor
docker compose up -d nginx
```

### 3b. Add server block + TLS

Copy the snippet from [nginx-api.ranked.goodvibes.gg.conf](./nginx-api.ranked.goodvibes.gg.conf) into your nginx config (or include it from `nginx/snippets/`).

Obtain a cert (adjust email/domain):

```bash
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d api.ranked.goodvibes.gg
```

Reload nginx after cert files exist.

### 3c. DNS

In the `goodvibes.gg` zone:

| Record | Type | Target |
|--------|------|--------|
| `api.ranked` | A or CNAME | Your VPS IP / hostname |

## 4. Point the frontend at the API

GitHub repo **Settings → Secrets and variables → Actions → Variables**:

- `VITE_API_URL` = `https://api.ranked.goodvibes.gg`

Re-run the Pages deploy workflow (or push to `main`).

## 5. Verify end-to-end

- `curl https://api.ranked.goodvibes.gg/health` → `{"ok":true}`
- `curl https://api.ranked.goodvibes.gg/rankings/kato-2014-holos/community`
- Open `https://ranked.goodvibes.gg`, rank holos, submit, share link works

## Operations

```bash
# Logs
docker compose logs -f ranked-api

# Restart after env change
docker compose up -d --build ranked-api

# Stop (skinsales unaffected)
docker compose down

# Backup the database (whole DB is one file)
docker compose exec ranked-api cat /app/data/ranked.db > ranked-backup-$(date +%F).db

# Restore: copy file back into the volume, then restart
docker compose up -d ranked-api
```

## What stays separate

| Concern | csfloat-monitor | kato-ranking API |
|---------|-----------------|------------------|
| Compose file | `csfloat-monitor/compose.yml` | `kato-ranking/compose.yml` |
| Runtime | Python / Litestar | Node / Hono |
| Database | Postgres server | Single SQLite file (`ranked.db`) |
| Deploy | This repo (`deploy-api.yml`) | VPS git pull + compose in kato-ranking dir |
| Failure blast radius | Sales API | Tier lists only |

## Optional: Turso

If you ever want the same SQLite schema hosted in the cloud (multi-region, managed backups), set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` instead of `DATABASE_PATH`. Not needed for a fun side project on one VPS.
