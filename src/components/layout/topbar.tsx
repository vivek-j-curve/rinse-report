"use client";

import { Bell, Search, ChevronDown } from "@/components/ui/icons";

export function Topbar() {
  return (
    <header className="flex items-center gap-3 px-6 py-3 border-b border-border bg-surface sticky top-0 z-10">
      <button className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border rounded-md text-[13px] font-medium text-foreground bg-surface hover:border-border-strong transition-colors">
        Hamilton &amp; Associates
        <ChevronDown size={14} />
      </button>
      <span className="text-xs text-text-tertiary">Law Firm</span>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-text-tertiary text-[13px] bg-surface-alt min-w-[180px]">
        <Search size={14} />
        Search…
        <kbd className="ml-auto text-[11px] px-1.5 py-px border border-border rounded bg-surface text-text-tertiary">
          ⌘K
        </kbd>
      </div>

      <button className="relative w-[34px] h-[34px] flex items-center justify-center rounded-md text-text-secondary hover:bg-sidebar-hover transition-colors">
        <Bell size={18} />
        <span className="absolute top-[7px] right-[7px] w-[7px] h-[7px] bg-red rounded-full border-2 border-surface" />
      </button>

      <div className="w-[30px] h-[30px] rounded-full bg-accent-subtle text-accent flex items-center justify-center text-xs font-semibold cursor-pointer">
        VK
      </div>
    </header>
  );
}
