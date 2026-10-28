import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/get-profile";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Download, User } from "@/components/ui/icons";
import { SlaBadge } from "@/components/ui/badge";
import { LinkSuspicionModal } from "./link-suspicion-modal";
import { getCaseDetail, getCaseActivity, getAvailableSuspicionsForCase } from "@/lib/actions/cases";

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

const AUDIT_LABELS: Record<string, string> = {
  case_created: "Case created",
  case_updated: "Case updated",
  case_assigned: "Case assigned",
  report_created: "Report created",
  report_exported: "Report exported",
  report_filed: "Report filed",
  suspicion_created: "Suspicion added",
  suspicion_updated: "Suspicion updated",
  status_changed: "Status changed",
  attachment_uploaded: "Attachment uploaded",
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
  if (bizDays <= 2) return { status: "urgent" as const, label: `${bizDays} biz day${bizDays === 1 ? "" : "s"} left` };
  return { status: "ok" as const, label: `${bizDays} biz days left` };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseSuspicionDescription(desc: string): { type: string; text: string } {
  if (desc.startsWith("[ACTIVITY] ")) return { type: "Activity", text: desc.slice("[ACTIVITY] ".length) };
  if (desc.startsWith("[TRANSACTION] ")) return { type: "Transaction", text: desc.slice("[TRANSACTION] ".length) };
  if (desc.startsWith("[BOTH] ")) return { type: "Both", text: desc.slice("[BOTH] ".length) };
  return { type: "General", text: desc };
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connection();
  const profile = await getProfile();

  const [{ data: caseRow }, { data: activity }, { data: availableSuspicions }] =
    await Promise.all([
      getCaseDetail(id),
      getCaseActivity(id),
      getAvailableSuspicionsForCase(
        "", // will be set from caseRow below — we fetch after
        id
      ),
    ]);

  if (!caseRow) notFound();

  // Re-fetch available suspicions with the real entity id
  const entity = caseRow.reporting_entity as { name: string; local_currency: string } | null;
  const sla = getSlaInfo(caseRow.sla_deadline);
  const suspicions = (caseRow.suspicions ?? []) as {
    id: string;
    description: string;
    created_at: string;
    raiser?: { full_name: string } | null;
  }[];
  const reports = (caseRow.reports ?? []) as {
    id: string;
    report_type: string;
    status: string;
    entity_reference: string;
    created_at: string;
  }[];
  const attachments = (caseRow.attachments ?? []) as {
    id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    storage_path: string;
    created_at: string;
  }[];
  const creator = caseRow.creator as { full_name: string } | null;
  const assignee = caseRow.assignee as { full_name: string } | null;
  const activityLog = (activity ?? []) as {
    id: string;
    action: string;
    created_at: string;
    metadata: Record<string, unknown> | null;
    actor?: { full_name: string } | null;
  }[];

  const canManage = profile.role === "owner" || profile.role === "admin" || profile.role === "analyst";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back nav */}
      <Link
        href="/cases"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors"
      >
        <ArrowLeft size={15} />
        All cases
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-text-tertiary">{caseRow.case_number}</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_COLORS[caseRow.status] ?? STATUS_COLORS.raised}`}
            >
              {STATUS_LABELS[caseRow.status] ?? caseRow.status}
            </span>
            {sla && <SlaBadge status={sla.status}>{sla.label}</SlaBadge>}
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">{caseRow.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary flex-wrap">
            {entity && <span>{entity.name}</span>}
            <span>Opened {formatDate(caseRow.created_at)}</span>
            {creator && <span>by {creator.full_name}</span>}
            {assignee && (
              <span className="flex items-center gap-1">
                <User size={13} />
                {assignee.full_name}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {reports.length > 0 && (
          <Link
            href={`/reports/${reports[0].id}`}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-surface-alt transition-colors"
          >
            <FileText size={15} />
            View report
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Suspicions */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-[13px] font-semibold">
                Suspicions
                <span className="ml-2 text-text-tertiary font-normal">{suspicions.length}</span>
              </h2>
              {canManage && (
                <LinkSuspicionModal caseId={id} reportingEntityId={caseRow.reporting_entity_id} />
              )}
            </div>
            {suspicions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-text-tertiary">
                No suspicions linked to this case.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {suspicions.map((s) => {
                  const parsed = parseSuspicionDescription(s.description);
                  return (
                    <div key={s.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold bg-surface-alt border border-border text-text-secondary tracking-wide">
                              {parsed.type}
                            </span>
                            {s.raiser && (
                              <span className="text-[11px] text-text-tertiary">
                                Raised by {s.raiser.full_name}
                              </span>
                            )}
                            <span className="text-[11px] text-text-tertiary">
                              {formatDate(s.created_at)}
                            </span>
                          </div>
                          <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-3">
                            {parsed.text}
                          </p>
                        </div>
                        <Link
                          href={`/suspicions/${id}`}
                          className="flex-shrink-0 text-[12px] text-accent hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reports */}
          {reports.length > 0 && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-[13px] font-semibold">
                  Reports
                  <span className="ml-2 text-text-tertiary font-normal">{reports.length}</span>
                </h2>
              </div>
              <div className="divide-y divide-border">
                {reports.map((r) => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <FileText size={15} className="text-accent" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold bg-surface-alt border border-border text-text-secondary tracking-wide">
                            {r.report_type}
                          </span>
                          <span className="text-[13px] font-medium font-mono text-text-secondary">
                            {r.entity_reference}
                          </span>
                        </div>
                        <div className="text-[11px] text-text-tertiary mt-0.5">
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)} · {formatDate(r.created_at)}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/reports/${r.id}`}
                      className="text-[12px] text-accent hover:underline"
                    >
                      Open →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="text-[13px] font-semibold">
                  Attachments
                  <span className="ml-2 text-text-tertiary font-normal">{attachments.length}</span>
                </h2>
              </div>
              <div className="divide-y divide-border">
                {attachments.map((a) => (
                  <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-alt border border-border flex items-center justify-center flex-shrink-0">
                      <Download size={14} className="text-text-tertiary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate">{a.file_name}</div>
                      <div className="text-[11px] text-text-tertiary">
                        {formatBytes(a.file_size)} · {formatDate(a.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activity timeline */}
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-[13px] font-semibold">Activity</h2>
            </div>
            {activityLog.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-text-tertiary">
                No activity recorded yet.
              </div>
            ) : (
              <div className="px-4 py-3 space-y-4">
                {activityLog.map((entry, i) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-border-strong mt-1.5 flex-shrink-0" />
                      {i < activityLog.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-2 min-w-0">
                      <div className="text-[12px] font-medium text-text">
                        {AUDIT_LABELS[entry.action] ?? entry.action.replace(/_/g, " ")}
                      </div>
                      <div className="text-[11px] text-text-tertiary mt-0.5">
                        {entry.actor?.full_name ?? "System"}
                        {" · "}
                        {formatDateTime(entry.created_at)}
                      </div>
                      {entry.metadata && typeof entry.metadata === "object" && "note" in entry.metadata && (
                        <div className="mt-1 text-[12px] text-text-secondary italic">
                          {String(entry.metadata.note)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Case meta */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-[13px] font-semibold">Details</h2>
            </div>
            <div className="px-4 py-3 space-y-2.5 text-[13px]">
              <div className="flex justify-between gap-2">
                <span className="text-text-tertiary">Priority</span>
                <span className="font-medium capitalize">{caseRow.priority}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-text-tertiary">Suspicion formed</span>
                <span>{formatDate(caseRow.suspicion_formed_at)}</span>
              </div>
              {caseRow.sla_deadline && (
                <div className="flex justify-between gap-2">
                  <span className="text-text-tertiary">SLA deadline</span>
                  <span className={sla?.status === "breached" ? "text-red font-medium" : ""}>
                    {formatDate(caseRow.sla_deadline)}
                  </span>
                </div>
              )}
              {caseRow.filed_at && (
                <div className="flex justify-between gap-2">
                  <span className="text-text-tertiary">Filed</span>
                  <span>{formatDate(caseRow.filed_at)}</span>
                </div>
              )}
              {caseRow.resolved_at && (
                <div className="flex justify-between gap-2">
                  <span className="text-text-tertiary">Resolved</span>
                  <span>{formatDate(caseRow.resolved_at)}</span>
                </div>
              )}
            </div>
            {caseRow.resolution_notes && (
              <div className="px-4 pb-3">
                <div className="text-[11px] text-text-tertiary mb-1 font-medium uppercase tracking-wide">
                  Resolution notes
                </div>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  {caseRow.resolution_notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
