import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TypeBadge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight } from "@/components/ui/icons";
import { getReport, getReportAmendmentChain } from "@/lib/actions/reports";
import { AmendButton } from "./amend-button";

export const instant = false;

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  draft: { label: "Draft", className: "text-text-secondary", dot: "bg-border" },
  validated: { label: "Validated", className: "text-blue-600", dot: "bg-blue-500" },
  submitted: { label: "Submitted", className: "text-amber", dot: "bg-amber" },
  accepted: { label: "Accepted", className: "text-green", dot: "bg-green" },
  rejected: { label: "Rejected", className: "text-red", dot: "bg-red" },
};

function formatDate(s: string | null | undefined) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" });
}

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-NZ", { minimumFractionDigits: 2 })}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-[11px] font-semibold tracking-widest text-text-tertiary uppercase">{title}</h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      {children}
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-4 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-[12px] text-text-tertiary w-40 shrink-0">{label}</span>
      <span className="text-[12px] text-text-primary flex-1">{value}</span>
    </div>
  );
}

export default async function ReportViewPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id: reportId } = await params;

  const [reportRes, chainRes] = await Promise.all([
    getReport(reportId),
    getReportAmendmentChain(reportId),
  ]);

  if ("error" in reportRes && reportRes.error) {
    return (
      <div className="space-y-4">
        <Link href="/reports" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
          <ArrowLeft size={14} /> Reports
        </Link>
        <div className="rounded-lg bg-red-bg border border-red-border px-4 py-3 text-sm text-red">
          {reportRes.error}
        </div>
      </div>
    );
  }

  if (!reportRes.data) return notFound();

  const { report: r, persons, entities, transactions, indicators, accounts } = reportRes.data;

  // Draft reports belong in the edit page
  if (r.status === "draft") {
    redirect(`/reports/${reportId}/edit`);
  }

  const chain = chainRes.data ?? [];
  const caseData = r.cases as { case_number: string; title: string; sla_deadline?: string | null; reporting_entities?: { name: string; rentity_id: string; local_currency: string; compliance_officer_name: string } | null } | null;
  const reportingEntity = caseData?.reporting_entities;
  const statusConfig = STATUS_CONFIG[r.status as string] ?? STATUS_CONFIG.draft;
  const reasonData = r.xml_validation_errors as { reason?: string; action?: string } | null;
  const goamlConfId = r.goaml_confirmation_id as string | null;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Back nav + Amend button */}
      <div className="flex items-center justify-between">
        <Link href="/reports" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft size={14} /> Reports
        </Link>
        <AmendButton reportId={reportId} />
      </div>

      {/* Header card */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-lg font-semibold">{r.entity_reference as string}</span>
              <TypeBadge type={r.report_type as "STR" | "SAR" | "LCT" | "IFT"} />
              {(r.submission_code as string) === "R" && (
                <span className="text-[11px] text-amber font-medium bg-amber/10 px-2 py-0.5 rounded-full">Amendment</span>
              )}
            </div>
            {caseData && (
              <p className="text-sm text-text-secondary">
                <span className="font-mono text-text-tertiary">{caseData.case_number}</span>
                {" · "}
                {caseData.title}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
            <span className={`text-[13px] font-semibold ${statusConfig.className}`}>{statusConfig.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-0.5 border-t border-border pt-4">
          <KV label="Version" value={`v${r.version as number}`} />
          <KV label="Submission mode" value={(r.submission_code as string) === "E" ? "Electronic" : "Manual"} />
          <KV label="Submitted" value={formatDate(r.submitted_at as string | null)} />
          {goamlConfId && <KV label="goAML confirmation" value={<span className="font-mono">{goamlConfId}</span>} />}
          {caseData?.sla_deadline && <KV label="SLA deadline" value={formatDate(caseData.sla_deadline)} />}
        </div>
      </div>

      {/* Reporting entity */}
      {reportingEntity && (
        <Section title="Reporting Entity">
          <div className="bg-surface border border-border rounded-xl p-4 space-y-0">
            <KV label="Entity ID" value={reportingEntity.rentity_id} />
            <KV label="Name" value={reportingEntity.name} />
            <KV label="Local currency" value={reportingEntity.local_currency} />
            <KV label="Compliance officer" value={reportingEntity.compliance_officer_name} />
          </div>
        </Section>
      )}

      {/* Reason + Action */}
      {reasonData?.reason && (
        <Section title="Reason for Suspicion">
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">{reasonData.reason}</p>
          </div>
        </Section>
      )}

      {reasonData?.action && (
        <Section title="Action Taken">
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">{reasonData.action}</p>
          </div>
        </Section>
      )}

      {/* Persons */}
      {persons.length > 0 && (
        <Section title={`Persons (${persons.length})`}>
          <div className="space-y-2">
            {persons.map((p, i) => {
              const name = [p.title, p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ");
              return (
                <div key={p.id} className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[11px] text-text-tertiary font-mono">{i + 1}</span>
                    <span className="text-[14px] font-semibold">{name}</span>
                    <span className="text-[11px] text-text-tertiary bg-surface-alt px-2 py-0.5 rounded-full">
                      {p.role?.replace(/_/g, " ")}
                    </span>
                    {p.is_my_client && (
                      <span className="text-[11px] text-green bg-green/10 px-2 py-0.5 rounded-full">My client</span>
                    )}
                  </div>
                  <div>
                    <KV label="Date of birth" value={formatDate(p.birthdate)} />
                    <KV label="Nationality" value={p.nationality} />
                    <KV label="Residence" value={p.residence} />
                    <KV label="Occupation" value={p.occupation} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Entities */}
      {entities.length > 0 && (
        <Section title={`Entities (${entities.length})`}>
          <div className="space-y-2">
            {entities.map((e, i) => (
              <div key={e.id} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[11px] text-text-tertiary font-mono">{i + 1}</span>
                  <span className="text-[14px] font-semibold">{e.name}</span>
                  {e.commercial_name && <span className="text-[12px] text-text-secondary">t/a {e.commercial_name}</span>}
                  <span className="text-[11px] text-text-tertiary bg-surface-alt px-2 py-0.5 rounded-full">
                    {e.role?.replace(/_/g, " ")}
                  </span>
                  {e.is_my_client && (
                    <span className="text-[11px] text-green bg-green/10 px-2 py-0.5 rounded-full">My client</span>
                  )}
                </div>
                <div>
                  <KV label="Incorporation country" value={e.incorporation_country} />
                  <KV label="Business type" value={e.business_type} />
                  <KV label="Reg. number" value={e.incorporation_number} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Accounts */}
      {accounts.length > 0 && (
        <Section title={`Accounts (${accounts.length})`}>
          <div className="space-y-2">
            {accounts.map((acct, i) => (
              <div key={acct.id} className="bg-surface border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] text-text-tertiary font-mono">{i + 1}</span>
                  <span className="text-[14px] font-semibold font-mono">{acct.account_number}</span>
                  {acct.is_my_client && (
                    <span className="text-[11px] text-green bg-green/10 px-2 py-0.5 rounded-full">My client</span>
                  )}
                </div>
                <div>
                  <KV label="Institution" value={acct.institution_name} />
                  <KV label="Branch" value={acct.branch} />
                  <KV label="Currency" value={acct.currency_code} />
                  <KV label="Balance" value={acct.balance != null ? formatMoney(acct.balance, acct.currency_code ?? "NZD") : null} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Transactions */}
      {transactions.length > 0 && (
        <Section title={`Transactions (${transactions.length})`}>
          <div className="space-y-2">
            {transactions.map((tx, i) => {
              const parties = (tx.transaction_parties ?? []) as { direction: string; party_type: string }[];
              const fromCount = parties.filter((p) => p.direction === "from").length;
              const toCount = parties.filter((p) => p.direction === "to").length;
              return (
                <div key={tx.id} className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] text-text-tertiary font-mono">{i + 1}</span>
                    <span className="text-[13px] font-semibold font-mono">{tx.transaction_number}</span>
                    <span className="text-[11px] text-text-tertiary">{tx.transmode_code}</span>
                  </div>
                  <div>
                    <KV label="Date" value={formatDate(tx.date_transaction)} />
                    <KV label="Amount" value={formatMoney(tx.amount_local, tx.currency_code_local)} />
                    {tx.amount_foreign != null && tx.currency_code_foreign && (
                      <KV label="Foreign amount" value={formatMoney(tx.amount_foreign, tx.currency_code_foreign)} />
                    )}
                    <KV label="Location" value={tx.transaction_location} />
                    {(fromCount > 0 || toCount > 0) && (
                      <KV label="Parties" value={`${fromCount} sender(s) → ${toCount} recipient(s)`} />
                    )}
                    <KV label="Description" value={tx.transaction_description} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Indicators */}
      {indicators.length > 0 && (
        <Section title={`Suspicion Indicators (${indicators.length})`}>
          <div className="flex flex-wrap gap-2">
            {indicators.map((ind) => (
              <span
                key={ind.id}
                className="px-3 py-1.5 bg-surface border border-border rounded-full text-[12px] font-mono text-text-primary"
              >
                {ind.indicator_code}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Amendment chain */}
      {chain.length > 1 && (
        <Section title="Version History">
          <div className="space-y-1">
            {chain.map((item) => {
              const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;
              const isCurrent = item.id === reportId;
              return (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isCurrent ? "border-accent/30 bg-accent/5" : "border-border bg-surface"}`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[12px] font-semibold">{item.entity_reference}</span>
                      <span className={`text-[11px] font-medium ${sc.className}`}>{sc.label}</span>
                      {item.submission_code === "R" && (
                        <span className="text-[10px] text-amber font-medium">Amendment</span>
                      )}
                      {isCurrent && <span className="text-[10px] text-accent font-medium">(viewing)</span>}
                    </div>
                    <p className="text-[11px] text-text-tertiary">
                      v{item.version} · {item.submitted_at ? `Submitted ${formatDate(item.submitted_at)}` : `Created ${formatDate(item.created_at)}`}
                    </p>
                  </div>
                  {!isCurrent && (
                    <Link
                      href={item.status === "draft" ? `/reports/${item.id}/edit` : `/reports/${item.id}`}
                      className="text-[11px] text-accent hover:underline flex items-center gap-0.5"
                    >
                      View <ChevronRight size={12} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}
