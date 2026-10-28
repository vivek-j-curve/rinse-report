"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "@/components/ui/icons";
import { linkSuspicionToCase, getAvailableCasesForSuspicion } from "@/lib/actions/cases";

type AvailableCase = {
  id: string;
  case_number: string;
  title: string;
  status: string;
  suspicions: { id: string }[];
};

export function MoveToCaseModal({
  suspicionId,
  currentCaseId,
  reportingEntityId,
}: {
  suspicionId: string;
  currentCaseId: string;
  reportingEntityId: string;
}) {
  const [open, setOpen] = useState(false);
  const [cases, setCases] = useState<AvailableCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [moving, startMoving] = useTransition();
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();

  async function openModal() {
    setOpen(true);
    setLoading(true);
    const { data } = await getAvailableCasesForSuspicion(reportingEntityId, currentCaseId);
    setCases((data as AvailableCase[]) ?? []);
    setLoading(false);
  }

  function closeModal() {
    setOpen(false);
    setSelected(null);
    setCases([]);
  }

  function handleMove() {
    if (!selected) return;
    startMoving(async () => {
      const result = await linkSuspicionToCase(suspicionId, selected);
      if (!result.error) {
        closeModal();
        router.push(`/cases/${selected}`);
      }
    });
  }

  const STATUS_LABELS: Record<string, string> = {
    raised: "Raised",
    investigating: "Investigating",
    to_file: "To File",
    draft: "Draft",
  };

  return (
    <>
      <button
        onClick={openModal}
        className="w-full mt-3 px-3 py-2 rounded-lg border border-border text-[12px] font-medium text-text-secondary hover:bg-surface-alt transition-colors text-left"
      >
        Move to another case…
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-surface border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-[15px] font-semibold">Move to another case</h2>
              <button
                onClick={closeModal}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-alt transition-colors text-text-tertiary"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm text-text-secondary mb-4">
                Select the case you want to move this suspicion into. The current case will be removed if it becomes empty.
              </p>

              {loading ? (
                <div className="py-8 text-center text-sm text-text-tertiary">Loading…</div>
              ) : cases.length === 0 ? (
                <div className="py-8 text-center text-sm text-text-tertiary">
                  No other open cases in this reporting entity.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {cases.map((c) => {
                    const isSelected = selected === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelected(isSelected ? null : c.id)}
                        className={`w-full text-left px-3 py-3 rounded-lg border transition-colors ${
                          isSelected
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-border-strong hover:bg-surface-alt/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="text-[13px] font-medium">{c.title}</div>
                            <div className="text-[11px] text-text-tertiary mt-0.5 font-mono">
                              {c.case_number}
                              {" · "}
                              {STATUS_LABELS[c.status] ?? c.status}
                              {" · "}
                              {c.suspicions.length} suspicion{c.suspicions.length !== 1 ? "s" : ""}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-accent flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-surface-alt transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMove}
                disabled={!selected || moving}
                className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {moving ? "Moving…" : "Move suspicion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
