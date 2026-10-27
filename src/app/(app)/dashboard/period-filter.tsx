"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

const OPTIONS = [
  { label: "30d", value: "30" },
  { label: "90d", value: "90" },
  { label: "All time", value: "all" },
];

export function PeriodFilter({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const set = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("period", value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex items-center gap-0.5 bg-surface-alt border border-border rounded-full p-0.5">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => set(o.value)}
          className={`px-3 py-1 rounded-full text-[12.5px] font-medium transition-colors ${
            current === o.value
              ? "bg-surface border border-border text-foreground shadow-sm"
              : "text-text-secondary hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
