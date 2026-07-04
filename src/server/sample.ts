// Preview data. Rendered when Fatture in Cloud isn't connected yet, so the
// dashboard shows a realistic, fully-laid-out shell instead of an empty state.
// Every consumer treats `preview: true` as "not real numbers".

import type { Invoice, InvoicesReport, Totals } from "./types";

const SAMPLE_INVOICES: Invoice[] = [
  {
    id: 4,
    number: "128/2025",
    date: "2025-11-18",
    customer: "Meridiana S.r.l.",
    amountNet: 3200, amountVat: 704, amountGross: 3904,
    payments: [{ dueDate: "2025-12-18", amount: 3904, status: "not_paid", paidDate: null }],
    outstanding: 3904, overdueAmount: 3904, daysOverdue: 47,
  },
  {
    id: 3,
    number: "127/2025",
    date: "2025-11-05",
    customer: "Studio Bianchi",
    amountNet: 1500, amountVat: 330, amountGross: 1830,
    payments: [{ dueDate: "2025-12-05", amount: 1830, status: "not_paid", paidDate: null }],
    outstanding: 1830, overdueAmount: 1830, daysOverdue: 60,
  },
  {
    id: 2,
    number: "126/2025",
    date: "2026-01-12",
    customer: "Officina Rossi & C.",
    amountNet: 890, amountVat: 195.8, amountGross: 1085.8,
    payments: [{ dueDate: "2026-02-11", amount: 1085.8, status: "not_paid", paidDate: null }],
    outstanding: 1085.8, overdueAmount: 0, daysOverdue: null,
  },
  {
    id: 1,
    number: "125/2025",
    date: "2025-10-28",
    customer: "Vignaflora di F. Saponari",
    amountNet: 2400, amountVat: 528, amountGross: 2928,
    payments: [{ dueDate: "2025-11-27", amount: 2928, status: "paid", paidDate: "2025-11-24" }],
    outstanding: 0, overdueAmount: 0, daysOverdue: null,
  },
];

function totalsOf(invoices: Invoice[]): Totals {
  return {
    currency: "EUR",
    count: invoices.length,
    outstanding: invoices.reduce((s, i) => s + i.outstanding, 0),
    overdue: invoices.reduce((s, i) => s + i.overdueAmount, 0),
    overdueCount: invoices.filter((i) => i.daysOverdue !== null).length,
    billedLast30: 1085.8,
  };
}

export function sampleReport(): InvoicesReport {
  return {
    preview: true,
    company: "La tua azienda",
    invoices: SAMPLE_INVOICES,
    totals: totalsOf(SAMPLE_INVOICES),
    generatedAt: new Date().toISOString(),
  };
}
