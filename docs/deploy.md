# Deploy guide

Two deploy paths, both from **this repo**:

| Target | Workflow | Host |
|--------|----------|------|
| **Frontend** (SPA) | `deploy-pages.yml` | GitHub Pages → `ranked.goodvibes.gg` |
| **API** (Hono) | `deploy-api.yml` | Your VPS (Docker) → `api.ranked.goodvibes.gg` via nginx |

No skinsales.gg or csfloat-monitor deploy involvement for ranked code.

---

## 1. Merge Docker support

Ensure `main` includes PR #1 (`feat/docker-api`): `Dockerfile`, `compose.yml`, etc.

---

## 2. Frontend (GitHub Pages)

### Repo variables

**Settings → Secrets and variables → Actions → Variables**

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://api.ranked.goodvibes.gg` |

### DNS

| Record | Target |
|--------|--------|
| `ranked.goodvibes.gg` | GitHub Pages (see repo **Settings → Pages**) |

Push to `main` runs `deploy-pages.yml` automatically.

---

## 3. API (VPS Docker)

### GitHub secrets

**Settings → Secrets and variables → Actions → Secrets**

| Secret | Notes |
|--------|-------|
| `SSH_HOST` | VPS IP/hostname (same box as csfloat is fine) |
| `SSH_USER` | SSH user |
| `SSH_PRIVATE_KEY` | Deploy key (same as csfloat works) |
| `SSH_PORT` | Optional, default `22` |
| `DEPLOY_PATH` | Optional, default `~/animal-farm-ranked` on VPS |

### GitHub variables

| Variable | Default | Notes |
|----------|---------|-------|
| `CORS_ORIGINS` | `https://ranked.goodvibes.gg,http://localhost:3000` | Allowed browser origins |
| `SEED_ON_START` | `1` | Run seed on container start |

### What deploy writes

On each push to `main`, `deploy-api.yml` SSHs in and creates:

```env
CORS_ORIGINS=…
SEED_ON_START=…
```

`compose.yml` sets `HOST`, `PORT`, `NODE_ENV`, and `DATABASE_PATH=data/ranked.db`. Data lives in Docker volume `ranked_api_data` (one SQLite file).

### DNS

| Record | Target |
|--------|--------|
| `api.ranked` | VPS IP |

---

## 4. One-time nginx on VPS (shared infra)

The API container has **no public port**. Nginx on your existing VPS must proxy `api.ranked.goodvibes.gg` → `animal_farm_ranked_api:8787`.

Do this **once** in csfloat-monitor (nginx only — not ranked deploy):

1. **Docker network** — add to `nginx` service in `compose.yml`:

```yaml
networks:
  - default
  - goodvibes-ranked

networks:
  goodvibes-ranked:
    external: true
```

(`goodvibes-ranked` is created when ranked API compose first runs.)

2. **Nginx config** — copy [nginx-api.ranked.goodvibes.gg.conf](./nginx-api.ranked.goodvibes.gg.conf) into csfloat nginx snippets (or use the ranked-api snippets from csfloat `feat/ranked-api-deploy` nginx-only changes).

3. **TLS**:

```bash
cd ~/csfloat-monitor
docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  -d api.ranked.goodvibes.gg --non-interactive --agree-tos --register-unsafely-without-email
docker compose exec nginx nginx -s reload
```

See [docker-api.md](./docker-api.md) for nginx snippet details.

---

## 5. Verify

```bash
curl https://api.ranked.goodvibes.gg/health
# {"ok":true}

curl https://api.ranked.goodvibes.gg/rankings/kato-2014-holos/community
```

Open `https://ranked.goodvibes.gg` → rank → submit → share link.

---

## Order of operations

1. Merge `feat/docker-api` to `main`
2. Set GitHub **secrets/vars** on this repo (above)
3. Push to `main` → Pages + API deploy
4. One-time nginx + cert on VPS
5. Set `VITE_API_URL`, redeploy Pages if API URL changed

---

## Backup

```bash
docker compose -f compose.yml -p animal-farm-ranked exec ranked-api \
  cat /app/data/ranked.db > ranked-backup.db
```

That file is the entire database.
