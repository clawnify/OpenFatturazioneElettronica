<!-- Banner: run the `readme-banner` skill once there's a deployed screenshot, then drop the image here (above the H1). -->

# OpenFatturazioneElettronica

[![Deploy with Clawnify](https://app.clawnify.com/deploy-button.svg)](https://app.clawnify.com/deploy?repo=clawnify/open-fatturazione-elettronica)

An open-source **Italian e-invoicing cockpit** for your [Fatture in Cloud](https://www.fattureincloud.it/) account — a free, self-hostable alternative view over your invoices. Lists issued invoices, shows what's still **da incassare**, and flags every **fattura scaduta**, then exposes it all as a clean JSON API so a [Clawnify](https://clawnify.com) agent can chase late payers and reconcile payments for you.

It **rides Fatture in Cloud's SdI-accredited pipeline** — Fatture in Cloud creates and transmits the electronic invoice to the *Sistema di Interscambio*. This app only reads and orchestrates on top of it; it never touches the regulated FatturaPA/SdI transmission itself.

## What it does

- **Panoramica** — outstanding total, overdue total, and last-30-days billed, at a glance.
- **Scadute** — every overdue invoice, oldest-overdue first, with days late and amount.
- **Fatture** — recent issued invoices with payment status (pagata / da incassare / scaduta).
- **JSON API** — `GET /api/invoices`, `/api/overdue`, `/api/state` return the same computed numbers the dashboard shows, ready for an agent.

## Connect

The app reads your account through the Clawnify **Fatture in Cloud** connection — no API keys in code. Connect it once from the Clawnify dashboard (Settings → Integrations). Until it's connected, the dashboard runs in **preview mode** with sample data.

## Develop

```bash
pnpm install
cp .dev.vars.example .dev.vars   # optional — leave empty to run in preview mode
pnpm dev                         # vite (UI) + wrangler (API) — open http://localhost:5173
```

To hit your real account locally, set either `CLAWNIFY_TOKEN` (resolves your org's connections) or a bare `FATTUREINCLOUD_BEARER_TOKEN` in `.dev.vars`. See `.dev.vars.example`.

## Deploy

```bash
pnpm deploy   # builds and ships via the Clawnify CLI
```

## Stack

Preact/React + Hono on Cloudflare Workers, Tailwind v4, and [`@clawnify/connections`](https://www.npmjs.com/package/@clawnify/connections) for credential-free API access. No database.

## License

MIT
