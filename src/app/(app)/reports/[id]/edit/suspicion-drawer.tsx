"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ExternalLink } from "@/components/ui/icons";
import { COUNTRY_CODE_TO_NAME } from "@/components/ui/country-select";

const ID_TYPE_LABELS: Record<string, string> = {
  P: "Passport",
  D: "Driver's Licence",
  I: "National ID",
  O: "Other",
};

function fmtCountry(code: string | undefined) {
  if (!code) return undefined;
  return COUNTRY_CODE_TO_NAME[code] ?? code;
}

type SuspicionData = {
  description: string;
  source: string | null;
  created_at: string;
} | null;

type CaseData = {
  case_number: string;
  title: string;
  sla_deadline: string;
  suspicion_formed_at: string;
  priority: string;
  status: string;
};

type Answers = Record<string, string | undefined>;

function parseSuspicion(desc: string) {
  let type: "activity" | "transaction" = "transaction";
  let rest = desc;
  if (desc.startsWith("[ACTIVITY] ")) {
    type = "activity";
    rest = desc.slice("[ACTIVITY] ".length);
  } else if (desc.startsWith("[TRANSACTION] ")) {
    type = "transaction";
    rest = desc.slice("[TRANSACTION] ".length);
  }
  const marker = "\n\n[PARTIES] ";
  const idx = rest.indexOf(marker);
  if (idx !== -1) return { type, text: rest.slice(0, idx), parties: rest.slice(idx + marker.length) };
  return { type, text: rest, parties: null };
}

function fmtDate(iso: string | undefined | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" });
}

function fmtAmount(amount: string | undefined, currency?: string | undefined) {
  if (!amount) return null;
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return `${num.toLocaleString("en-NZ", { minimumFractionDigits: 2 })} ${currency ?? "NZD"}`;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-[12.5px]">
      <span className="text-text-tertiary shrink-0 w-[120px]">{label}</span>
      <span className="text-text flex-1 break-words">{value}</span>
    </div>
  );
}

