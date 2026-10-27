"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle } from "@/components/ui/icons";
import { CountrySelect } from "@/components/ui/country-select";
import type { ReportType } from "@/types/database";

type Section = {
  step: number;
  title: string;
  description: string;
  fields: Field[];
};

type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "date" | "number" | "country";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  showWhen?: { field: string; value: string };
};

const sections: Section[] = [
  {
    step: 1,
    title: "Subject Information",
    description: "Details about the person or entity under suspicion",
    fields: [
      {
        name: "first_names",
        label: "First Names",
        type: "text",
        placeholder: "Given and middle names",
        required: true,
      },
      {
        name: "last_name",
        label: "Last Name",
        type: "text",
        placeholder: "Family name / surname",
        required: true,
      },
      { name: "date_of_birth", label: "Date of Birth", type: "date" },
      {
        name: "id_type",
        label: "ID Type",
        type: "select",
        options: [
          { value: "passport", label: "Passport" },
          { value: "drivers_licence", label: "Driver's Licence" },
          { value: "nz_birth_cert", label: "NZ Birth Certificate" },
          { value: "company_cert", label: "Company Certificate" },
          { value: "other", label: "Other" },
        ],
      },
      {
        name: "id_country",
        label: "Issuing Country",
        type: "country",
        showWhen: { field: "id_type", value: "passport" },
      },
      {
        name: "id_number",
        label: "ID Number",
        type: "text",
        placeholder: "Document reference number",
      },
      {
        name: "nationality",
        label: "Nationality",
        type: "text",
        placeholder: "e.g. New Zealand",
      },
      {
        name: "occupation",
        label: "Occupation / Business Activity",
        type: "text",
        placeholder: "Known occupation or business type",
      },
    ],
  },
  {
    step: 2,
    title: "Transaction Details",
    description: "Information about the suspicious transaction(s)",
    fields: [
      {
        name: "transaction_date",
        label: "Transaction Date",
        type: "date",
        required: true,
      },
      {
        name: "transaction_amount",
        label: "Amount (NZD)",
        type: "number",
        placeholder: "0.00",
        required: true,
      },
      {
        name: "transaction_type",
        label: "Transaction Type",
        type: "select",
        options: [
          { value: "cash_deposit", label: "Cash Deposit" },
          { value: "cash_withdrawal", label: "Cash Withdrawal" },
          { value: "wire_transfer", label: "Wire Transfer" },
          { value: "electronic_transfer", label: "Electronic Transfer" },
          { value: "currency_exchange", label: "Currency Exchange" },
          { value: "purchase", label: "Purchase / Sale" },
          { value: "other", label: "Other" },
        ],
        required: true,
      },
      {
        name: "originating_account",
        label: "Originating Account",
        type: "text",
        placeholder: "Account number or reference",
      },
      {
        name: "beneficiary_account",
        label: "Beneficiary Account",
        type: "text",
        placeholder: "Destination account or reference",
      },
      {
        name: "transaction_narrative",
        label: "Transaction Description",
        type: "textarea",
        placeholder: "Describe the transaction and any relevant details...",
        required: true,
      },
    ],
  },
  {
    step: 3,
    title: "Grounds for Suspicion",
    description: "Why this activity is considered suspicious",
    fields: [
      {
        name: "reason_for_suspicion",
        label: "Reason for Suspicion",
        type: "textarea",
        placeholder:
          "Explain why you believe this activity is suspicious. Include any relevant facts, patterns, or indicators...",
        required: true,
      },
      {
        name: "indicators",
        label: "Indicators Identified",
        type: "textarea",
        placeholder:
          "List the specific indicators (e.g. structuring, unusual patterns, inconsistent source of funds)...",
      },
      {
        name: "action_taken",
        label: "Action Taken",
        type: "textarea",
        placeholder:
          "What actions has the reporting entity taken in response (e.g. account frozen, transaction delayed)...",
      },
    ],
  },
  {
    step: 4,
    title: "Additional Information",
    description: "Supporting details and context",
    fields: [
      {
        name: "related_parties",
        label: "Related Parties",
        type: "textarea",
        placeholder: "Other persons or entities linked to the activity...",
      },
      {
        name: "previous_reports",
        label: "Previous Reports",
        type: "textarea",
        placeholder:
          "Reference any prior STR/SAR filings related to this subject...",
      },
      {
        name: "additional_notes",
        label: "Additional Notes",
        type: "textarea",
        placeholder: "Any other relevant information...",
      },
    ],
  },
];

