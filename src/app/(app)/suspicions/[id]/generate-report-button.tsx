"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "@/components/ui/icons";
import { createDraftReport } from "@/lib/actions/reports";
import type { ReportType } from "@/types/database";

export function GenerateReportButton({
  caseId,
  defaultReportType,
  suspicionType = "transaction",
}: {
  caseId: string;
  defaultReportType?: ReportType;
  suspicionType?: "transaction" | "activity";
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const lockedType = suspicionType === "activity" ? "SAR" : null;
  const [reportType, setReportType] = useState<ReportType>(
    lockedType ?? defaultReportType ?? "STR"
  );
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
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
    <div className="bg-surface border border-border rounded-[10px] p-5">
      <h2 className="text-sm font-semibold mb-1">Create FIU Report</h2>
      <p className="text-text-tertiary text-[12px] mb-4">
        Create a goAML report to fill in and submit to the Financial
        Intelligence Unit.
      </p>

      {error && (
        <div className="rounded-lg bg-red-bg border border-red-border px-3 py-2 text-[13px] text-red mb-3">
          {error}
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-[12px] font-medium text-text-secondary mb-1">
            Report Type
          </label>
          {lockedType ? (
            <div className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2 text-[13px] text-text-secondary flex items-center justify-between">
              <span className="font-medium text-text">SAR - Suspicious Activity Report</span>
              <span className="text-[11px] text-text-tertiary">Locked - activity suspicion</span>
            </div>
          ) : (
            <>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              >
                <option value="STR">STR - Suspicious Transaction Report</option>
                <option value="LCT">LCT - Large Cash Transaction</option>
                <option value="IFT">IFT - International Funds Transfer</option>
              </select>
              <p className="text-[11px] text-text-tertiary mt-1">SAR is for activity suspicions only - the type is set when raising the suspicion.</p>
            </>
          )}
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          <FileText size={15} />
          {creating ? "Creating..." : "Create Report"}
        </button>
      </div>
    </div>
  );
}
