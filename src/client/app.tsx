import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, FileText, RefreshCw } from "lucide-react";

// ── Types (mirror src/server/types.ts) ────────────────────────────────────────

type PaymentStatus = "not_paid" | "paid" | "reversed";
interface Invoice {
  id: number;
  number: string;
  date: string;
  customer: string;
  amountGross: number;
  outstanding: number;
  overdueAmount: number;
  daysOverdue: number | null;
  payments: { status: PaymentStatus }[];
}
interface Totals {
  currency: string;
  count: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
  billedLast30: number;
}
interface Report {
  preview: boolean;
  company: string | null;
  invoices: Invoice[];
  totals: Totals;
}

// ── Formatting ────────────────────────────────────────────────────────────────

const eur = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const eurExact = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
const day = (iso: string) =>
  iso ? new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${iso}T00:00:00Z`)) : "—";

const DASHBOARD_INTEGRATIONS = "https://app.clawnify.com/settings/integrations";

// ── Primitives ────────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-border bg-surface">{children}</div>;
}

function Stat({ label, value, meta, tone }: { label: string; value: string; meta: string; tone?: "danger" }) {
  return (
    <div className="flex flex-col gap-1 p-5">
      <span className="eyebrow">{label}</span>
      <span className={`tnum text-2xl font-bold leading-none ${tone === "danger" ? "text-danger" : "text-foreground"}`}>
        {value}
      </span>
      <span className="text-[0.6875rem] leading-tight text-muted">{meta}</span>
    </div>
  );
}

function StatusBadge({ invoice }: { invoice: Invoice }) {
  if (invoice.daysOverdue !== null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger-tint px-2 py-0.5 text-xs font-semibold text-danger">
        <AlertTriangle size={11} strokeWidth={2.5} /> Scaduta {invoice.daysOverdue}g
      </span>
    );
  }
  if (invoice.outstanding <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success-tint px-2 py-0.5 text-xs font-semibold text-success">
        <CheckCircle2 size={11} strokeWidth={2.5} /> Pagata
      </span>
    );
  }
  return (
    <span className="rounded-sm border border-border bg-surface-sunken px-2 py-0.5 text-[0.6875rem] text-muted">
      Da incassare
    </span>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export function App() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices");
      setReport(await res.json());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => void load(), []);

  const overdue = (report?.invoices ?? [])
    .filter((i) => i.daysOverdue !== null)
    .sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0));

  return (
    <div className="mx-auto min-h-screen max-w-[75rem] px-4 py-6 sm:px-6">
      {/* Toolbar */}
      <header className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <FileText size={18} className="text-primary" strokeWidth={2.25} />
          <div>
            <h1 className="text-xl font-bold leading-tight tracking-tight">Fatturazione Elettronica</h1>
            {report?.company && <p className="text-xs text-muted">{report.company}</p>}
          </div>
        </div>
        {report?.preview ? (
          <a
            href={DASHBOARD_INTEGRATIONS}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-3 text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover"
          >
            Connetti Fatture in Cloud <ExternalLink size={14} />
          </a>
        ) : (
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-3 text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Aggiorna
          </button>
        )}
      </header>

      {report?.preview && (
        <div className="mb-6 rounded-lg border border-border bg-warning-tint px-4 py-3 text-sm text-warning">
          Dati di esempio. Collega il tuo account Fatture in Cloud dalla dashboard per vedere le tue fatture reali.
        </div>
      )}

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <Stat label="Da incassare" value={eur(report?.totals.outstanding ?? 0)} meta={`${report?.totals.count ?? 0} fatture`} />
        </Card>
        <Card>
          <Stat
            label="Scaduto"
            value={eur(report?.totals.overdue ?? 0)}
            meta={`${report?.totals.overdueCount ?? 0} fatture scadute`}
            tone={report && report.totals.overdue > 0 ? "danger" : undefined}
          />
        </Card>
        <Card>
          <Stat label="Fatturato 30gg" value={eur(report?.totals.billedLast30 ?? 0)} meta="ultimi 30 giorni" />
        </Card>
      </div>

      {/* Overdue */}
      <div className="mb-6">
        <Card>
          <div className="border-b border-border px-5 py-3">
            <span className="eyebrow">Scadute · {overdue.length}</span>
          </div>
          {overdue.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-5 py-12 text-center">
              <CheckCircle2 size={20} className="text-success" strokeWidth={2} />
              <p className="text-sm text-muted">Nessuna fattura scaduta. Sei in pari.</p>
            </div>
          ) : (
            <InvoiceTable rows={overdue} highlightOverdue />
          )}
        </Card>
      </div>

      {/* All invoices */}
      <Card>
        <div className="border-b border-border px-5 py-3">
          <span className="eyebrow">Fatture · {report?.invoices.length ?? 0}</span>
        </div>
        {loading && !report ? (
          <p className="px-5 py-12 text-center text-sm text-muted">Caricamento…</p>
        ) : (report?.invoices.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center gap-1 px-5 py-12 text-center">
            <p className="text-sm text-muted">Nessuna fattura ancora. Emetti la prima dal tuo account Fatture in Cloud.</p>
          </div>
        ) : (
          <InvoiceTable rows={report!.invoices} />
        )}
      </Card>

      <p className="mt-6 text-center text-[0.6875rem] text-faint">
        Rides Fatture in Cloud's SdI-accredited pipeline · open source
      </p>
    </div>
  );
}

function InvoiceTable({ rows, highlightOverdue }: { rows: Invoice[]; highlightOverdue?: boolean }) {
  const totalCol = highlightOverdue ? rows.reduce((s, i) => s + i.overdueAmount, 0) : rows.reduce((s, i) => s + i.amountGross, 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-surface-sunken text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="px-4 py-2.5 font-semibold">Cliente</th>
            <th className="px-4 py-2.5 font-semibold">Numero</th>
            <th className="px-4 py-2.5 font-semibold">{highlightOverdue ? "Scaduta il" : "Data"}</th>
            <th className="px-4 py-2.5 font-semibold">Stato</th>
            <th className="px-4 py-2.5 text-right font-semibold">{highlightOverdue ? "Scaduto" : "Totale"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => (
            <tr key={i.id} className="border-t border-border transition-colors hover:bg-surface-sunken">
              <td className="px-4 py-2.5 text-[0.8125rem] font-medium">{i.customer}</td>
              <td className="px-4 py-2.5 text-[0.8125rem] text-muted">{i.number}</td>
              <td className="px-4 py-2.5 text-[0.8125rem] text-muted">{day(i.date)}</td>
              <td className="px-4 py-2.5"><StatusBadge invoice={i} /></td>
              <td className="tnum px-4 py-2.5 text-right text-[0.8125rem] font-medium">
                {eurExact(highlightOverdue ? i.overdueAmount : i.amountGross)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <td className="px-4 py-2.5 text-xs font-semibold text-muted" colSpan={4}>
              Totale ({rows.length})
            </td>
            <td className="tnum px-4 py-2.5 text-right text-[0.8125rem] font-bold">{eurExact(totalCol)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
