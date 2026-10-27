"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { amendReport } from "@/lib/actions/reports";

export function AmendButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAmend() {
    setError(null);
    startTransition(async () => {
      const result = await amendReport(reportId);
      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("success" in result && result.success) {
        router.push(`/reports/${result.newReportId}/edit`);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleAmend}
        disabled={isPending}
        className="px-4 py-1.5 rounded-full text-[13px] font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-60 transition-colors"
      >
        {isPending ? "Creating amendment…" : "Amend this report"}
      </button>
      {error && <p className="text-[11px] text-red">{error}</p>}
    </div>
  );
}
