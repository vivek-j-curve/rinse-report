"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, Download } from "@/components/ui/icons";
import { TypeBadge } from "@/components/ui/badge";
import { PersonsSection } from "./persons-section";
import { EntitiesSection } from "./entities-section";
import { TransactionsSection } from "./transactions-section";
import { IndicatorsSection } from "./indicators-section";
import { ReasonSection } from "./reason-section";
import { SuspicionDrawer } from "./suspicion-drawer";
import { generateReportXml, saveSupervisorCode, confirmReportSubmission, generateReportPdf } from "@/lib/actions/reports";

type StepId = "reason" | "persons" | "transactions" | "indicators" | "supervisor" | "review";

type Step = {
  id: StepId;
  label: string;
  description: string;
  hideFor?: string[];
}

const ALL_STEPS: Step[] = [
  {
    id: "reason",
    label: "Reason for Suspicion",
    description: "Explain the grounds for suspicion and action taken",
  },
  {
    id: "persons",
    label: "Persons & Entities",
    description: "Add the people and organisations involved",
  },
  {
    id: "transactions",
    label: "Transactions",
    description: "Record the suspicious transactions",
    hideFor: ["SAR"],
  },
  {
    id: "indicators",
    label: "Indicators",
    description: "Select the applicable suspicion indicators",
  },
  {
    id: "supervisor",
    label: "Sector Supervisor",
    description: "Select the regulator that supervises your organisation",
  },
  {
    id: "review",
    label: "Review & Generate",
    description: "Check your report and generate the goAML XML",
  },
];

type ReportData = {
  report: Record<string, unknown> & {
    id: string;
    entity_reference: string;
    report_type: string;
    status: string;
    version: number;
    submission_code: string;
    case_id: string;
    xml_validation_errors: unknown;
    cases: {
      case_number: string;
      title: string;
      reporting_entity_id: string;
      sla_deadline: string;
      suspicion_formed_at: string;
      priority: string;
      status: string;
      reporting_entities: Record<string, unknown>;
    } | null;
  };
  persons: Record<string, unknown>[];
  entities: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
  indicators: { id: string; indicator_code: string }[];
  accounts: Record<string, unknown>[];
  questionnaireSubject: unknown;
  suspicion: { description: string; source: string | null; created_at: string } | null;
};

const SECTOR_SUPERVISOR_CODES = ["DIA"];

// As of 1 July 2026, DIA is the sole AML/CFT supervisor (AML/CFT Supervisor, Levy, and Other Matters Amendment Act received Royal Assent 18 May 2026).
const SUPERVISOR_OPTIONS = [
  {
    code: "DIA",
    name: "Department of Internal Affairs",
    sectors: "All reporting entities — banks, financial advisers, lawyers, accountants, real estate agents, and all other AML/CFT obliged businesses",
  },
];

function SupervisorSection({
  reportId,
  selected,
  onSelect,
  onUpdate,
  onRegisterSave,
}: {
  reportId: string;
  selected: string | null;
  onSelect: (code: string) => void;
  onUpdate: () => void;
  onRegisterSave?: (fn: (() => Promise<void>) | null) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!selected);

  const savedRef = useRef(saved);
  savedRef.current = saved;

  async function handleSave() {
    setSaving(true);
    await saveSupervisorCode(reportId, "DIA");
    onSelect("DIA");
    setSaving(false);
    setSaved(true);
    onUpdate();
  }

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    if (!onRegisterSave) return;
    onRegisterSave(async () => {
      if (!savedRef.current) await handleSaveRef.current();
    });
    return () => onRegisterSave(null);
  }, [onRegisterSave]);

  const opt = SUPERVISOR_OPTIONS[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold">Sector Supervisor</h3>
          <p className="text-[12px] text-text-tertiary mt-0.5">
            This is included as a mandatory indicator on all goAML reports.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="px-4 py-2 text-[13px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : saved ? "Confirmed" : "Confirm"}
        </button>
      </div>

      <div className="rounded-lg bg-surface-alt border border-border px-4 py-3 text-[12.5px] text-text-secondary mb-4">
        As of 1 July 2026, the Department of Internal Affairs (DIA) is the sole AML/CFT supervisor for all New Zealand reporting entities, following the <em>AML/CFT Supervisor, Levy, and Other Matters Amendment Act 2026</em>. The FMA and RBNZ no longer hold AML/CFT supervisory roles.
      </div>

      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-accent bg-accent/8">
        <div className="mt-1 shrink-0">
          <div className="w-4 h-4 rounded-full border-2 border-accent flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-accent" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-semibold text-accent">{opt.code}</span>
            <span className="text-[13px]">— {opt.name}</span>
          </div>
          <p className="text-[12px] text-text-tertiary mt-0.5">{opt.sectors}</p>
        </div>
      </div>
    </div>
  );
}

