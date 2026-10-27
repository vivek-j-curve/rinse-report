import { type ReactNode } from "react";

type SlaStatus = "breached" | "urgent" | "ok";

const slaStyles: Record<SlaStatus, string> = {
  breached: "bg-red-bg text-red border-red-border",
  urgent: "bg-amber-bg text-amber border-amber-border",
  ok: "bg-green-bg text-green border-green-border",
};

export function SlaBadge({
  status,
  children,
}: {
  status: SlaStatus;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center text-[11.5px] font-medium px-2 py-0.5 rounded border whitespace-nowrap ${slaStyles[status]}`}
    >
      {children}
    </span>
  );
}

type ReportType = "STR" | "SAR" | "LCT" | "IFT";

export function TypeBadge({ type }: { type: ReportType }) {
  return (
    <span className="inline-flex items-center text-[11px] font-semibold px-1.5 py-px rounded bg-surface-alt border border-border text-text-secondary tracking-wide">
      {type}
    </span>
  );
}
