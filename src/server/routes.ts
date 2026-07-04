// JSON API. This is the surface the dashboard renders from AND the surface
// Clawnify exposes to agents (via MCP/API) and to Claude Code. Every number is
// computed server-side here so all consumers see identical results.

import { Hono } from "hono";
import { describe } from "@clawnify/connections";
import { FicProvider } from "./fattureincloud";
import { REQUIRES } from "./requires";
import { sampleReport } from "./sample";
import type { Bindings } from "./env";
import type { Invoice, InvoicesReport, Totals } from "./types";

const api = new Hono<{ Bindings: Bindings }>();

function totalsOf(invoices: Invoice[]): Totals {
  const cutoff = Date.now() - 30 * 86_400_000;
  return {
    currency: "EUR",
    count: invoices.length,
    outstanding: invoices.reduce((s, i) => s + i.outstanding, 0),
    overdue: invoices.reduce((s, i) => s + i.overdueAmount, 0),
    overdueCount: invoices.filter((i) => i.daysOverdue !== null).length,
    billedLast30: invoices
      .filter((i) => i.date && new Date(`${i.date}T00:00:00Z`).getTime() >= cutoff)
      .reduce((s, i) => s + i.amountGross, 0),
  };
}

async function buildReport(env: Bindings): Promise<InvoicesReport> {
  const provider = await FicProvider.create(env);
  if (!provider) return sampleReport();
  const invoices = await provider.listInvoices();
  return {
    preview: false,
    company: provider.companyName,
    invoices,
    totals: totalsOf(invoices),
    generatedAt: new Date().toISOString(),
  };
}

/** Connection state + what this app needs wired, for the dashboard and agents. */
api.get("/api/state", async (c) => {
  const provider = await FicProvider.create(c.env).catch(() => null);
  return c.json({
    connected: !!provider,
    preview: !provider,
    company: provider?.companyName ?? null,
    // Agent-legible readiness for everything requires.ts declares: what's
    // connected, how to access it, and the dashboard step for any gaps.
    requirements: await describe(c.env, undefined, REQUIRES),
  });
});

/** Full invoice report: every recent invoice, plus outstanding/overdue totals. */
api.get("/api/invoices", async (c) => {
  try {
    return c.json(await buildReport(c.env));
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

/** Just the overdue invoices, oldest-overdue first — the "chase late payers" feed. */
api.get("/api/overdue", async (c) => {
  try {
    const report = await buildReport(c.env);
    const overdue = report.invoices
      .filter((i) => i.daysOverdue !== null)
      .sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0));
    return c.json({
      preview: report.preview,
      company: report.company,
      overdue,
      totalOverdue: report.totals.overdue,
      currency: report.totals.currency,
      generatedAt: report.generatedAt,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default api;
