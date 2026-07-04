// Domain types. Shapes are normalized from the Fatture in Cloud API V2
// IssuedDocument model (see fattureincloud.ts) so the routes, the dashboard, and
// any Clawnify agent all read identical, already-computed numbers.

/** Payment status as issued by Fatture in Cloud (IssuedDocumentStatus enum). */
export type PaymentStatus = "not_paid" | "paid" | "reversed";

export interface Payment {
  dueDate: string | null;
  amount: number;
  status: PaymentStatus;
  paidDate: string | null;
}

export interface Invoice {
  id: number;
  /** Human-facing document number, e.g. "42" or "42/A". */
  number: string;
  date: string;
  customer: string;
  amountNet: number;
  amountVat: number;
  amountGross: number;
  payments: Payment[];
  /** Sum of still-unpaid instalments (status = not_paid). */
  outstanding: number;
  /** Sum of unpaid instalments whose due date is in the past. */
  overdueAmount: number;
  /** Days past the oldest unpaid due date, or null if nothing is overdue. */
  daysOverdue: number | null;
}

export interface Totals {
  currency: string;
  count: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
  /** Gross of invoices dated within the last 30 days — a cheap "recent volume". */
  billedLast30: number;
}

export interface InvoicesReport {
  preview: boolean;
  company: string | null;
  invoices: Invoice[];
  totals: Totals;
  generatedAt: string;
}
