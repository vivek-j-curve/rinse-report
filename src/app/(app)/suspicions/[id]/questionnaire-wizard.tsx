"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  STEPS,
  INDICATOR_OPTIONS,
  type Answers,
  type FieldDef,
} from "@/lib/questionnaire/steps";
import {
  getNextStepIndex,
  getProgress,
  validateStep,
  stepIndexById,
  getReportType,
  getVisibleSteps,
} from "@/lib/questionnaire/engine";
import { CountrySelect, COUNTRY_CODE_TO_NAME } from "@/components/ui/country-select";
import { CheckCircle, ArrowLeft, ArrowRight, Info } from "@/components/ui/icons";

// ── Indicator groups ──────────────────────────────────────────────────────────

const INDICATOR_GROUPS = Array.from(
  new Set(INDICATOR_OPTIONS.map((o) => o.group!))
);

function IndicatorField({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div className="space-y-5">
      {INDICATOR_GROUPS.map((group) => {
        const opts = INDICATOR_OPTIONS.filter((o) => o.group === group);
        return (
          <div key={group}>
            <h4 className="text-[11.5px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">
              {group}
            </h4>
            <div className="space-y-1.5">
              {opts.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 px-3.5 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    selected.includes(opt.value)
                      ? "border-accent bg-accent/8"
                      : "border-border hover:border-border-strong hover:bg-surface-alt"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-[var(--color-accent)] shrink-0"
                    checked={selected.includes(opt.value)}
                    onChange={() => toggle(opt.value)}
                  />
                  <span className="text-[13px] leading-snug">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Single field renderer ─────────────────────────────────────────────────────

function FieldRenderer({
  field,
  answers,
  error,
  onChange,
}: {
  field: FieldDef;
  answers: Answers;
  error?: string;
  onChange: (key: string, value: string | string[]) => void;
}) {
  const value = answers[field.key] ?? "";
  const strVal = Array.isArray(value) ? "" : value;
  const arrVal = Array.isArray(value) ? value : [];

  const inputCls = `w-full bg-surface border rounded-lg px-3 py-2 text-[13.5px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors ${
    error ? "border-red" : "border-border"
  }`;

  if (field.type === "checkbox-group") {
    return (
      <IndicatorField
        selected={arrVal}
        onChange={(val) => onChange(field.key, val)}
      />
    );
  }

  if (field.type === "radio") {
    return (
      <div className="space-y-2">
        {field.options?.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
              strVal === opt.value
                ? "border-accent bg-accent/8"
                : "border-border hover:border-border-strong hover:bg-surface-alt"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  strVal === opt.value
                    ? "border-accent"
                    : "border-border-strong"
                }`}
              >
                {strVal === opt.value && (
                  <div className="w-2 h-2 rounded-full bg-accent" />
                )}
              </div>
            </div>
            <div>
              <div
                className={`text-[13.5px] font-medium ${
                  strVal === opt.value ? "text-accent" : ""
                }`}
              >
                {opt.label}
              </div>
              {opt.description && (
                <div className="text-[12px] text-text-tertiary mt-0.5">
                  {opt.description}
                </div>
              )}
            </div>
            <input
              type="radio"
              className="sr-only"
              checked={strVal === opt.value}
              onChange={() => onChange(field.key, opt.value)}
            />
          </label>
        ))}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        rows={field.rows ?? 4}
        value={strVal}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder}
        className={inputCls + " resize-none"}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={strVal}
        onChange={(e) => onChange(field.key, e.target.value)}
        className={inputCls}
      >
        <option value="">Select...</option>
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "country") {
    return (
      <CountrySelect
        value={strVal}
        onChange={(val) => onChange(field.key, val)}
      />
    );
  }

  return (
    <input
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      value={strVal}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder}
      className={inputCls}
      min={field.type === "number" ? "0" : undefined}
      step={field.type === "number" ? "0.01" : undefined}
    />
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export function QuestionnaireWizard({
  caseId,
  organisationId,
  isSAR,
  existing,
}: {
  caseId: string;
  organisationId: string;
  isSAR: boolean;
  existing: {
    id: string;
    report_type: string;
    current_step: number;
    responses: Record<string, unknown>;
    status: string;
  } | null;
}) {
  const router = useRouter();

  // Restore saved answers
  const initialAnswers: Answers = (() => {
    if (!existing?.responses) return isSAR ? { report_type: "SAR" } : {};
    const r: Answers = {};
    for (const [k, v] of Object.entries(existing.responses)) {
      r[k] = v as string | string[];
    }
    if (isSAR) r.report_type = "SAR";
    return r;
  })();

  // Restore step: find first step that wasn't yet completed
  const initialStepIndex = (() => {
    if (!existing || existing.status === "complete") return 0;
    const savedStep = existing.current_step;
    // Walk visible steps and find the one at position savedStep
    let count = 0;
    for (let i = 0; i < STEPS.length; i++) {
      if (!STEPS[i].skipIf?.(initialAnswers, isSAR)) {
        if (count === savedStep) return i;
        count++;
      }
    }
    return 0;
  })();

  // Build initial history from step 0 up to initialStepIndex
  const initialHistory: number[] = (() => {
    const h: number[] = [];
    for (let i = 0; i < initialStepIndex; i++) {
      if (!STEPS[i].skipIf?.(initialAnswers, isSAR)) h.push(i);
    }
    return h;
  })();

  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);
  const [history, setHistory] = useState<number[]>(initialHistory);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(existing?.status === "complete");
  const [openHelpers, setOpenHelpers] = useState<Record<string, boolean>>({});

  function toggleHelper(key: string) {
    setOpenHelpers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const currentStep = STEPS[currentStepIndex];
  const progress = getProgress(history, answers, isSAR);
  const nextIndex = getNextStepIndex(currentStepIndex, answers, isSAR);
  const isLastStep = nextIndex === null;

  const handleChange = useCallback((key: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  async function persist(
    currentAnswers: Answers,
    visibleStepPosition: number,
    status: "draft" | "complete"
  ) {
    const supabase = createClient();
    const reportType = getReportType(currentAnswers, isSAR);
    const totalVisible = STEPS.filter(
      (s) => !s.skipIf?.(currentAnswers, isSAR)
    ).length;

    const payload = {
      responses: currentAnswers as unknown as Record<string, never>,
      current_step: visibleStepPosition,
      total_steps: totalVisible,
      report_type: reportType as "STR" | "SAR" | "LCT" | "IFT",
      status,
      completed_at: status === "complete" ? new Date().toISOString() : null,
    };

    if (existing) {
      await supabase
        .from("questionnaire_responses")
        .update(payload)
        .eq("id", existing.id);
    } else {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      await supabase.from("questionnaire_responses").insert({
        ...payload,
        case_id: caseId,
        organisation_id: organisationId,
      });
    }
  }

  async function handleContinue() {
    const errs = validateStep(currentStep, answers);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);

    const nextVisiblePosition = history.length + 1;

    if (isLastStep) {
      await persist(answers, nextVisiblePosition, "complete");
      setIsComplete(true);
      setSaving(false);
      router.refresh();
      return;
    }

    await persist(answers, nextVisiblePosition, "draft");

    setHistory((h) => [...h, currentStepIndex]);
    setCurrentStepIndex(nextIndex!);
    setSaving(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleBack() {
    if (history.length === 0) return;
    const prevIndex = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrentStepIndex(prevIndex);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveDraft() {
    setSaving(true);
    await persist(answers, history.length, "draft");
    setSaving(false);
  }

  function handleEdit() {
    setIsComplete(false);
    // Rebuild history up to the last step so Back works correctly
    const visible = getVisibleSteps(answers, isSAR);
    const newHistory = visible.slice(0, -1).map((s) =>
      STEPS.findIndex((st) => st.id === s.id)
    );
    setHistory(newHistory);
    setCurrentStepIndex(STEPS.findIndex((s) => s.id === visible[visible.length - 1].id));
    setErrors({});
  }

  // ── Helpers for displaying saved values ──
  function displayValue(field: FieldDef, val: string | string[] | undefined): string | null {
    if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) return null;
    if (field.type === "checkbox-group") {
      const codes = Array.isArray(val) ? val : [val];
      return codes
        .map((c) => INDICATOR_OPTIONS.find((o) => o.value === c)?.label ?? c)
        .join("\n");
    }
    if (field.type === "country") {
      return COUNTRY_CODE_TO_NAME[val as string] ?? (val as string);
    }
    if (field.type === "select" || field.type === "radio") {
      return field.options?.find((o) => o.value === val)?.label ?? (val as string);
    }
    return val as string;
  }

  // ── Completed state ──
  if (isComplete) {
    const visibleSteps = getVisibleSteps(answers, isSAR);

    return (
      <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green" />
            <h2 className="text-sm font-semibold">Questionnaire complete</h2>
          </div>
          <button
            onClick={handleEdit}
            className="text-[12.5px] font-medium text-accent hover:text-accent-hover"
          >
            Edit answers
          </button>
        </div>

        {/* Summary */}
        <div className="divide-y divide-border">
          {visibleSteps.map((step) => {
            const filledFields = step.fields
              .map((field) => ({
                field,
                display: displayValue(field, answers[field.key]),
              }))
              .filter((f) => f.display !== null);

            if (filledFields.length === 0) return null;

            return (
              <div key={step.id} className="px-5 py-4">
                <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-text-tertiary mb-3">
                  {step.title}
                </h3>
                <div className="space-y-2.5">
                  {filledFields.map(({ field, display }) => (
                    <div key={field.key}>
                      <span className="text-[12px] text-text-secondary block mb-0.5">
                        {field.label}
                      </span>
                      {field.type === "checkbox-group" ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(display as string).split("\n").map((item) => (
                            <span
                              key={item}
                              className="inline-block text-[11.5px] font-medium bg-surface-alt border border-border px-2 py-0.5 rounded-full"
                            >
                              {item.split(" - ")[0]}
                            </span>
                          ))}
                        </div>
                      ) : field.type === "textarea" ? (
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{display}</p>
                      ) : (
                        <p className="text-[13px] font-medium">{display}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-surface-alt">
        <div
          className="h-full bg-accent transition-all duration-500"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] text-text-tertiary font-medium">
            Step {progress.current + 1} of {progress.total}
          </span>
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="text-[12px] text-text-secondary hover:text-text underline underline-offset-2 disabled:opacity-50"
          >
            Save draft
          </button>
        </div>
        <h2 className="font-serif text-xl font-semibold">{currentStep.title}</h2>
        {currentStep.subtitle && (
          <p className="text-text-secondary text-[13.5px] mt-1">
            {currentStep.subtitle}
          </p>
        )}
      </div>

      {/* Fields */}
      <div className="px-6 py-5 space-y-6">
        {currentStep.fields.map((field) => (
          <div key={field.key}>
            {field.type !== "radio" && field.type !== "checkbox-group" ? (
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="text-[13px] font-semibold">
                  {field.label}
                  {field.required && (
                    <span className="text-red ml-0.5">*</span>
                  )}
                </label>
                {field.helper && (
                  <button
                    type="button"
                    onClick={() => toggleHelper(field.key)}
                    className={`shrink-0 transition-colors ${openHelpers[field.key] ? "text-accent" : "text-text-tertiary hover:text-text-secondary"}`}
                    aria-label="Toggle help text"
                  >
                    <Info size={14} />
                  </button>
                )}
              </div>
            ) : field.helper ? (
              <div className="flex items-center justify-end mb-1.5">
                <button
                  type="button"
                  onClick={() => toggleHelper(field.key)}
                  className={`flex items-center gap-1 text-[12px] transition-colors ${openHelpers[field.key] ? "text-accent" : "text-text-tertiary hover:text-text-secondary"}`}
                  aria-label="Toggle help text"
                >
                  <Info size={13} />
                  <span>{openHelpers[field.key] ? "Hide help" : "Show help"}</span>
                </button>
              </div>
            ) : null}

            {field.helper && openHelpers[field.key] && (
              <div className="mb-2 rounded-lg bg-surface-alt border border-border px-3 py-2">
                <p className="text-[12px] text-text-secondary leading-relaxed">
                  {field.helper}
                </p>
              </div>
            )}

            <FieldRenderer
              field={field}
              answers={answers}
              error={errors[field.key]}
              onChange={handleChange}
            />

            {errors[field.key] && (
              <p className="text-red text-[12px] mt-1">{errors[field.key]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
        <button
          onClick={handleBack}
          disabled={history.length === 0 || saving}
          className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        <button
          onClick={handleContinue}
          disabled={saving}
          className="flex items-center gap-1.5 bg-accent text-white text-[13.5px] font-semibold px-5 py-2 rounded-full hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          {saving ? (
            "Saving..."
          ) : isLastStep ? (
            "Complete questionnaire"
          ) : (
            <>
              Continue
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
