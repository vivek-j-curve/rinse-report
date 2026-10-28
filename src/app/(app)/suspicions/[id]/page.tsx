import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/get-profile";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@/components/ui/icons";
import { SlaBadge } from "@/components/ui/badge";
import Link from "next/link";
import { StatusUpdater } from "./status-updater";
import { QuestionnaireWizard } from "./questionnaire-wizard";
import { GenerateReportButton } from "./generate-report-button";
import { AttachmentsPanel } from "./attachments-panel";
import { MoveToCaseModal } from "./move-to-case-modal";

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

function getSlaInfo(slaDeadline: string | null): {
  status: "breached" | "urgent" | "ok";
  label: string;
} {
  if (!slaDeadline) return { status: "ok", label: "No deadline" };
  const now = new Date();
  const deadline = new Date(slaDeadline);
  if (deadline < now) return { status: "breached", label: "Overdue" };
  const bizDays = countBizDays(now, deadline);
  if (bizDays === 0) return { status: "urgent", label: "Due today" };
  if (bizDays === 1) return { status: "urgent", label: "1 biz day left" };
  if (bizDays <= 2) return { status: "urgent", label: `${bizDays} biz days left` };
  return { status: "ok", label: `${bizDays} biz days left` };
}

export const instant = false;

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connection();
  await getProfile();
  const supabase = await createClient();

  const { data: caseRow } = await supabase
    .from("cases")
    .select(
      `
      *,
      reporting_entity:reporting_entities(name),
      suspicions(*),
      questionnaire_responses(*),
      attachments(*),
      creator:profiles!cases_created_by_fkey(full_name)
    `
    )
    .eq("id", id)
    .single();

  if (!caseRow) notFound();

  const sla = getSlaInfo(caseRow.sla_deadline);
  const suspicion = caseRow.suspicions?.[0];

  function parseSuspicionDescription(desc: string) {
    let type: "activity" | "transaction" = "transaction";
    let rest = desc;
    if (desc.startsWith("[ACTIVITY] ")) {
      type = "activity";
      rest = desc.slice("[ACTIVITY] ".length);
    } else if (desc.startsWith("[TRANSACTION] ")) {
      type = "transaction";
      rest = desc.slice("[TRANSACTION] ".length);
    }
    const partiesMarker = "\n\n[PARTIES] ";
    const partiesIdx = rest.indexOf(partiesMarker);
    if (partiesIdx !== -1) {
      return { type, text: rest.slice(0, partiesIdx), parties: rest.slice(partiesIdx + partiesMarker.length) };
    }
    return { type, text: rest, parties: null };
  }

  const parsed = suspicion ? parseSuspicionDescription(suspicion.description) : null;

  const qrResponses = (caseRow.questionnaire_responses ?? []).map((qr) => ({
    id: qr.id,
    report_type: qr.report_type,
    current_step: qr.current_step,
    total_steps: qr.total_steps,
    responses: qr.responses as Record<string, unknown>,
    status: qr.status,
  }));

  const isSAR = parsed?.type === "activity";
  const firstQr = qrResponses[0] ?? null;

  return (
    <>
      <div className="mb-6">
        <Link
          href="/suspicions"
          className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text mb-3"
        >
          <ArrowLeft size={14} />
          Back to suspicions
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[13px] text-text-tertiary">
                {caseRow.case_number}
              </span>
              <SlaBadge status={sla.status}>{sla.label}</SlaBadge>
            </div>
            <h1 className="text-[28px] font-bold tracking-tight">
              {caseRow.title}
            </h1>
            <p className="text-text-secondary text-[13.5px] mt-0.5">
              Raised by {caseRow.creator?.full_name ?? "Unknown"} ·{" "}
              {caseRow.reporting_entity?.name ?? "Unknown entity"}
            </p>
          </div>
          <StatusUpdater caseId={caseRow.id} currentStatus={caseRow.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <QuestionnaireWizard
            caseId={caseRow.id}
            organisationId={caseRow.organisation_id}
            isSAR={isSAR}
            existing={firstQr}
          />

          {qrResponses.some((qr) => qr.status === "complete") && (
            <GenerateReportButton
              caseId={caseRow.id}
              suspicionType={parsed?.type ?? "transaction"}
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-[10px] p-5">
            <h2 className="text-sm font-semibold mb-3">Case Info</h2>

            <dl className="space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-text-secondary">Status</dt>
                <dd className="font-medium capitalize">
                  {caseRow.status.replace("_", " ")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Priority</dt>
                <dd className="font-medium capitalize">{caseRow.priority}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Created</dt>
                <dd>
                  {new Date(caseRow.created_at).toLocaleDateString("en-NZ", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Entity</dt>
                <dd>{caseRow.reporting_entity?.name ?? "-"}</dd>
              </div>
            </dl>

            <Link
              href={`/cases/${caseRow.id}`}
              className="block w-full mt-3 px-3 py-2 rounded-lg border border-border text-[12px] font-medium text-text-secondary hover:bg-surface-alt transition-colors text-center"
            >
              View case details
            </Link>

            {suspicion && (
              <MoveToCaseModal
                suspicionId={suspicion.id}
                currentCaseId={caseRow.id}
                reportingEntityId={caseRow.reporting_entity_id}
              />
            )}
          </div>

          <div className="bg-surface border border-border rounded-[10px] p-5">
            <h2 className="text-sm font-semibold mb-3">Suspicion Details</h2>
            {suspicion && parsed ? (
              <div className="space-y-3 text-[13px]">
                <span
                  className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    parsed.type === "activity"
                      ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
                      : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                  }`}
                >
                  {parsed.type === "activity" ? "Activity (SAR)" : "Transaction (STR)"}
                </span>
                <p className="text-[13px] leading-relaxed">{parsed.text}</p>
                {parsed.parties && (
                  <div>
                    <span className="text-text-secondary text-[11.5px] uppercase tracking-wider font-medium">Key Parties</span>
                    <p className="mt-1 text-[13px]">{parsed.parties}</p>
                  </div>
                )}
                <div className="flex gap-4 pt-1">
                  <div>
                    <span className="text-text-secondary text-[11.5px] uppercase tracking-wider font-medium">Formed</span>
                    <p className="mt-0.5 text-[12.5px]">
                      {new Date(caseRow.suspicion_formed_at).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div>
                    <span className="text-text-secondary text-[11.5px] uppercase tracking-wider font-medium">SLA</span>
                    <p className="mt-0.5 text-[12.5px]">
                      {new Date(caseRow.sla_deadline).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-text-secondary text-[13px]">No suspicion details recorded.</p>
            )}
          </div>

          <div className="bg-surface border border-border rounded-[10px] p-5">
            <h2 className="text-sm font-semibold mb-3">Timeline</h2>
            <div className="space-y-3">
              <div className="flex gap-3 text-[13px]">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium">Suspicion raised</p>
                  <p className="text-text-tertiary text-[12px]">
                    {new Date(caseRow.created_at).toLocaleDateString("en-NZ", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <AttachmentsPanel
            caseId={caseRow.id}
            organisationId={caseRow.organisation_id}
            attachments={(caseRow.attachments ?? []).map((a) => ({
              id: a.id,
              file_name: a.file_name,
              file_type: a.file_type,
              file_size: a.file_size,
              storage_path: a.storage_path,
              created_at: a.created_at,
            }))}
          />
        </div>
      </div>
    </>
  );
}
