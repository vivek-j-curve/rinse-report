"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SlaBadge } from "@/components/ui/badge";
import { updateCaseStatus } from "@/lib/actions/cases";
import type { SuspicionStatus } from "@/types/database";

type CaseItem = {
  id: string;
  case_number: string;
  title: string;
  status: SuspicionStatus;
  sla_deadline: string | null;
  created_at: string;
  suspicions: { id: string; description: string }[] | null;
  creator: { full_name: string } | null;
};

const columnConfig: {
  key: SuspicionStatus;
  label: string;
  color: string;
}[] = [
  { key: "draft", label: "Draft", color: "bg-text-tertiary" },
  { key: "raised", label: "Suspicion Raised", color: "bg-accent" },
  { key: "investigating", label: "Investigating", color: "bg-amber" },
  { key: "to_file", label: "To File with FIU", color: "bg-red" },
  { key: "filed", label: "Filed with FIU", color: "bg-green" },
];

function countBizDays(from: Date, to: Date): number {
  let count = 0;
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  if (d >= end) return 0;
  while (d < end) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

function getSlaInfo(slaDeadline: string | null): {
  status: "breached" | "urgent" | "ok";
  label: string;
  due: string;
} {
  if (!slaDeadline) return { status: "ok", label: "No deadline", due: "" };
  const now = new Date();
  const deadline = new Date(slaDeadline);
  const due = deadline.toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
  if (deadline < now) return { status: "breached", label: "Overdue", due };
  const bizDays = countBizDays(now, deadline);
  if (bizDays === 0) return { status: "urgent", label: "Due today", due };
  if (bizDays === 1) return { status: "urgent", label: "1 biz day left", due };
  if (bizDays <= 2) return { status: "urgent", label: `${bizDays} biz days left`, due };
  return { status: "ok", label: `${bizDays} biz days left`, due };
}

export function KanbanBoard({ cases }: { cases: CaseItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(cases);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<SuspicionStatus | null>(null);

  const columns = columnConfig.map((col) => ({
    ...col,
    items: items.filter((c) => c.status === col.key),
  }));

  function handleDragStart(e: React.DragEvent, caseId: string) {
    setDragId(caseId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", caseId);
  }

  function handleDragOver(e: React.DragEvent, colKey: SuspicionStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(colKey);
  }

  function handleDragLeave() {
    setDropTarget(null);
  }

  async function handleDrop(e: React.DragEvent, newStatus: SuspicionStatus) {
    e.preventDefault();
    setDropTarget(null);
    const caseId = e.dataTransfer.getData("text/plain");
    if (!caseId) return;

    const item = items.find((c) => c.id === caseId);
    if (!item || item.status === newStatus) {
      setDragId(null);
      return;
    }

    setItems((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c))
    );
    setDragId(null);

    const result = await updateCaseStatus(caseId, newStatus);
    if (result.error) {
      setItems((prev) =>
        prev.map((c) =>
          c.id === caseId ? { ...c, status: item.status } : c
        )
      );
    }
    router.refresh();
  }

  function handleDragEnd() {
    setDragId(null);
    setDropTarget(null);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map((col) => (
        <div
          key={col.key}
          className={`flex-1 min-w-[260px] rounded-lg transition-colors ${
            dropTarget === col.key ? "bg-surface-alt/50 ring-2 ring-accent/20" : ""
          }`}
          onDragOver={(e) => handleDragOver(e, col.key)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, col.key)}
        >
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className={`w-2 h-2 rounded-full ${col.color}`} />
            <span className="text-[13px] font-semibold">{col.label}</span>
            <span className="text-[12px] text-text-tertiary ml-auto">
              {col.items.length}
            </span>
          </div>
          <div className="space-y-2.5 min-h-[100px]">
            {col.items.map((item) => {
              const sla = getSlaInfo(item.sla_deadline);
              const initials =
                item.creator?.full_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() ?? "??";

              return (
                <Link
                  key={item.id}
                  href={`/suspicions/${item.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragEnd={handleDragEnd}
                  className={`block bg-surface border border-border rounded-lg p-3.5 cursor-grab hover:border-border-strong transition-all ${
                    dragId === item.id ? "opacity-40 scale-95" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[12px] text-text-tertiary font-medium">
                      {item.case_number}
                    </span>
                  </div>
                  <p className="text-[13.5px] font-medium leading-snug mb-3">
                    {item.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <SlaBadge status={sla.status}>
                      {sla.label}{sla.due ? ` · ${sla.due}` : ""}
                    </SlaBadge>
                    <div className="w-6 h-6 rounded-full bg-accent-subtle text-accent flex items-center justify-center text-[10px] font-semibold">
                      {initials}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
