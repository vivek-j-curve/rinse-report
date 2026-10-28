"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "@/components/ui/icons";
import { linkSuspicionToCase, getAvailableSuspicionsForCase } from "@/lib/actions/cases";

type Suspicion = {
  id: string;
  description: string;
  created_at: string;
  case?: { id: string; case_number: string; title: string } | null;
};

function parseSuspicionDescription(desc: string): string {
  for (const prefix of ["[ACTIVITY] ", "[TRANSACTION] ", "[BOTH] "]) {
    if (desc.startsWith(prefix)) return desc.slice(prefix.length);
  }
  return desc;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function LinkSuspicionModal({
  caseId,
  reportingEntityId,
}: {
  caseId: string;
  reportingEntityId: string;
}) {
  const [open, setOpen] = useState(false);
  const [suspicions, setSuspicions] = useState<Suspicion[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, startLinking] = useTransition();
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();

  async function openModal() {
    setOpen(true);
    setLoading(true);
    const { data } = await getAvailableSuspicionsForCase(reportingEntityId, caseId);
    setSuspicions((data as Suspicion[]) ?? []);
    setLoading(false);
  }

  function closeModal() {
    setOpen(false);
    setSelected(null);
    setSuspicions([]);
  }

  function handleLink() {
    if (!selected) return;
    startLinking(async () => {
      const result = await linkSuspicionToCase(selected, caseId);
      if (!result.error) {
        closeModal();
        router.refresh();
      }
    });
  }

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[12px] font-medium hover:bg-surface-alt transition-colors text-text-secondary"
      >
        <Plus size={13} />
        Add suspicion
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-surface border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-[15px] font-semibold">Link another suspicion</h2>
              <button
                onClick={closeModal}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-alt transition-colors text-text-tertiary"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm text-text-secondary mb-4">
                Select a suspicion from another case in the same reporting entity to merge into this case.
                The source case will be removed if it becomes empty.
              </p>

              {loading ? (
                <div className="py-8 text-center text-sm text-text-tertiary">Loading…</div>
              ) : suspicions.length === 0 ? (
                <div className="py-8 text-center text-sm text-text-tertiary">
                  No other suspicions available in this reporting entity.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {suspicions.map((s) => {
                    const text = parseSuspicionDescription(s.description);
                    const isSelected = selected === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelected(isSelected ? null : s.id)}
                        className={`w-full text-left px-3 py-3 rounded-lg border transition-colors ${
                          isSelected
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-border-strong hover:bg-surface-alt/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] text-text leading-relaxed line-clamp-2 flex-1">
                            {text}
                          </p>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-accent flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                        {s.case && (
                          <div className="text-[11px] text-text-tertiary mt-1 font-mono">
                            {s.case.case_number} · {s.case.title}
                          </div>
                        )}
                        <div className="text-[11px] text-text-tertiary mt-0.5">
                          {formatDate(s.created_at)}
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
                onClick={handleLink}
                disabled={!selected || linking}
                className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {linking ? "Linking…" : "Link suspicion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
