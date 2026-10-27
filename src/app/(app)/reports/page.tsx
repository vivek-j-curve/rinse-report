import { connection } from "next/server";
import { FileText, CheckCircle, Clock, AlertTriangle } from "@/components/ui/icons";
import { TypeBadge } from "@/components/ui/badge";
import { getReports } from "@/lib/actions/reports";
import Link from "next/link";

export const instant = false;

type StepStatus = "done" | "partial" | "missing";

type StepCheck = {
  label: string;
  status: StepStatus;
  detail?: string;
};

function countBizDays(from: Date, to: Date): number {
  let count = 0;
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  if (d >= end) return 0;
  while (d < end) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

function getSlaInfo(slaDeadline: string | null | undefined) {
  if (!slaDeadline) return null;
  const now = new Date();
  const deadline = new Date(slaDeadline);
  const dueLabel = deadline.toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
  const isPast = deadline < now;
  const bizDays = isPast ? 0 : countBizDays(now, deadline);
  if (isPast) return { label: "Overdue", due: dueLabel, urgent: true, breached: true };
  if (bizDays === 0) return { label: "Due today", due: dueLabel, urgent: true, breached: false };
  if (bizDays === 1) return { label: "1 biz day left", due: dueLabel, urgent: true, breached: false };
  if (bizDays <= 2) return { label: `${bizDays} biz days left`, due: dueLabel, urgent: true, breached: false };
  return { label: `${bizDays} biz days left`, due: dueLabel, urgent: false, breached: false };
}

function getCompletionSteps(report: Record<string, unknown>): StepCheck[] {
  const type = report.report_type as string;
  const isSAR = type === "SAR";
  const reasonData = report.xml_validation_errors as { reason?: string } | null;
  const persons = (report.report_persons as { id: string }[]) ?? [];
  const entities = (report.report_entities as { id: string }[]) ?? [];
  const transactions = (report.report_transactions as {
    id: string;
    transaction_parties: { id: string; direction: string }[];
  }[]) ?? [];
  const indicators = (report.report_indicators as { indicator_code: string }[]) ?? [];

  const SECTOR_CODES = new Set(["DIA"]);
  const nonSectorIndicators = indicators.filter((i) => !SECTOR_CODES.has(i.indicator_code));
  const hasSupervisor = indicators.some((i) => SECTOR_CODES.has(i.indicator_code));

  const steps: StepCheck[] = [];

  // 1. Reason
  const hasReason = !!(reasonData?.reason?.trim());
  steps.push({
    label: "Reason",
    status: hasReason ? "done" : "missing",
    detail: hasReason ? undefined : "No reason written",
  });

  // 2. Persons / Entities
  const subjectCount = persons.length + entities.length;
  steps.push({
    label: "Subjects",
    status: subjectCount > 0 ? "done" : "missing",
    detail: subjectCount > 0 ? `${subjectCount} added` : "None added",
  });

  // 3. Transactions (not for SAR)
  if (!isSAR) {
    if (transactions.length === 0) {
      steps.push({ label: "Transactions", status: "missing", detail: "None added" });
    } else {
      const allHaveParties = transactions.every(
        (tx) =>
          tx.transaction_parties.some((p) => p.direction === "from") &&
          tx.transaction_parties.some((p) => p.direction === "to")
      );
      const someHaveParties = transactions.some(
        (tx) => tx.transaction_parties.length > 0
      );
      steps.push({
        label: "Transactions",
        status: allHaveParties ? "done" : someHaveParties ? "partial" : "missing",
        detail: allHaveParties
          ? `${transactions.length} with parties`
          : `${transactions.length} — missing parties`,
      });
    }
  }

  // 4. Indicators
  steps.push({
    label: "Indicators",
    status: nonSectorIndicators.length > 0 ? "done" : "missing",
    detail: nonSectorIndicators.length > 0 ? `${nonSectorIndicators.length} selected` : "None selected",
  });

  // 5. Supervisor
  steps.push({
    label: "Supervisor",
    status: hasSupervisor ? "done" : "missing",
    detail: hasSupervisor ? "DIA confirmed" : "Not confirmed",
  });

  return steps;
}

function StepDot({ status, label, detail }: { status: StepStatus; label: string; detail?: string }) {
  const color =
    status === "done"
      ? "bg-green border-green/40"
      : status === "partial"
      ? "bg-amber border-amber/40"
      : "bg-surface-alt border-border";
  const textColor =
    status === "done" ? "text-green" : status === "partial" ? "text-amber" : "text-text-tertiary";

  return (
    <div className="flex flex-col items-center gap-1 group relative">
      <div className={`w-2 h-2 rounded-full border ${color}`} />
      <span className={`text-[10px] font-medium ${textColor} leading-none`}>{label}</span>
      {detail && (
        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-surface border border-border rounded-md px-2 py-1 text-[11px] text-text-secondary whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
          {detail}
        </div>
      )}
    </div>
  );
}

function completionSummary(steps: StepCheck[]) {
  const done = steps.filter((s) => s.status === "done").length;
  const total = steps.length;
  if (done === total) return { label: "Ready to generate", color: "text-green" };
  if (done === 0) return { label: "Not started", color: "text-text-tertiary" };
  return { label: `${done}/${total} steps done`, color: "text-amber" };
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "text-text-secondary" },
  validated: { label: "Validated", className: "text-blue-600" },
  submitted: { label: "Submitted", className: "text-amber" },
  accepted: { label: "Accepted", className: "text-green" },
  rejected: { label: "Rejected", className: "text-red" },
};

