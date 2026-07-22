import { createApp } from "@clawnify/app";
import type { Bindings } from "./env";
import api from "./routes";

// Credentials are resolved per-request by @clawnify/connections straight off
// `env` (the CREDENTIALS broker binding + injected secrets), so there's no
// credential bootstrapping middleware to run here.
const app = createApp<{ Bindings: Bindings }>({
  title: "Open Fatturazione Elettronica",
  version: "1.0.0",
  description:
    "Italian electronic-invoicing cockpit on top of Fatture in Cloud — invoices, outstanding amounts, and overdue payments as a JSON API.",
  db: false,
});

app.route("/", api);

export default app;
