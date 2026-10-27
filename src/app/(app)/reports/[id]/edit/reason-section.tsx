"use client";

import { useState, useEffect, useRef } from "react";
import { updateReportReason } from "@/lib/actions/reports";

function InfoToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold border transition-colors ${
        open ? "bg-accent text-white border-accent" : "border-border text-text-tertiary hover:border-accent hover:text-accent"
      }`}
      title={open ? "Hide help" : "Show help"}
    >
      i
    </button>
  );
}

export function ReasonSection({
  reportId,
  initialReason,
  initialAction,
  initialFiuRefNumber,
  hasScamIndicator,
  reportType,
  onUpdate,
  onRegisterSave,
  onRegisterValidate,
}: {
  reportId: string;
  initialReason: string;
  initialAction: string;
  initialFiuRefNumber?: string;
  hasScamIndicator?: boolean;
  reportType?: string;
  onUpdate: () => void;
  onRegisterSave?: (fn: (() => Promise<void>) | null) => void;
  onRegisterValidate?: (fn: (() => string | null) | null) => void;
}) {
  const [reason, setReason] = useState(initialReason);
  const [action, setAction] = useState(initialAction);
  const [fiuRefNumber, setFiuRefNumber] = useState(initialFiuRefNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [useTemplate, setUseTemplate] = useState(reportType === "SAR" && !initialReason);
  const [tmplIntro, setTmplIntro] = useState("");
  const [tmplBody, setTmplBody] = useState("");
  const [tmplConclusion, setTmplConclusion] = useState("");
  const [openHelpers, setOpenHelpers] = useState<Record<string, boolean>>({});
  function toggleHelper(key: string) {
    setOpenHelpers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Refs so registered callbacks always see current values without stale closures
  const reasonRef = useRef(reason);
  reasonRef.current = reason;
  const actionRef = useRef(action);
  actionRef.current = action;
  const fiuRefNumberRef = useRef(fiuRefNumber);
  fiuRefNumberRef.current = fiuRefNumber;
  const tmplIntroRef = useRef(tmplIntro);
  tmplIntroRef.current = tmplIntro;
  const tmplBodyRef = useRef(tmplBody);
  tmplBodyRef.current = tmplBody;
  const tmplConclusionRef = useRef(tmplConclusion);
  tmplConclusionRef.current = tmplConclusion;
  const useTemplateRef = useRef(useTemplate);
  useTemplateRef.current = useTemplate;

  // Stable ref to latest handleSave so the registered function never goes stale
  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    if (!onRegisterSave) return;
    onRegisterSave(() => handleSaveRef.current());
    return () => onRegisterSave(null);
  }, [onRegisterSave]);

  useEffect(() => {
    if (!onRegisterValidate) return;
    onRegisterValidate(() => {
      const value = useTemplateRef.current
        ? [tmplIntroRef.current, tmplBodyRef.current, tmplConclusionRef.current]
            .filter((s) => s.trim())
            .join("\n\n")
        : reasonRef.current;
      if (!value.trim()) return "Please enter the reason for suspicion before continuing.";
      return null;
    });
    return () => onRegisterValidate(null);
  }, [onRegisterValidate]);

  const combineTemplate = (): string =>
    [tmplIntro, tmplBody, tmplConclusion].filter((s) => s.trim()).join("\n\n");

  async function handleSave() {
    const saveReason = useTemplateRef.current
      ? [tmplIntroRef.current, tmplBodyRef.current, tmplConclusionRef.current]
          .filter((s) => s.trim())
          .join("\n\n")
      : reasonRef.current;
    setSaving(true);
    await updateReportReason(reportId, saveReason, actionRef.current, fiuRefNumberRef.current);
    if (useTemplateRef.current) setReason(saveReason);
    setSaving(false);
    setSaved(true);
    onUpdate();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold">Reason & Action</h3>
          <p className="text-[12px] text-text-tertiary mt-0.5">
            Explain the grounds for suspicion and any actions taken. This is the
            narrative section of your goAML report.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-[13px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : saved ? "Saved" : "Save"}
        </button>
      </div>

      <div className="space-y-4">
        {hasScamIndicator && (
          <div className="rounded-lg bg-amber-bg border border-amber-border px-4 py-3 text-[13px]">
            <p className="font-semibold text-amber">Scam report — prefix required</p>
            <p className="text-text-secondary mt-0.5">
              The CS1 indicator is selected. This Reason for Suspicion must begin with the word{" "}
              <code className="font-mono font-bold">SCAM</code> (all capitals) — for example:{" "}
              <span className="font-mono text-[12px]">SCAM — The customer received NZD 45,000...</span>
            </p>
          </div>
        )}

        <div>
          <div className="flex items-center mb-1.5">
            <label className="text-[12.5px] font-semibold">
              FIU Reference Number
            </label>
            <span className="ml-1.5 text-[11px] text-text-tertiary">(optional)</span>
            <InfoToggle open={!!openHelpers.fiuRef} onToggle={() => toggleHelper("fiuRef")} />
          </div>
          {openHelpers.fiuRef && (
            <p className="text-[12px] text-text-tertiary mb-2 rounded-lg bg-surface-alt border border-border px-3 py-2">
              When you submit this report via the goAML portal, the FIU assigns a reference number. Enter it here to include it in amended re-submissions (<code className="font-mono text-[11px]">fiu_ref_number</code> in the XML).
            </p>
          )}
          <input
            type="text"
            value={fiuRefNumber}
            onChange={(e) => { setFiuRefNumber(e.target.value); setSaved(false); }}
            placeholder="e.g. NZ-STR-2025-001234"
            className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-[13.5px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent font-mono"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center">
              <label className="text-[12.5px] font-semibold">
                Reason for Suspicion
              </label>
              <InfoToggle open={!!openHelpers.reason} onToggle={() => toggleHelper("reason")} />
            </div>
            {reportType === "SAR" && (
              <button
                type="button"
                onClick={() => { setUseTemplate((v) => !v); setSaved(false); }}
                className="text-[11.5px] font-medium text-accent hover:underline"
              >
                {useTemplate ? "Switch to freeform" : "Use SAR template"}
              </button>
            )}
          </div>

          {useTemplate ? (
            <div className="space-y-3">
              <p className="text-[12px] text-text-tertiary">
                Fill in each section — they will be combined into the goAML &lt;reason&gt; element when saved.
              </p>
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Introduction <span className="font-normal text-text-tertiary">— Who, what happened, and when suspicion arose</span>
                </label>
                <textarea
                  rows={3}
                  value={tmplIntro}
                  onChange={(e) => { setTmplIntro(e.target.value); setSaved(false); }}
                  placeholder="e.g. On [date], [subject name] ([role]) conducted a series of transactions that came to our attention during [routine review / EDD review]. Our suspicion arose because..."
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-[13px] leading-relaxed placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Body <span className="font-normal text-text-tertiary">— 5Ws + How: Who, What, When, Where, Why suspicious, How</span>
                </label>
                <textarea
                  rows={6}
                  value={tmplBody}
                  onChange={(e) => { setTmplBody(e.target.value); setSaved(false); }}
                  placeholder={"Who: [parties involved, relationships]\nWhat: [nature of funds/activity, amounts]\nWhen: [key dates, frequency]\nWhere: [accounts, locations, jurisdictions]\nWhy suspicious: [unusual patterns, red flags, indicators applied]\nHow: [mechanism — e.g. cash deposits, wire transfers, crypto conversions]"}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-[13px] leading-relaxed placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none font-mono text-[12px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Conclusion <span className="font-normal text-text-tertiary">— Assessment and overall judgement</span>
                </label>
                <textarea
                  rows={3}
                  value={tmplConclusion}
                  onChange={(e) => { setTmplConclusion(e.target.value); setSaved(false); }}
                  placeholder="e.g. Based on the above, we believe this activity may be linked to [money laundering / fraud / scam activity] and warrants reporting to the FIU."
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-[13px] leading-relaxed placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
                />
              </div>
              <div className="text-right">
                <span className={`text-[11px] ${combineTemplate().length > 7500 ? "text-red" : "text-text-tertiary"}`}>
                  {combineTemplate().length} / 8,000 characters (combined)
                </span>
              </div>
            </div>
          ) : (
            <>
              {openHelpers.reason && (
                <p className="text-[12px] text-text-tertiary mb-2 rounded-lg bg-surface-alt border border-border px-3 py-2">
                  Provide a detailed explanation of why you consider this activity
                  suspicious. Include facts, patterns, and context that led to the
                  suspicion. This text appears in the goAML &lt;reason&gt; element.
                </p>
              )}
              <textarea
                rows={8}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setSaved(false);
                }}
                placeholder="Describe the suspicious activity, including:&#10;- What was observed&#10;- Why it's unusual compared to the customer's normal activity&#10;- Any relevant background or context&#10;- How the indicators above apply to this case"
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-[13.5px] leading-relaxed placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
              />
              <div className="text-right mt-1">
                <span className={`text-[11px] ${reason.length > 7500 ? "text-red" : "text-text-tertiary"}`}>
                  {reason.length} / 8,000 characters
                </span>
              </div>
            </>
          )}
        </div>

        <div>
          <div className="flex items-center mb-1.5">
            <label className="text-[12.5px] font-semibold">Action Taken</label>
            <InfoToggle open={!!openHelpers.action} onToggle={() => toggleHelper("action")} />
          </div>
          {openHelpers.action && (
            <p className="text-[12px] text-text-tertiary mb-2 rounded-lg bg-surface-alt border border-border px-3 py-2">
              Describe any actions the reporting entity has taken in response to
              the suspicion (e.g. account frozen, transaction delayed, enhanced
              monitoring applied).
            </p>
          )}
          <textarea
            rows={4}
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setSaved(false);
            }}
            placeholder="e.g. Account placed on enhanced monitoring. Future transactions above $5,000 flagged for manual review."
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-[13.5px] leading-relaxed placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
          />
        </div>
      </div>
    </div>
  );
}
