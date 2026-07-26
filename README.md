# ToolCompare

ToolCompare is a database-backed software directory with a controlled AI
publishing pipeline. AI output never publishes directly: it enters a review
queue, receives a deterministic quality score, and needs at least two HTTPS
sources plus explicit admin approval.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The private growth control room is available at
`/management-hq-2026`.

## Production configuration

Copy `.env.example` into the environment settings on Hostinger. Persistent
growth features require the MySQL `DB_*` variables. AI jobs additionally need
`OPENAI_API_KEY`; the model can be changed with `OPENAI_MODEL`.

The worker is intentionally separate from web requests:

```bash
curl -X POST https://toolcompare.net/api/cron/growth \
  -H "Authorization: Bearer $CRON_SECRET"
```

Schedule this endpoint in Hostinger Cron every 10–15 minutes. A run processes
up to three queued jobs. Failed jobs retry up to three times with a 15-minute
backoff.

## Publishing rules

- Quality score must be at least 80.
- Two HTTPS sources are mandatory.
- Drafts are stored in `content_reviews`.
- Only the admin “Approve” action writes a tool into the live `tools` table.
- Tool pages and the sitemap read from the database first and fall back to the
  bundled JSON catalog when no database is configured.
