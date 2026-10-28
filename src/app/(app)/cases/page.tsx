import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/get-profile";
import { SlaBadge } from "@/components/ui/badge";
import { Folder } from "@/components/ui/icons";
import Link from "next/link";

export const instant = false;

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  raised: "Raised",
  investigating: "Investigating",
  to_file: "To File",
  filed: "Filed",
  resolved: "Resolved",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-border/60 text-text-secondary border-border",
  raised: "bg-accent/10 text-accent border-accent/20",
  investigating: "bg-amber/10 text-amber border-amber/20",
  to_file: "bg-purple/10 text-purple border-purple/20",
  filed: "bg-green/10 text-green border-green/20",
  resolved: "bg-border/60 text-text-secondary border-border",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-text-tertiary",
  medium: "text-text-secondary",
  high: "text-amber",
  critical: "text-red font-semibold",
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

function getSlaInfo(slaDeadline: string | null) {
  if (!slaDeadline) return null;
  const now = new Date();
  const deadline = new Date(slaDeadline);
  if (deadline < now) return { status: "breached" as const, label: "Overdue" };
  const bizDays = countBizDays(now, deadline);
  if (bizDays === 0) return { status: "urgent" as const, label: "Due today" };
  if (bizDays <= 2) return { status: "urgent" as const, label: `${bizDays}d left` };
  return { status: "ok" as const, label: `${bizDays}d left` };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CasesPage() {
  await connection();
  const profile = await getProfile();
  const supabase = await createClient();

  const { data: cases } = await supabase
    .from("cases")
    .select(
      `
      id, case_number, title, status, priority, sla_deadline, created_at, suspicion_formed_at,
      reporting_entity:reporting_entities(name),
      suspicions(id),
      reports(id, report_type),
      assignee:profiles!cases_assigned_to_fkey(full_name),
      creator:profiles!cases_created_by_fkey(full_name)
    `
    )
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  const rows = cases ?? [];

  const openCount = rows.filter(
    (c) => !["resolved", "filed"].includes(c.status)
  ).length;
  const breachedCount = rows.filter((c) => {
    const sla = getSlaInfo(c.sla_deadline);
    return sla?.status === "breached";
  }).length;
  const urgentCount = rows.filter((c) => {
    const sla = getSlaInfo(c.sla_deadline);
    return sla?.status === "urgent";
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Cases</h1>
          <p className="text-text-secondary text-sm mt-1">
            {rows.length} total · {openCount} open
            {breachedCount > 0 && (
              <span className="text-red ml-1">· {breachedCount} overdue</span>
            )}
            {urgentCount > 0 && (
              <span className="text-amber ml-1">· {urgentCount} urgent</span>
            )}
          </p>
        </div>
        <Link
          href="/suspicions/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          New case
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-alt border border-border flex items-center justify-center mb-4">
            <Folder size={24} className="text-text-tertiary" />
          </div>
          <h3 className="text-[15px] font-semibold mb-1">No cases yet</h3>
          <p className="text-text-secondary text-sm max-w-xs">
            Cases are created whenever a new suspicion is raised.
          </p>
          <Link
            href="/suspicions/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-surface-alt transition-colors"
          >
            Raise a suspicion
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-alt/50">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">
                  Case
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">
                  SLA
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">
                  Entity
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">
                  Suspicions
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">
                  Reports
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">
                  Priority
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">
                  Assigned
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-text-tertiary uppercase tracking-wide">
                  Opened
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((c) => {
                const sla = getSlaInfo(c.sla_deadline);
                const entity = c.reporting_entity as { name: string } | null;
                const suspicionCount = Array.isArray(c.suspicions) ? c.suspicions.length : 0;
                const reportList = Array.isArray(c.reports) ? c.reports as { id: string; report_type: string }[] : [];
                const assignee = c.assignee as { full_name: string } | null;
                const reportTypes = [...new Set(reportList.map((r) => r.report_type))];

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-surface-alt/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/cases/${c.id}`}
                        className="group"
                      >
                        <div className="font-medium text-[13px] text-text group-hover:text-accent transition-colors">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-text-tertiary mt-0.5 font-mono">
                          {c.case_number}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_COLORS[c.status] ?? STATUS_COLORS.raised}`}
                      >
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sla ? (
                        <SlaBadge status={sla.status}>{sla.label}</SlaBadge>
                      ) : (
                        <span className="text-text-tertiary text-[12px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary">
                      {entity?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary text-center">
                      {suspicionCount}
                    </td>
                    <td className="px-4 py-3">
                      {reportTypes.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {reportTypes.map((rt) => (
                            <span
                              key={rt}
                              className="inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold bg-surface-alt border border-border text-text-secondary tracking-wide"
                            >
                              {rt}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-text-tertiary text-[12px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[12px] font-medium ${PRIORITY_COLORS[c.priority] ?? ""}`}
                      >
                        {PRIORITY_LABELS[c.priority] ?? c.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary">
                      {assignee?.full_name ?? (
                        <span className="text-text-tertiary">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-text-tertiary whitespace-nowrap">
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