type PersonWithDetails = {
  first_name: string;
  last_name: string;
  birthdate?: string | null;
  phones?: unknown[];
  addresses?: unknown[];
  person_identifications?: unknown[];
};

function getXmlWarnings(data: ReportData): string[] {
  const warnings: string[] = [];
  const { report, persons, entities, transactions, accounts } = data;

  // Reason is mandatory
  const reasonData = report.xml_validation_errors as { reason?: string } | null;
  if (!reasonData?.reason?.trim()) {
    warnings.push("Reason for Suspicion is required - fill in the Reason & Review tab.");
  }

  // Sector supervisor is required for all report types
  const selectedCodes = (data.indicators as { id: string; indicator_code: string }[]).map(
    (i) => i.indicator_code
  );
  if (!selectedCodes.some((c) => SECTOR_SUPERVISOR_CODES.includes(c))) {
    warnings.push("No sector supervisor selected — choose DIA in the Sector Supervisor step. This is required for all report types.");
  }

  // CS1 (scam) requires the Reason to start with "SCAM"
  if (selectedCodes.includes("CS1")) {
    const reason = reasonData?.reason ?? "";
    if (reason.trim() && !reason.trimStart().toUpperCase().startsWith("SCAM")) {
      warnings.push("CS1 (Scam) indicator selected — the Reason for Suspicion must begin with the word SCAM.");
    }
  }

  // Persons/Entities required for SAR; at least one party required for all types
  if (persons.length === 0 && entities.length === 0) {
    warnings.push("No persons or entities added - at least one party is required.");
  }

  // Minimum party identity check
  for (const person of persons as unknown as PersonWithDetails[]) {
    const hasIdentity =
      !!person.birthdate ||
      (person.phones?.length ?? 0) > 0 ||
      (person.addresses?.length ?? 0) > 0 ||
      (person.person_identifications?.length ?? 0) > 0;
    if (!hasIdentity) {
      warnings.push(
        `${person.first_name} ${person.last_name} has no identity details — add at least one of: date of birth, phone number, address, or ID document.`
      );
    }
  }

  // Account-level checks
  for (const acc of accounts as { account_number?: string; institution_code?: string | null; institution_code_type?: string | null }[]) {
    const hasCode = !!acc.institution_code;
    if (!hasCode) {
      const acctNum = acc.account_number ?? "unknown";
      warnings.push(`Account "${acctNum}" has no institution code or SWIFT - one is required by the XSD.`);
    }
  }

  // Transaction checks for STR / LCT / IFT
  if (report.report_type !== "SAR" && transactions.length === 0) {
    warnings.push(`${report.report_type} reports must include at least one transaction.`);
  }

  // Per-transaction party checks
  for (const tx of transactions as { transaction_number: string; transaction_parties?: { direction: string }[] }[]) {
    const parties = tx.transaction_parties ?? [];
    const hasFrom = parties.some((p) => p.direction === "from");
    const hasTo = parties.some((p) => p.direction === "to");
    if (!hasFrom || !hasTo) {
      const issue = !hasFrom && !hasTo ? "no parties linked" : !hasFrom ? "no sender" : "no recipient";
      warnings.push(`Transaction ${tx.transaction_number} has ${issue} — link parties before generating XML.`);
    }
  }

  return warnings;
}

