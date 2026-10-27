"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SuspicionStatus } from "@/types/database";

const statusFlow: { value: SuspicionStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "raised", label: "Raised" },
  { value: "investigating", label: "Investigating" },
  { value: "to_file", label: "To File" },
  { value: "filed", label: "Filed" },
  { value: "resolved", label: "Resolved" },
];

export function StatusUpdater({
  caseId,
  currentStatus,
}: {
  caseId: string;
  currentStatus: SuspicionStatus;
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function handleStatusChange(newStatus: SuspicionStatus) {
    setUpdating(true);
    const supabase = createClient();
    await supabase.from("cases").update({ status: newStatus }).eq("id", caseId);
    router.refresh();
    setUpdating(false);
  }

  return (
    <select
      value={currentStatus}
      onChange={(e) =>
        handleStatusChange(e.target.value as SuspicionStatus)
      }
      disabled={updating}
      className="bg-surface border border-border rounded-lg px-3 py-2 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:opacity-60"
    >
      {statusFlow.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
