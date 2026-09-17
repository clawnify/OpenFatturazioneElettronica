// Preview data. Rendered when Fatture in Cloud isn't connected yet, so the
// dashboard shows a realistic, fully-laid-out shell instead of an empty state.
// Every consumer treats `preview: true` as "not real numbers".
//
// Dates are relative to today, so "overdue" and "billed in the last 30 days"
// stay true whenever the preview is opened. Customers are fictional.

import type { Invoice, InvoicesReport, Totals } from "./types";

const DAY = 86_400_000;

interface SampleSpec {
  customer: string;
  amountNet: number;
  /** Days before today the invoice was issued. */
  issuedAgo: number;
  /** Payment terms in days. */
  terms: number;
  /** Days before today it was paid, or null while unpaid. */
  paidAgo: number | null;
}

// Oldest first, so numbering follows issue date.
const SPECS: SampleSpec[] = [
  { customer: "Vignaflora Società Agricola", amountNet: 2400, issuedAgo: 110, terms: 30, paidAgo: 83 },
  { customer: "Studio Esempio Associati", amountNet: 1500, issuedAgo: 90, terms: 30, paidAgo: null },
  { customer: "Nordluce S.r.l.", amountNet: 3200, issuedAgo: 77, terms: 30, paidAgo: null },
  { customer: "Officina Ventura & C.", amountNet: 890, issuedAgo: 12, terms: 30, paidAgo: null },
];

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const cents = (n: number) => Math.round(n * 100) / 100;

function sampleInvoices(now: number): Invoice[] {
  const perYear = new Map<string, number>();
  return SPECS.map((spec, index): Invoice => {
    const issued = now - spec.issuedAgo * DAY;
    const due = issued + spec.terms * DAY;
    const year = isoDay(issued).slice(0, 4);
    const sequence = (perYear.get(year) ?? 0) + 1;
    perYear.set(year, sequence);

    const amountVat = cents(spec.amountNet * 0.22);
    const amountGross = cents(spec.amountNet + amountVat);
    const paid = spec.paidAgo !== null;
    const overdue = !paid && due < now;
    return {
      id: index + 1,
      number: `${sequence}/${year}`,
      date: isoDay(issued),
      customer: spec.customer,
      amountNet: spec.amountNet,
      amountVat,
      amountGross,
      payments: [{
        dueDate: isoDay(due),
        amount: amountGross,
        status: paid ? "paid" : "not_paid",
        paidDate: paid ? isoDay(now - spec.paidAgo! * DAY) : null,
      }],
      outstanding: paid ? 0 : amountGross,
      overdueAmount: overdue ? amountGross : 0,
      daysOverdue: overdue ? Math.floor((now - due) / DAY) : null,
    };
  }).reverse(); // newest first, like the live list
}

function totalsOf(invoices: Invoice[], now: number): Totals {
  const cutoff = now - 30 * DAY;
  return {
    currency: "EUR",
    count: invoices.length,
    outstanding: cents(invoices.reduce((s, i) => s + i.outstanding, 0)),
    overdue: cents(invoices.reduce((s, i) => s + i.overdueAmount, 0)),
    overdueCount: invoices.filter((i) => i.daysOverdue !== null).length,
    billedLast30: cents(invoices
      .filter((i) => new Date(`${i.date}T00:00:00Z`).getTime() >= cutoff)
      .reduce((s, i) => s + i.amountGross, 0)),
  };
}

export function sampleReport(now = Date.now()): InvoicesReport {
  const invoices = sampleInvoices(now);
  return {
    preview: true,
    company: "La tua azienda",
    invoices,
    totals: totalsOf(invoices, now),
    generatedAt: new Date(now).toISOString(),
  };
}
