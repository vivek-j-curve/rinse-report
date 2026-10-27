"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, X } from "@/components/ui/icons";
import { createDraftReport, getCaseSubjectPreview } from "@/lib/actions/reports";
import type { ReportType } from "@/types/database";

type CaseOption = {
  id: string;
  case_number: string;
  title: string;
  suspicion_type?: "transaction" | "activity";
};

type SubjectPreview = {
  first_names: string;
  last_name: string;
  date_of_birth: string;
  id_type: string;
  id_number: string;
  nationality: string;
  occupation: string;
} | null;

export function CreateReportModal({ cases }: { cases: CaseOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [caseId, setCaseId] = useState("");
  const [reportType, setReportType] = useState<ReportType>("STR");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subjectPreview, setSubjectPreview] = useState<SubjectPreview>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function loadPreview(id: string) {
    if (!id) { setSubjectPreview(null); return; }
    setLoadingPreview(true);
    const res = await getCaseSubjectPreview(id);
    setLoadingPreview(false);
    if ("data" in res) setSubjectPreview(res.data ?? null);
  }

  function handleOpen() {
    const firstCase = cases[0];
    const firstId = firstCase?.id ?? "";
    setCaseId(firstId);
    setReportType(firstCase?.suspicion_type === "activity" ? "SAR" : "STR");
    setError(null);
    setSubjectPreview(null);
    setLoadingPreview(!!firstId);
    setOpen(true);
    if (firstId) loadPreview(firstId);
  }

  async function handleCaseChange(id: string) {
    setCaseId(id);
    setSubjectPreview(null);
    setLoadingPreview(!!id);
    loadPreview(id);
    const selected = cases.find((c) => c.id === id);
    if (selected?.suspicion_type === "activity") {
      setReportType("SAR");
    } else {
      setReportType("STR");
    }
  }

  async function handleCreate() {
    if (!caseId) {
      setError("Please select a suspicion");
      return;
    }
    setCreating(true);
    setError(null);
    const res = await createDraftReport(caseId, reportType);
    if ("error" in res && res.error) {
      setError(res.error);
      setCreating(false);
      return;
    }
    if ("report_id" in res && res.report_id) {
      router.push(`/reports/${res.report_id}/edit`);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover transition-colors"
      >
        <FileText size={15} />
        Create Report
      </button>

      {open && (
        <div
          ref={overlayRef}
          onClick={(e) => {
            if (e.target === overlayRef.current) setOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <div className="bg-surface border border-border rounded-[14px] shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold">Create FIU Report</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md hover:bg-surface-alt border border-transparent hover:border-border transition-colors"
              >
                <X size={16} className="text-text-secondary" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1.5">
                  Suspicion / Case
                </label>
                {cases.length === 0 ? (
                  <p className="text-[13px] text-text-tertiary">
                    No active suspicions found. Raise a suspicion first.
                  </p>
                ) : (
                  <select
                    value={caseId}
                    onChange={(e) => handleCaseChange(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  >
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.case_number} - {c.title}
                      </option>
                    ))}
                  </select>
                )}

                {caseId && loadingPreview && (
                  <p className="mt-2 text-[12px] text-text-tertiary">Checking questionnaire data...</p>
                )}
                {caseId && !loadingPreview && subjectPreview && (
                  <div className="mt-2 rounded-lg bg-surface-alt border border-border px-3 py-2.5">
                    <p className="text-[12px] font-medium text-text-secondary">Questionnaire data found — will be pre-filled</p>
                    <p className="text-[11.5px] text-text-tertiary mt-0.5">
                      Reason, subject details, transaction, and accounts will be imported into the report. You can edit everything after.
                    </p>
                  </div>
                )}
                {caseId && !loadingPreview && subjectPreview === null && (
                  <div className="mt-2 rounded-lg bg-surface-alt border border-border px-3 py-2.5">
                    <p className="text-[12px] font-medium text-text-secondary">No questionnaire data</p>
                    <p className="text-[11.5px] text-text-tertiary mt-0.5">
                      The report will be created empty. You can{" "}
                      <Link href={`/suspicions/${caseId}`} onClick={() => setOpen(false)} className="underline hover:text-text">
                        complete the questionnaire first
                      </Link>
                      {" "}or add all details manually in the report builder.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1.5">
                  Report Type
                </label>
                {(() => {
                  const selectedCase = cases.find((c) => c.id === caseId);
                  const isActivityLocked = selectedCase?.suspicion_type === "activity";
                  if (isActivityLocked) {
                    return (
                      <div className="rounded-lg border border-border bg-surface-alt px-3 py-2.5 flex items-center justify-between">
                        <div>
                          <div className="text-[13px] font-semibold">SAR</div>
                          <div className="text-[11px] text-text-tertiary mt-0.5">Suspicious Activity Report</div>
                        </div>
                        <span className="text-[11px] text-text-tertiary">Locked - activity suspicion</span>
                      </div>
                    );
                  }
                  return (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            { value: "STR", label: "STR", desc: "Suspicious Transaction" },
                            { value: "LCT", label: "LCT", desc: "Large Cash Transaction" },
                            { value: "IFT", label: "IFT", desc: "Intl Funds Transfer" },
                          ] as const
                        ).map((t) => (
                          <button
                            key={t.value}
                            onClick={() => setReportType(t.value)}
                            className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                              reportType === t.value
                                ? "border-accent bg-accent/10"
                                : "border-border hover:bg-surface-alt"
                            }`}
                          >
                            <div className={`text-[13px] font-semibold ${reportType === t.value ? "text-accent" : ""}`}>
                              {t.label}
                            </div>
                            <div className="text-[11px] text-text-tertiary mt-0.5">{t.desc}</div>
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-text-tertiary mt-1.5">
                        SAR (Suspicious Activity Report) is only available for activity-type suspicions - raise an activity suspicion first.
                      </p>
                    </>
                  );
                })()}
              </div>

              {error && (
                <div className="rounded-lg bg-red-bg border border-red-border px-3 py-2 text-[13px] text-red">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleCreate}
                  disabled={creating || cases.length === 0 || loadingPreview}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover transition-colors disabled:opacity-60"
                >
                  <FileText size={15} />
                  {creating ? "Creating..." : "Create & Open Report"}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 text-[13px] font-medium border border-border rounded-full hover:bg-surface-alt transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