export default async function ReportsPage() {
  await connection();
  const { data: reports, error } = await getReports();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-text-secondary text-sm mt-1">
          goAML XML reports — track completion and submission status
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-bg border border-red-border px-4 py-3 text-sm text-red">
          {error}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-alt border border-border flex items-center justify-center mb-4">
            <FileText size={24} className="text-text-tertiary" />
          </div>
          <h3 className="text-[15px] font-semibold mb-1">No reports yet</h3>
          <p className="text-text-secondary text-sm max-w-xs">
            Reports are generated from completed suspicion questionnaires and submitted to the FIU as goAML XML.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const r = report as Record<string, unknown>;
            const caseData = r.cases as { case_number: string; title: string; sla_deadline?: string } | null;
            const statusConfig = STATUS_CONFIG[report.status as string] ?? STATUS_CONFIG.draft;
            const isDraft = report.status === "draft";
            const steps = isDraft ? getCompletionSteps(r) : [];
            const summary = isDraft ? completionSummary(steps) : null;
            const sla = getSlaInfo(caseData?.sla_deadline);
            const href = isDraft ? `/reports/${report.id}/edit` : `/reports/${report.id}`;

            return (
              <div
                key={report.id as string}
                className="bg-surface border border-border rounded-xl p-4 hover:border-border/80 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Left: ref + type + case */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={href}
                        className="font-mono text-[13px] text-accent hover:underline font-semibold"
                      >
                        {report.entity_reference as string}
                      </Link>
                      <TypeBadge type={report.report_type as "STR" | "SAR" | "LCT" | "IFT"} />
                      {(report.submission_code as string) === "R" && (
                        <span className="text-[11px] text-amber font-medium">Amendment</span>
                      )}
                      <span className={`text-[12px] font-medium ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    {caseData && (
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[12px] text-text-tertiary">{caseData.case_number}</span>
                        <span className="text-[13px] text-text-secondary truncate">{caseData.title}</span>
                      </div>
                    )}

                    {/* Completion strip — drafts only */}
                    {isDraft && steps.length > 0 && (
                      <div className="mt-3 flex items-end gap-4">
                        {steps.map((s) => (
                          <StepDot key={s.label} status={s.status} label={s.label} detail={s.detail} />
                        ))}
                        {summary && (
                          <span className={`text-[11px] font-medium ml-1 mb-0.5 ${summary.color}`}>
                            {summary.label}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: action + SLA + meta */}
                  <div className="flex flex-col items-end gap-2.5 shrink-0 min-w-[90px]">
                    {isDraft ? (
                      <Link
                        href={href}
                        className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-accent text-white hover:bg-accent-hover transition-colors"
                      >
                        Edit
                      </Link>
                    ) : (
                      <Link
                        href={href}
                        className="px-3.5 py-1.5 rounded-full text-[12px] font-medium border border-border hover:bg-surface-alt transition-colors"
                      >
                        View
                      </Link>
                    )}
                    {sla && (
                      <div className={`flex items-center gap-1 text-[11.5px] font-medium ${
                        sla.breached ? "text-red" : sla.urgent ? "text-amber" : "text-text-tertiary"
                      }`}>
                        {sla.breached ? <AlertTriangle size={11} /> : <Clock size={11} />}
                        <span>{sla.due ? `Due ${sla.due}` : sla.label}</span>
                      </div>
                    )}
                    <span className="text-[11px] text-text-tertiary tabular-nums">
                      v{report.version as number} · {new Date(report.created_at as string).toLocaleDateString("en-NZ", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
