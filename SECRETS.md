# Secrets & Deployment Configuration

Production credentials live in **GitHub Actions Secrets**, never in the repository.
On every deploy, `.github/workflows/deploy.yml` writes a fresh `~/YourPage/.env`
(mode `600`) on the VM from those secrets, then brings the stack up. Nothing is
edited by hand on the server.

## Required GitHub Secrets

Set these under **Settings → Secrets and variables → Actions**, in the
`production` environment.

### Connection to the VM

| Secret | Purpose |
|---|---|
| `VM_HOST` | GCP VM IP or hostname |
| `VM_USER` | SSH user |
| `VM_SSH_KEY` | Private key for that user |

### Application

| Secret | Purpose | Notes |
|---|---|---|
| `DOMAIN` | Public domain | Drives nginx + Let's Encrypt |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | PostgreSQL | |
| `REDIS_PASSWORD` | Redis auth | |
| `JWT_SECRET` | Signs access/refresh tokens | Rotating invalidates all sessions |
| `MINIO_USER` / `MINIO_PASSWORD` / `MINIO_ROOT_PASSWORD` | Object storage | |
| `GRAFANA_PASSWORD` | Grafana admin | Required even when monitoring is off — see below |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap admin account | Created on first startup only |
| `FINANCE_EMAIL` / `FINANCE_PASSWORD` | Bootstrap finance account | |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Transactional email | |

**Grafana:** Docker Compose interpolates variables for *every* service before
starting anything, including profile-gated services that never run. A missing
`GRAFANA_PASSWORD` therefore aborts the whole deploy, not just monitoring.

The deploy fails fast if any of these resolves to an empty string, rather than
booting the stack with a blank password.

## Payment credentials are NOT here

Stripe keys are **not** environment variables. They are stored in the
`platform_settings` table and managed by an admin at **Admin → Pengaturan →
Metode Pembayaran**:

- Publishable key, secret key, webhook signing secret
- Per-method on/off toggles (QRIS manual, Stripe)

The API only ever returns the last 4 characters of stored secrets. Submitting a
masked value back (one containing `•`) is ignored, so re-saving the form never
overwrites a real key with its own mask.

Point the Stripe dashboard webhook at `https://<domain>/api/v1/webhooks/stripe`
and subscribe to `checkout.session.completed` and `checkout.session.expired`.

## Local development

`.env` at the repo root is gitignored. Required keys for `docker-compose.yml`:

```
DB_PASSWORD, JWT_SECRET, MINIO_USER, MINIO_PASSWORD,
ADMIN_EMAIL, ADMIN_PASSWORD, FINANCE_EMAIL, FINANCE_PASSWORD, GRAFANA_PASSWORD
```

Optional host-port overrides, useful when another project already binds these
ports:

```
POSTGRES_HOST_PORT=5433
BE_HOST_PORT=8081
FE_HOST_PORT=3001
REDIS_HOST_PORT=6380
```

## Rotation

1. Update the secret in GitHub.
2. Re-run the deploy workflow (`workflow_dispatch` or push a tag).

Rotating `ADMIN_PASSWORD` after first boot does **not** change the existing
admin account — the bootstrap only runs when the account is absent. Change that
password from within the admin UI instead.
