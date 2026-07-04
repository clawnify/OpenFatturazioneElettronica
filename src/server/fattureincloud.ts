// Fatture in Cloud provider. All data comes through the connections SDK's generic
// proxy — connect("fattureincloud", env).get(path) — which routes through the
// credential broker (raw "own"-tier token) and prepends the registry base URL
// (https://api-v2.fattureincloud.it). The app carries NO token plumbing; it only
// builds company-scoped paths.
//
// Fatture in Cloud is the SdI-accredited channel: it creates and transmits the
// electronic invoice. This app only reads/orchestrates on top of it — it never
// touches the regulated FatturaPA/SdI pipeline itself.

import { connect, isConnected, type ConnectionsEnv, type GenericClient } from "@clawnify/connections";
import type { Invoice, Payment, PaymentStatus } from "./types";

const SERVICE = "fattureincloud";

// ── Raw API shapes (subset of the IssuedDocument model we consume) ────────────

interface FicPayment {
  due_date?: string | null;
  amount?: number;
  status?: string;
  paid_date?: string | null;
}

interface FicDoc {
  id: number;
  number?: number;
  numeration?: string | null;
  date?: string;
  entity?: { name?: string } | null;
  amount_net?: number;
  amount_vat?: number;
  amount_gross?: number;
  payments_list?: FicPayment[] | null;
}

interface FicListResponse {
  data?: FicDoc[];
}

interface FicCompaniesResponse {
  data?: { companies?: { id: number; name?: string }[] } | null;
}

// ── Mapping helpers ───────────────────────────────────────────────────────────

const KNOWN_STATUS: PaymentStatus[] = ["not_paid", "paid", "reversed"];
const toStatus = (s?: string): PaymentStatus =>
  (KNOWN_STATUS as string[]).includes(s ?? "") ? (s as PaymentStatus) : "not_paid";

/** Whole days `date` is before `today` (both midnight-UTC); negative if future. */
function daysBefore(date: string, today: Date): number {
  const due = new Date(`${date}T00:00:00Z`).getTime();
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.floor((now - due) / 86_400_000);
}

function mapDoc(doc: FicDoc, today: Date): Invoice {
  const payments: Payment[] = (doc.payments_list ?? []).map((p) => ({
    dueDate: p.due_date ?? null,
    amount: p.amount ?? 0,
    status: toStatus(p.status),
    paidDate: p.paid_date ?? null,
  }));

  const unpaid = payments.filter((p) => p.status === "not_paid");
  const outstanding = unpaid.reduce((sum, p) => sum + p.amount, 0);

  const overduePayments = unpaid.filter((p) => p.dueDate && daysBefore(p.dueDate, today) > 0);
  const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);
  const daysOverdue = overduePayments.length
    ? Math.max(...overduePayments.map((p) => daysBefore(p.dueDate as string, today)))
    : null;

  const number = doc.numeration ? `${doc.number ?? ""}/${doc.numeration}` : `${doc.number ?? doc.id}`;

  return {
    id: doc.id,
    number,
    date: doc.date ?? "",
    customer: doc.entity?.name ?? "—",
    amountNet: doc.amount_net ?? 0,
    amountVat: doc.amount_vat ?? 0,
    amountGross: doc.amount_gross ?? 0,
    payments,
    outstanding,
    overdueAmount,
    daysOverdue,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export class FicProvider {
  private constructor(
    private client: GenericClient,
    readonly companyId: number,
    readonly companyName: string | null,
  ) {}

  /**
   * Resolve the connection and the target company. Returns null when Fatture in
   * Cloud isn't connected (→ dashboard shows preview mode). Company is pinned by
   * FATTUREINCLOUD_COMPANY_ID when set, else the first company on the account.
   */
  static async create(env: ConnectionsEnv & { FATTUREINCLOUD_COMPANY_ID?: string }): Promise<FicProvider | null> {
    if (!(await isConnected(SERVICE, env))) return null;
    const client = connect(SERVICE, env);

    const pinned = env.FATTUREINCLOUD_COMPANY_ID ? Number(env.FATTUREINCLOUD_COMPANY_ID) : NaN;
    if (Number.isFinite(pinned)) return new FicProvider(client, pinned, null);

    const res = (await client.get("/user/companies")) as FicCompaniesResponse;
    const first = res.data?.companies?.[0];
    if (!first) return null;
    return new FicProvider(client, first.id, first.name ?? null);
  }

  /** Most recent issued invoices, newest first, normalized with payment state. */
  async listInvoices(perPage = 100): Promise<Invoice[]> {
    const today = new Date();
    const res = (await this.client.get(
      `/c/${this.companyId}/issued_documents?type=invoice&fieldset=detailed&sort=-date&per_page=${perPage}`,
    )) as FicListResponse;
    return (res.data ?? []).map((doc) => mapDoc(doc, today));
  }
}