function Group({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-2.5 text-left hover:bg-surface-alt/50 transition-colors"
      >
        <span className="text-[12px] font-semibold uppercase tracking-wide text-text-tertiary">{title}</span>
        <ChevronDown
          size={13}
          className={`text-text-tertiary transition-transform shrink-0 ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && <div className="px-4 pb-3 space-y-1.5">{children}</div>}
    </div>
  );
}

export function SuspicionDrawer({
  caseId,
  caseData,
  suspicion,
  questionnaireSubject,
}: {
  caseId: string;
  caseData?: CaseData;
  suspicion: SuspicionData;
  questionnaireSubject: unknown;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!caseData) return null;

  const answers = (questionnaireSubject ?? {}) as Answers;
  const parsed = suspicion ? parseSuspicion(suspicion.description) : null;

  const isSAR = parsed?.type === "activity" || answers.report_type === "SAR";
  const reportType = (answers.report_type as string) || (isSAR ? "SAR" : "STR");

  // Computed display helpers
  const subjectName = [answers.first_names, answers.last_name].filter(Boolean).join(" ");
  const hasPerson = !!(answers.first_names || answers.last_name || answers.date_of_birth || answers.nationality);
  const hasEntity = !!(answers.entity_name);
  const hasTx = !!(answers.transaction_date || answers.transaction_amount);
  const hasLct = !!(answers.lct_amount || answers.lct_date);
  const hasIft = !!(answers.ift_date || answers.ift_amount_local);
  const hasIftParties = !!(answers.sender_name || answers.receiver_name);

  // SLA countdown
  function slaLabel() {
    if (!caseData?.sla_deadline) return null;
    const diff = Math.ceil((new Date(caseData.sla_deadline).getTime() - Date.now()) / 86400000);
    if (diff < 0) return `Breached ${Math.abs(diff)}d ago`;
    if (diff === 0) return "Due today";
    return `${diff} day${diff !== 1 ? "s" : ""} left`;
  }

  const idParts = [ID_TYPE_LABELS[answers.id_type as string] ?? answers.id_type, answers.id_number, fmtCountry(answers.id_country as string)].filter(Boolean).join(" · ");
  const addressParts = [answers.address, answers.city, fmtCountry(answers.country as string)].filter(Boolean).join(", ");
  const entityAddressParts = [answers.entity_address, answers.entity_city, fmtCountry(answers.entity_country as string)].filter(Boolean).join(", ");

  const drawer = (
    <div className="fixed bottom-0 right-4 z-50" style={{ width: 360 }}>
      {/* Expanded panel */}
      {open && (
        <div
          className="w-full bg-surface border border-b-0 border-border rounded-t-[12px] shadow-2xl flex flex-col"
          style={{ maxHeight: "min(560px, calc(100vh - 100px))" }}
        >
          {/* Panel header — click to collapse */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-surface-alt border-b border-border rounded-t-[12px] cursor-pointer select-none shrink-0"
            onClick={() => setOpen(false)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                  isSAR ? "bg-purple-400" : "bg-blue-400"
                }`}
              />
              <span className="text-[11px] font-mono text-text-tertiary shrink-0">{caseData.case_number}</span>
              <span className="text-[13px] font-semibold truncate">{caseData.title}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <a
                href={`/suspicions/${caseId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded hover:bg-surface transition-colors text-text-tertiary hover:text-text"
                title="Open suspicion in new tab"
              >
                <ExternalLink size={13} />
              </a>
              <div className="p-1 text-text-tertiary">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1">
            {/* Suspicion */}
            <Group title="Suspicion" defaultOpen={true}>
              {parsed && (
                <>
                  <div className="mb-2">
                    <span
                      className={`inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${
                        parsed.type === "activity"
                          ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
                          : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                      }`}
                    >
                      {parsed.type === "activity" ? "Activity (SAR)" : "Transaction (STR)"}
                    </span>
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-text whitespace-pre-wrap">{parsed.text}</p>
                  {parsed.parties && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide mb-1">Key Parties</p>
                      <p className="text-[12.5px] leading-relaxed">{parsed.parties}</p>
                    </div>
                  )}
                </>
              )}
              {answers.narrative && (
                <p className="text-[12.5px] leading-relaxed text-text whitespace-pre-wrap">{answers.narrative}</p>
              )}
              {answers.action_taken && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wide mb-1">Action Taken</p>
                  <p className="text-[12.5px] leading-relaxed text-text whitespace-pre-wrap">{answers.action_taken}</p>
                </div>
              )}
              {!parsed && !answers.narrative && (
                <p className="text-[12px] text-text-tertiary">No description recorded.</p>
              )}
            </Group>

            {/* Person subject */}
            {hasPerson && (
              <Group title="Person" defaultOpen={true}>
                {subjectName && <Row label="Name" value={subjectName} />}
                <Row label="Date of birth" value={fmtDate(answers.date_of_birth)} />
                <Row label="Nationality" value={answers.nationality} />
                <Row label="Occupation" value={answers.occupation} />
                {idParts && <Row label="Identity" value={idParts} />}
                {addressParts && <Row label="Address" value={addressParts} />}
                <Row label="Is customer" value={answers.is_customer === "yes" ? "Yes" : answers.is_customer === "no" ? "No" : undefined} />
              </Group>
            )}

            {/* Entity subject */}
            {hasEntity && (
              <Group title="Entity" defaultOpen={true}>
                <Row label="Name" value={answers.entity_name} />
                <Row label="Type" value={answers.entity_type} />
                <Row label="Reg. number" value={answers.registration_number} />
                {entityAddressParts && <Row label="Address" value={entityAddressParts} />}
              </Group>
            )}

            {/* STR transaction */}
            {hasTx && (
              <Group title="Transaction" defaultOpen={true}>
                <Row label="Date" value={fmtDate(answers.transaction_date)} />
                <Row label="Amount" value={fmtAmount(answers.transaction_amount, answers.transaction_currency)} />
                <Row label="Mode" value={answers.transmode_code} />
                <Row label="From account" value={answers.originating_account} />
                <Row label="To account" value={answers.beneficiary_account} />
                <Row label="Description" value={answers.transaction_description} />
              </Group>
            )}

            {/* LCT */}
            {hasLct && (
              <Group title="Cash Transaction" defaultOpen={true}>
                <Row label="Date" value={fmtDate(answers.lct_date)} />
                <Row label="Amount" value={fmtAmount(answers.lct_amount, answers.lct_currency)} />
                <Row label="Direction" value={answers.lct_direction} />
              </Group>
            )}

            {/* IFT */}
            {hasIft && (
              <Group title="International Transfer" defaultOpen={true}>
                <Row label="Date" value={fmtDate(answers.ift_date)} />
                <Row label="Local amount" value={fmtAmount(answers.ift_amount_local, "NZD")} />
                <Row label="Foreign amount" value={fmtAmount(answers.ift_amount_foreign, answers.ift_currency_foreign)} />
                <Row label="Direction" value={answers.ift_direction} />
              </Group>
            )}

            {/* IFT sender / receiver */}
            {hasIftParties && (
              <Group title="Transfer Parties">
                <Row label="Sender" value={answers.sender_name} />
                <Row label="Sender country" value={answers.sender_country} />
                <Row label="Sender account" value={answers.sender_account} />
                <Row label="Sender institution" value={answers.sender_institution} />
                <Row label="Receiver" value={answers.receiver_name} />
                <Row label="Receiver country" value={answers.receiver_country} />
                <Row label="Receiver account" value={answers.receiver_account} />
              </Group>
            )}

            {/* Conductor */}
            {answers.conductor_name && (
              <Group title="Conductor">
                <Row label="Name" value={answers.conductor_name} />
                <Row label="ID type" value={answers.conductor_id_type} />
                <Row label="ID number" value={answers.conductor_id_number} />
              </Group>
            )}

            {/* Case info */}
            <Group title="Case">
              <Row label="Status" value={caseData.status?.replace(/_/g, " ")} />
              <Row label="Priority" value={caseData.priority} />
              <Row label="Report type" value={reportType} />
              <Row label="Formed" value={fmtDate(caseData.suspicion_formed_at)} />
              <Row label="SLA deadline" value={`${fmtDate(caseData.sla_deadline)}${slaLabel() ? ` (${slaLabel()})` : ""}`} />
            </Group>
          </div>
        </div>
      )}

      {/* Collapsed tab */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-surface border border-b-0 border-border rounded-t-[10px] shadow-lg hover:bg-surface-alt transition-colors w-full"
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${isSAR ? "bg-purple-400" : "bg-blue-400"}`}
          />
          <span className="text-[11px] font-mono text-text-tertiary shrink-0">{caseData.case_number}</span>
          <span className="text-[13px] font-semibold truncate flex-1 text-left">{caseData.title}</span>
          <ChevronDown size={13} className="text-text-tertiary -rotate-180 shrink-0" />
        </button>
      )}
    </div>
  );

  return mounted ? createPortal(drawer, document.body) : null;
}