export function QuestionnairePanel({
  caseId,
  existingResponses,
  suspicionType = "transaction",
}: {
  caseId: string;
  existingResponses: {
    id: string;
    report_type: string;
    current_step: number;
    total_steps: number;
    responses: Record<string, unknown>;
    status: string;
  }[];
  suspicionType?: "transaction" | "activity";
}) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [reportType, setReportType] = useState<ReportType>(
    suspicionType === "activity" ? "SAR" : "STR"
  );

  const visibleSections = suspicionType === "activity"
    ? sections.filter((s) => s.title !== "Transaction Details")
    : sections;
  const TOTAL_STEPS = visibleSections.length;

  const existing = existingResponses[0];
  const completedStep = existing?.status === "complete"
    ? existing.total_steps
    : existing?.current_step ?? 0;

  function openStep(step: number) {
    if (existing?.responses) {
      const restored: Record<string, string> = {};
      for (const [k, v] of Object.entries(existing.responses)) {
        restored[k] = String(v ?? "");
      }
      setFormData(restored);
    }
    if (existing?.report_type) {
      setReportType(existing.report_type as ReportType);
    }
    setActiveStep(step);
  }

  async function handleMarkComplete() {
    if (!existing) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("questionnaire_responses")
      .update({
        status: "complete",
        current_step: TOTAL_STEPS,
        total_steps: TOTAL_STEPS,
        completed_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    setSaving(false);
    router.refresh();
  }

  async function handleSave(step: number, markComplete: boolean) {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("id", user!.id)
      .single();

    const newStep = markComplete ? step : step;
    const status = markComplete && step === TOTAL_STEPS ? "complete" : "draft";

    if (existing) {
      await supabase
        .from("questionnaire_responses")
        .update({
          responses: formData as unknown as Record<string, never>,
          status,
          current_step: newStep,
          completed_at:
            status === "complete" ? new Date().toISOString() : null,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("questionnaire_responses").insert({
        case_id: caseId,
        organisation_id: profile!.organisation_id,
        report_type: reportType,
        current_step: newStep,
        total_steps: TOTAL_STEPS,
        responses: formData as unknown as Record<string, never>,
        status,
        completed_at: status === "complete" ? new Date().toISOString() : null,
      });
    }

    setSaving(false);
    setActiveStep(null);
    router.refresh();
  }

  return (
    <div className="bg-surface border border-border rounded-[10px]">
      <div className="px-5 pt-4 pb-3">
        <h2 className="text-sm font-semibold">Guided Questionnaire</h2>
        <p className="text-text-tertiary text-[12px] mt-0.5">
          Complete each section to prepare your report for filing
        </p>
      </div>

      {!existing && activeStep === null && (
        <div className="px-5 pb-4">
          <label className="block text-[12.5px] font-medium mb-1">
            Report Type
          </label>
          {suspicionType === "activity" ? (
            <div className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2 text-[13px] text-text-secondary flex items-center justify-between mb-2">
              <span className="font-medium text-text">SAR - Suspicious Activity Report</span>
              <span className="text-[11px] text-text-tertiary">Locked (activity suspicion)</span>
            </div>
          ) : (
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent mb-2"
            >
              <option value="STR">STR - Suspicious Transaction Report</option>
              <option value="LCT">LCT - Large Cash Transaction</option>
              <option value="IFT">IFT - International Funds Transfer</option>
            </select>
          )}
        </div>
      )}

      {existing && existing.status !== "complete" && completedStep >= TOTAL_STEPS && (
        <div className="mx-5 mb-4 rounded-lg bg-green-bg border border-green-border px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[12.5px] font-semibold text-green">All sections complete</p>
            <p className="text-[11.5px] text-text-secondary mt-0.5">Mark the questionnaire as complete to enable report creation.</p>
          </div>
          <button
            onClick={handleMarkComplete}
            disabled={saving}
            className="shrink-0 px-3.5 py-2 text-[12.5px] font-semibold bg-green text-white rounded-full hover:opacity-90 transition-opacity disabled:opacity-60 whitespace-nowrap"
          >
            {saving ? "Saving..." : "Mark Complete"}
          </button>
        </div>
      )}

      <div className="divide-y divide-border">
        {visibleSections.map((section) => {
          const isComplete = completedStep >= section.step;
          const isActive = activeStep === section.step;

          return (
            <div key={section.step}>
              <button
                onClick={() =>
                  isActive
                    ? setActiveStep(null)
                    : openStep(section.step)
                }
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface-alt transition-colors text-left"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                    isComplete
                      ? "bg-green-bg text-green"
                      : "bg-surface-alt text-text-tertiary border border-border"
                  }`}
                >
                  {isComplete ? <CheckCircle size={14} /> : section.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium">
                    {section.title}
                  </div>
                  <div className="text-[12px] text-text-tertiary">
                    {section.description}
                  </div>
                </div>
              </button>

              {isActive && (
                <div className="px-5 pb-5 space-y-4">
                  {section.fields
                    .filter((field) => !field.showWhen || formData[field.showWhen.field] === field.showWhen.value)
                    .map((field) => (
                    <div key={field.name}>
                      <label className="block text-[12.5px] font-medium mb-1">
                        {field.label}
                        {field.required && (
                          <span className="text-red ml-0.5">*</span>
                        )}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          rows={3}
                          value={formData[field.name] ?? ""}
                          onChange={(e) =>
                            setFormData((d) => ({
                              ...d,
                              [field.name]: e.target.value,
                            }))
                          }
                          placeholder={field.placeholder}
                          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
                        />
                      ) : field.type === "select" ? (
                        <select
                          value={formData[field.name] ?? ""}
                          onChange={(e) =>
                            setFormData((d) => ({
                              ...d,
                              [field.name]: e.target.value,
                            }))
                          }
                          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                        >
                          <option value="">Select...</option>
                          {field.options?.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "country" ? (
                        <CountrySelect
                          value={formData[field.name] ?? ""}
                          onChange={(val) =>
                            setFormData((d) => ({
                              ...d,
                              [field.name]: val,
                            }))
                          }
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.name] ?? ""}
                          onChange={(e) =>
                            setFormData((d) => ({
                              ...d,
                              [field.name]: e.target.value,
                            }))
                          }
                          placeholder={field.placeholder}
                          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                        />
                      )}
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleSave(section.step, false)}
                      disabled={saving}
                      className="px-4 py-2 text-[13px] font-medium border border-border rounded-full hover:bg-surface-alt transition-colors disabled:opacity-60"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={() => handleSave(section.step, true)}
                      disabled={saving}
                      className="px-4 py-2 text-[13px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover transition-colors disabled:opacity-60"
                    >
                      {saving
                        ? "Saving..."
                        : section.step === TOTAL_STEPS
                          ? "Complete Questionnaire"
                          : "Save & Continue"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