export function ReportBuilder({ data }: { data: ReportData }) {
  const router = useRouter();
  const { report } = data;

  const STEPS = ALL_STEPS.filter((s) => !s.hideFor?.includes(report.report_type));
  const [stepIndex, setStepIndex] = useState(0);
  const [supervisorCode, setSupervisorCode] = useState<string | null>(
    data.indicators.find((i) => SECTOR_SUPERVISOR_CODES.includes(i.indicator_code))?.indicator_code ?? null
  );
  const [generating, setGenerating] = useState(false);
  const [xmlResult, setXmlResult] = useState<{
    success?: boolean;
    error?: string;
    xml?: string;
  } | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [eddConfirmed, setEddConfirmed] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [goamlConfirmationId, setGoamlConfirmationId] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const sectionSaveRef = useRef<(() => Promise<void>) | null>(null);
  const sectionValidateRef = useRef<(() => string | null) | null>(null);
  const registerSave = useCallback((fn: (() => Promise<void>) | null) => {
    sectionSaveRef.current = fn;
  }, []);
  const registerValidate = useCallback((fn: (() => string | null) | null) => {
    sectionValidateRef.current = fn;
  }, []);

  const currentStep = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;
  const progressPercent = Math.round((stepIndex / (STEPS.length - 1)) * 100);

  const caseData = report.cases;
  const reportingEntity = caseData?.reporting_entities as {
    rentity_id: string;
    rentity_branch: string | null;
    local_currency: string;
    compliance_officer_name: string;
  } | null;

  function getStepStatus(step: Step): "empty" | "has_data" {
    switch (step.id) {
      case "persons":
        return data.persons.length > 0 || data.entities.length > 0 ? "has_data" : "empty";
      case "transactions":
        return data.transactions.length > 0 ? "has_data" : "empty";
      case "indicators":
        return data.indicators.filter((i) => !SECTOR_SUPERVISOR_CODES.includes(i.indicator_code)).length > 0 ? "has_data" : "empty";
      case "supervisor":
        return supervisorCode ? "has_data" : "empty";
      case "reason": {
        const reasonData = report.xml_validation_errors as { reason?: string; action?: string } | null;
        return reasonData?.reason ? "has_data" : "empty";
      }
      case "review":
        return "has_data";
    }
  }

  function validateCurrentStep(): string | null {
    switch (currentStep.id) {
      case "reason": {
        if (sectionValidateRef.current) return sectionValidateRef.current();
        const reasonData = report.xml_validation_errors as { reason?: string } | null;
        if (!reasonData?.reason?.trim()) {
          return "Please enter the reason for suspicion before continuing.";
        }
        return null;
      }
      case "persons":
        if (data.persons.length === 0 && data.entities.length === 0) {
          return "Add at least one person or entity before continuing.";
        }
        return null;
      case "supervisor":
        if (!supervisorCode) return "Please select your sector supervisor before continuing.";
        return null;
      case "transactions": {
        if (data.transactions.length === 0) {
          return `${report.report_type} reports require at least one transaction.`;
        }
        const anyMissing = (data.transactions as { transaction_parties?: { direction: string }[] }[]).some((tx) => {
          const parties = tx.transaction_parties ?? [];
          return !parties.some((p) => p.direction === "from") || !parties.some((p) => p.direction === "to");
        });
        if (anyMissing) return "All transactions must have a sender and a recipient. Link parties to every transaction before continuing.";
        return null;
      }
      case "indicators": {
        const nonSupervisor = data.indicators.filter((i) => !SECTOR_SUPERVISOR_CODES.includes(i.indicator_code));
        if (nonSupervisor.length === 0) return "Select at least one indicator before continuing.";
        return null;
      }
      default:
        return null;
    }
  }

  async function handleContinue() {
    const err = validateCurrentStep();
    if (err) {
      setStepError(err);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setStepError(null);
    if (sectionSaveRef.current) {
      setContinuing(true);
      try { await sectionSaveRef.current(); } catch { /* ignore save errors */ }
      setContinuing(false);
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setStepError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleGenerateXml() {
    setGenerating(true);
    setXmlResult(null);
    const result = await generateReportXml(report.id);
    setXmlResult(result);
    setGenerating(false);

    if ("success" in result && result.success && result.xml) {
      const blob = new Blob([result.xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.entity_reference}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  async function handleGeneratePdf() {
    setGeneratingPdf(true);
    setPdfError(null);
    const result = await generateReportPdf(report.id);
    setGeneratingPdf(false);

    if ("error" in result && result.error) {
      setPdfError(result.error);
      return;
    }
    if ("success" in result && result.success && result.pdfBase64) {
      const bytes = Uint8Array.from(atob(result.pdfBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename ?? `${report.entity_reference}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  async function handleConfirmSubmission() {
    setConfirming(true);
    setConfirmResult(null);
    const result = await confirmReportSubmission(report.id, goamlConfirmationId || undefined);
    setConfirmResult(result);
    setConfirming(false);
    if ("success" in result && result.success) {
      router.push("/reports");
    }
  }

  const xmlWarnings = getXmlWarnings(data);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <Link
          href="/reports"
          className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text mb-3"
        >
          <ArrowLeft size={14} />
          Back to reports
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <TypeBadge type={report.report_type as "STR" | "SAR" | "LCT" | "IFT"} />
              <span className="font-mono text-[13px] text-text-tertiary">
                {report.entity_reference}
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-bg text-amber border border-amber-border font-medium">
                Draft
              </span>
            </div>
            <h1 className="text-[24px] font-bold tracking-tight">
              {caseData?.title ?? "Build Report"}
            </h1>
            {caseData && (
              <p className="text-text-secondary text-[13px] mt-0.5">
                Case {caseData.case_number}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reporting entity info bar */}
      {reportingEntity && (
        <div className="rounded-lg bg-surface border border-border px-4 py-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[12.5px]">
          <div className="flex items-center gap-1.5">
            <span className="text-text-tertiary font-medium">Reporting Entity ID:</span>
            <span className="font-mono font-semibold">{reportingEntity.rentity_id}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-tertiary font-medium">Local Currency:</span>
            <span className="font-mono font-semibold">{reportingEntity.local_currency}</span>
          </div>
          {reportingEntity.rentity_branch && (
            <div className="flex items-center gap-1.5">
              <span className="text-text-tertiary font-medium">Branch:</span>
              <span className="font-semibold">{reportingEntity.rentity_branch}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-text-tertiary font-medium">Reference:</span>
            <span className="font-mono font-semibold">{report.entity_reference}</span>
          </div>
        </div>
      )}

      {/* Suspicion reference drawer */}
      {caseData && (
        <SuspicionDrawer
          caseId={report.case_id}
          caseData={{
            case_number: caseData.case_number,
            title: caseData.title,
            sla_deadline: caseData.sla_deadline,
            suspicion_formed_at: caseData.suspicion_formed_at,
            priority: caseData.priority,
            status: caseData.status,
          }}
          suspicion={data.suspicion}
          questionnaireSubject={data.questionnaireSubject as Record<string, string> | null}
        />
      )}

      {/* Wizard card */}
      <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-surface-alt">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step header */}
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => { setStepError(null); setStepIndex(i); }}
                  title={s.label}
                  className={`flex items-center justify-center rounded-full transition-colors ${
                    i === stepIndex
                      ? "w-6 h-6 bg-accent text-white text-[11px] font-bold"
                      : getStepStatus(s) === "has_data"
                      ? "w-5 h-5 text-green"
                      : "w-5 h-5 bg-surface-alt border border-border text-text-tertiary text-[10px] font-semibold"
                  }`}
                >
                  {i === stepIndex ? (
                    <span>{i + 1}</span>
                  ) : getStepStatus(s) === "has_data" ? (
                    <CheckCircle size={14} />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </button>
              ))}
            </div>
            <span className="text-[12px] text-text-tertiary">
              Step {stepIndex + 1} of {STEPS.length}
            </span>
          </div>
          <h2 className="text-[17px] font-semibold">{currentStep.label}</h2>
          <p className="text-text-secondary text-[13px] mt-0.5">{currentStep.description}</p>
        </div>

        {/* Step content */}
        <div className="p-6">
          {stepError && (
            <div className="rounded-lg bg-amber-bg border border-amber-border px-4 py-3 text-[13px] text-amber mb-5">
              {stepError}
            </div>
          )}

          {currentStep.id === "reason" && (
            <ReasonSection
              reportId={report.id}
              initialReason={
                (report.xml_validation_errors as { reason?: string } | null)?.reason ?? ""
              }
              initialAction={
                (report.xml_validation_errors as { action?: string } | null)?.action ?? ""
              }
              initialFiuRefNumber={
                (report.xml_validation_errors as { fiu_ref_number?: string } | null)?.fiu_ref_number ?? ""
              }
              hasScamIndicator={data.indicators.some((i) => i.indicator_code === "CS1")}
              reportType={report.report_type}
              onUpdate={() => router.refresh()}
              onRegisterSave={registerSave}
              onRegisterValidate={registerValidate}
            />
          )}

          {currentStep.id === "persons" && (
            <div className="space-y-8">
              <PersonsSection
                reportId={report.id}
                persons={data.persons}
                entities={data.entities}
                onUpdate={() => router.refresh()}
              />
              <div className="border-t border-border pt-6">
                <EntitiesSection
                  reportId={report.id}
                  entities={data.entities}
                  onUpdate={() => router.refresh()}
                />
              </div>
            </div>
          )}

          {currentStep.id === "transactions" && (
            <TransactionsSection
              reportId={report.id}
              transactions={data.transactions}
              persons={data.persons}
              entities={data.entities}
              accounts={data.accounts}
              onUpdate={() => router.refresh()}
            />
          )}

          {currentStep.id === "indicators" && (
            <IndicatorsSection
              reportId={report.id}
              selectedIndicators={data.indicators.map((i) => i.indicator_code)}
              reportType={report.report_type as "STR" | "SAR" | "LCT" | "IFT"}
              onUpdate={() => router.refresh()}
              onRegisterSave={registerSave}
            />
          )}

          {currentStep.id === "supervisor" && (
            <SupervisorSection
              reportId={report.id}
              selected={supervisorCode}
              onSelect={setSupervisorCode}
              onUpdate={() => router.refresh()}
              onRegisterSave={registerSave}
            />
          )}

          {currentStep.id === "review" && (
            <ReviewStep
              data={data}
              xmlWarnings={xmlWarnings}
              generating={generating}
              xmlResult={xmlResult}
              eddConfirmed={eddConfirmed}
              onEddChange={setEddConfirmed}
              onGenerate={handleGenerateXml}
              onGoToStep={(id) => {
                const idx = STEPS.findIndex((s) => s.id === id);
                if (idx !== -1) { setStepError(null); setStepIndex(idx); }
              }}
              confirming={confirming}
              confirmResult={confirmResult}
              goamlConfirmationId={goamlConfirmationId}
              onConfirmationIdChange={setGoamlConfirmationId}
              onConfirm={handleConfirmSubmission}
              generatingPdf={generatingPdf}
              pdfError={pdfError}
              onGeneratePdf={handleGeneratePdf}
            />
          )}
        </div>

        {/* Navigation footer */}
        <div className="px-6 pb-5 flex items-center justify-between border-t border-border pt-4">
          <button
            onClick={handleBack}
            disabled={isFirst}
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium border border-border rounded-full hover:bg-surface-alt transition-colors disabled:opacity-40"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {!isLast && (
            <button
              onClick={handleContinue}
              disabled={continuing}
              className="inline-flex items-center gap-2 px-5 py-2 text-[13px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover transition-colors disabled:opacity-60"
            >
              {continuing ? "Saving..." : "Continue"}
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Review step ───────────────────────────────────────────────────────────────

function ReviewStep({
  data,
  xmlWarnings,
  generating,
  xmlResult,
  eddConfirmed,
  onEddChange,
  onGenerate,
  onGoToStep,
  confirming,
  confirmResult,
  goamlConfirmationId,
  onConfirmationIdChange,
  onConfirm,
  generatingPdf,
  pdfError,
  onGeneratePdf,
}: {
  data: ReportData;
  xmlWarnings: string[];
  generating: boolean;
  xmlResult: { success?: boolean; error?: string; xml?: string } | null;
  eddConfirmed: boolean;
  onEddChange: (v: boolean) => void;
  onGenerate: () => void;
  onGoToStep: (id: StepId) => void;
  confirming: boolean;
  confirmResult: { success?: boolean; error?: string } | null;
  goamlConfirmationId: string;
  onConfirmationIdChange: (v: string) => void;
  onConfirm: () => void;
  generatingPdf: boolean;
  pdfError: string | null;
  onGeneratePdf: () => void;
}) {
  const { report, persons, entities, transactions, indicators } = data;
  const reasonData = report.xml_validation_errors as { reason?: string; action?: string } | null;

  return (
    <div className="space-y-5">
      {xmlWarnings.length > 0 && (
        <div className="rounded-lg bg-amber-bg border border-amber-border px-4 py-3 text-[13px]">
          <p className="font-semibold text-amber mb-1.5">Fix before generating XML</p>
          <ul className="list-disc list-inside space-y-1 text-text-secondary">
            {xmlWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {xmlResult?.error && (
        <div className="rounded-lg bg-red-bg border border-red-border px-4 py-3 text-[13px] text-red">
          {xmlResult.error}
        </div>
      )}
      {xmlResult?.success && (
        <div className="rounded-lg bg-green-bg border border-green-border px-4 py-3 text-[13px] text-green">
          XML generated and downloaded successfully.
        </div>
      )}

      {/* Summary cards */}
      <div className="space-y-3">
        {/* Reason */}
        <SummaryCard
          title="Reason for Suspicion"
          onEdit={() => onGoToStep("reason")}
          isEmpty={!reasonData?.reason}
          emptyMsg="No reason entered"
        >
          {reasonData?.reason && (
            <p className="text-[13px] leading-relaxed line-clamp-3">{reasonData.reason}</p>
          )}
          {reasonData?.action && (
            <p className="text-[12.5px] text-text-secondary mt-1.5">
              <span className="font-medium">Action taken:</span> {reasonData.action}
            </p>
          )}
        </SummaryCard>

        {/* Persons & Entities */}
        <SummaryCard
          title="Persons & Entities"
          onEdit={() => onGoToStep("persons")}
          isEmpty={persons.length === 0 && entities.length === 0}
          emptyMsg="No persons or entities added"
        >
          {persons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(persons as { id: string; first_name: string; last_name: string; role: string }[]).map((p) => (
                <span key={p.id} className="text-[12px] px-2 py-0.5 rounded-full bg-surface-alt border border-border font-medium">
                  {p.first_name} {p.last_name}
                  <span className="ml-1 text-text-tertiary font-normal capitalize">{p.role.replace(/_/g, " ")}</span>
                </span>
              ))}
            </div>
          )}
          {entities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {(entities as { id: string; name: string }[]).map((e) => (
                <span key={e.id} className="text-[12px] px-2 py-0.5 rounded-full bg-surface-alt border border-border font-medium">
                  {e.name}
                </span>
              ))}
            </div>
          )}
        </SummaryCard>

        {/* Transactions (non-SAR) */}
        {report.report_type !== "SAR" && (
          <SummaryCard
            title="Transactions"
            onEdit={() => onGoToStep("transactions")}
            isEmpty={transactions.length === 0}
            emptyMsg="No transactions added"
          >
            <div className="space-y-1">
              {(transactions as { id: string; transaction_number: string; amount_local: number; currency_code_local: string; date_transaction: string; transaction_parties?: { direction: string }[] }[]).map((tx) => {
                const parties = tx.transaction_parties ?? [];
                const hasFrom = parties.some((p) => p.direction === "from");
                const hasTo = parties.some((p) => p.direction === "to");
                const missingParties = !hasFrom || !hasTo;
                return (
                  <div key={tx.id} className="flex items-center gap-2 text-[12.5px]">
                    <span className="font-mono text-text-tertiary">{tx.transaction_number}</span>
                    <span className="font-medium">
                      {tx.amount_local.toLocaleString("en-NZ", { minimumFractionDigits: 2 })} {tx.currency_code_local}
                    </span>
                    <span className="text-text-tertiary">
                      {new Date(tx.date_transaction).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {missingParties && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-bg border border-amber-border text-amber font-medium">
                        {!hasFrom && !hasTo ? "Parties missing" : !hasFrom ? "Sender missing" : "Recipient missing"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </SummaryCard>
        )}

        {/* Indicators */}
        <SummaryCard
          title="Indicators"
          onEdit={() => onGoToStep("indicators")}
          isEmpty={indicators.length === 0}
          emptyMsg="No indicators selected"
        >
          <div className="flex flex-wrap gap-1.5">
            {indicators.map((ind) => (
              <span key={ind.id} className="text-[11.5px] font-medium px-2 py-0.5 rounded-full bg-surface-alt border border-border">
                {ind.indicator_code}
              </span>
            ))}
          </div>
        </SummaryCard>
      </div>

      {/* EDD gate for SAR */}
      {report.report_type === "SAR" && (
        <div className="rounded-lg border border-border bg-surface px-4 py-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={eddConfirmed}
              onChange={(e) => onEddChange(e.target.checked)}
              className="mt-0.5 rounded border-border"
            />
            <div>
              <p className="text-[13px] font-semibold">Enhanced Due Diligence (EDD) completed</p>
              <p className="text-[12px] text-text-secondary mt-0.5">
                Confirm that EDD has been completed on the subject of this SAR in accordance with the AML/CFT Act before generating the XML.
              </p>
            </div>
          </label>
          {!eddConfirmed && (
            <p className="text-[11.5px] text-amber mt-2 ml-6">
              You must confirm EDD completion before this SAR can be generated.
            </p>
          )}
        </div>
      )}

      {/* Generate button */}
      <div className="pt-2">
        <button
          onClick={onGenerate}
          disabled={generating || xmlWarnings.length > 0 || (report.report_type === "SAR" && !eddConfirmed)}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-[14px] font-semibold bg-accent text-white rounded-[10px] hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          <Download size={16} />
          {generating ? "Generating..." : "Generate & Download goAML XML"}
        </button>
        {(xmlWarnings.length > 0 || (report.report_type === "SAR" && !eddConfirmed)) && (
          <p className="text-[12px] text-text-tertiary text-center mt-2">
            Fix the issues above before generating.
          </p>
        )}
        {xmlResult && "error" in xmlResult && xmlResult.error && (
          <p className="text-[12px] text-red mt-2 text-center">{xmlResult.error}</p>
        )}
        {xmlResult && "success" in xmlResult && xmlResult.success && (
          <p className="text-[12px] text-green mt-2 text-center flex items-center justify-center gap-1">
            <CheckCircle size={13} /> XML generated and downloaded successfully.
          </p>
        )}
      </div>

      {/* PDF export — shown after XML is generated */}
      {xmlResult && "success" in xmlResult && xmlResult.success && (
        <div className="pt-0">
          <button
            onClick={onGeneratePdf}
            disabled={generatingPdf}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-medium border border-border rounded-[10px] hover:bg-surface-alt transition-colors disabled:opacity-60"
          >
            <Download size={15} />
            {generatingPdf ? "Generating PDF..." : "Download PDF Summary"}
          </button>
          {pdfError && (
            <p className="text-[12px] text-red mt-1.5 text-center">{pdfError}</p>
          )}
        </div>
      )}

      {/* Confirm submission — shown after XML is downloaded */}
      {xmlResult && "success" in xmlResult && xmlResult.success && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-alt/50">
            <h3 className="text-[13px] font-semibold">Confirm Submission to FIU</h3>
            <p className="text-[12px] text-text-secondary mt-0.5">
              Upload the XML to the goAML portal, then confirm below to mark this report as submitted and close the case.
            </p>
          </div>
          <div className="px-4 py-4 space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">
                goAML confirmation ID <span className="font-normal text-text-tertiary">(optional)</span>
              </label>
              <input
                type="text"
                value={goamlConfirmationId}
                onChange={(e) => onConfirmationIdChange(e.target.value)}
                placeholder="e.g. 2024-NZ-00123"
                className="w-full text-[13px] px-3 py-2 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text-tertiary"
              />
            </div>
            {confirmResult && "error" in confirmResult && confirmResult.error && (
              <p className="text-[12px] text-red">{confirmResult.error}</p>
            )}
            <button
              onClick={onConfirm}
              disabled={confirming}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-semibold border-2 border-green text-green rounded-[10px] hover:bg-green/8 transition-colors disabled:opacity-60"
            >
              <CheckCircle size={15} />
              {confirming ? "Confirming..." : "I've uploaded the XML — Confirm Submission"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  onEdit,
  isEmpty,
  emptyMsg,
  children,
}: {
  title: string;
  onEdit: () => void;
  isEmpty: boolean;
  emptyMsg: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-border bg-surface-alt/50">
        <div className="flex items-center gap-2">
          {isEmpty ? (
            <div className="w-4 h-4 rounded-full border-2 border-amber shrink-0" />
          ) : (
            <CheckCircle size={15} className="text-green shrink-0" />
          )}
          <h3 className="text-[13px] font-semibold">{title}</h3>
        </div>
        <button
          onClick={onEdit}
          className="text-[12px] font-medium text-accent hover:text-accent-hover"
        >
          Edit
        </button>
      </div>
      <div className="px-4 py-3">
        {isEmpty ? (
          <p className="text-[12.5px] text-text-tertiary">{emptyMsg}</p>
        ) : children}
      </div>
    </div>
  );
}
