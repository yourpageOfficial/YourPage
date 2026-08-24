# Batch 8: Monitoring, Alerting & Error Tracking
> Tau kalau ada masalah SEBELUM user complain

**Status**: ✅ Selesai (2026-04-11)
**Priority**: MEDIUM-HIGH
**Dependency**: Batch 7 (infrastructure ready)
**Estimasi Files**: ~8 config files, ~5 modified

---

## 8.1 Error Tracking — Sentry

### BE Sentry Setup
- [x] `go get github.com/getsentry/sentry-go`
- [x] Init di `main.go`:
  ```go
  sentry.Init(sentry.ClientOptions{
    Dsn: os.Getenv("SENTRY_DSN"),
    Environment: os.Getenv("ENVIRONMENT"),
    TracesSampleRate: 0.1,
  })
  defer sentry.Flush(2 * time.Second)
  ```
- [x] Middleware: `sentrygin` untuk auto-capture panics
- [x] Manual capture di service layer untuk business errors:
  ```go
  sentry.CaptureMessage("withdrawal approved but transfer failed")
  ```
- [x] Tag: user_id, role, endpoint

### FE Sentry Setup
- [x] `npm install @sentry/nextjs`
- [x] `npx @sentry/wizard@latest -i nextjs`
- [x] Auto-capture: unhandled errors, React error boundaries
- [x] Manual capture di useAction hook:
  ```ts
  Sentry.captureException(error, { extra: { endpoint, payload } })
  ```
- [x] Source maps upload di build step

### Alert Rules
- [x] Sentry alert: email/Telegram saat error spike > 10/min
- [x] Sentry alert: new unhandled exception
- [x] P1 errors: payment failures, auth failures, data inconsistency

---

## 8.2 Grafana Dashboard

### Prometheus → Grafana
- [x] Grafana docker container di `docker-compose.prod.yml`:
  ```yaml
  grafana:
    image: grafana/grafana
    ports: ['3001:3000']
    volumes: ['grafana_data:/var/lib/grafana']
    restart: always

  prometheus:
    image: prom/prometheus
    volumes: ['./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml']
    ports: ['9090:9090']
    restart: always
  ```

### Prometheus Config (`/prometheus/prometheus.yml`)
- [x] Scrape targets:
  ```yaml
  scrape_configs:
    - job_name: 'yourpage-api'
      static_configs:
        - targets: ['api:8080']
      metrics_path: '/metrics'
      scrape_interval: 15s

    - job_name: 'postgres'
      static_configs:
        - targets: ['postgres-exporter:9187']

    - job_name: 'redis'
      static_configs:
        - targets: ['redis-exporter:9121']
  ```

### Grafana Dashboards
- [x] **API Dashboard**:
  - Request rate (req/sec)
  - Error rate (% 5xx)
  - Latency percentiles (p50, p95, p99)
  - Endpoint breakdown (slowest endpoints)
  - Active connections

- [x] **Business Dashboard**:
  - New registrations/day
  - Revenue/day (credits transacted)
  - Donations/day
  - Active users (DAU/WAU/MAU)
  - Pending admin actions (topups, withdrawals, KYC)

- [x] **Infrastructure Dashboard**:
  - CPU / Memory / Disk usage
  - PostgreSQL: connections, query time, table sizes
  - Redis: memory, hit rate, connections
  - MinIO: storage used, requests

---

## 8.3 Uptime Monitoring

### External Monitoring
- [x] Setup UptimeRobot / BetterStack / Checkly (free tier):
  - Monitor `https://yourpage.id/api/v1/health` — every 1 min
  - Monitor `https://yourpage.id` — every 1 min
  - Alert: email + Telegram saat down

### Health Check Enhancement
- [x] BE `GET /health` sudah ada — pastikan check:
  - PostgreSQL connection
  - Redis connection
  - MinIO connection
  - Return 503 jika any dependency down

### Status Page
- [x] FE `/status` page — pull dari health endpoint
- [x] Atau: pakai free status page service (Instatus, Cachet)

---

## 8.4 Log Aggregation

### Structured Logging (Already Using zerolog)
- [x] Pastikan semua logs include:
  - `request_id` (trace across services)
  - `user_id` (saat authenticated)
  - `endpoint` + `method`
  - `status_code`
  - `duration_ms`
  - `error` (saat error)

### Log Storage
- [x] Option A: File rotation + grep (simple)
  ```
  /var/log/yourpage/api.log
  logrotate: daily, keep 30 days, compress
  ```
- [x] Option B: Loki + Grafana (searchable, recommended)
  - Tambah Loki di docker-compose
  - Grafana datasource → Loki
  - Query logs langsung dari Grafana

### Log Levels
- [x] `DEBUG` — development only
- [x] `INFO` — request log, business events
- [x] `WARN` — unusual but handled (rate limited, invalid input)
- [x] `ERROR` — unhandled errors, failed operations
- [x] Production: `INFO` level minimum

---

## 8.5 Alerting Channels

### Telegram Bot (Recommended — Gratis)
- [x] Create Telegram bot via @BotFather
- [x] Create alert channel/group
- [x] Integration points:
  - Sentry → Telegram (via webhook)
  - UptimeRobot → Telegram
  - Grafana → Telegram
  - Deploy success/fail → Telegram (GitHub Actions)

### Alert Categories
| Alert | Channel | Severity |
|-------|---------|----------|
| Server down | Telegram + Email | P0 - Immediate |
| Error spike (>10/min) | Telegram | P1 - Urgent |
| Payment failure | Telegram | P1 - Urgent |
| Disk > 80% | Telegram | P2 - Warning |
| Deploy success | Telegram | Info |
| Daily stats summary | Email | Info |

---

## Checklist Selesai
- [x] Sentry: BE + FE error tracking active
- [x] Grafana: 3 dashboards (API, Business, Infrastructure)
- [x] Prometheus: scraping API metrics
- [x] Uptime monitoring: health check every 1 min
- [x] Log aggregation: searchable, rotated
- [x] Alerting: Telegram notifications for P0/P1
- [x] Test: kill API → alert received within 2 min
- [x] Test: trigger error → Sentry captures with context
