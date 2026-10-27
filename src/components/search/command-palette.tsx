"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FileText, User, Hash, Calendar, CreditCard, MapPin } from "@/components/ui/icons";
import { searchCases, type SearchResult } from "@/lib/actions/search";

const MATCH_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  case_number: { label: "Case number", icon: <Hash size={12} /> },
  title: { label: "Title", icon: <FileText size={12} /> },
  creator: { label: "Created by", icon: <User size={12} /> },
  subject_name: { label: "Subject", icon: <User size={12} /> },
  date_of_birth: { label: "Date of birth", icon: <Calendar size={12} /> },
  id_number: { label: "ID number", icon: <CreditCard size={12} /> },
  address: { label: "Address", icon: <MapPin size={12} /> },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-border text-text-secondary",
  under_review: "bg-amber-bg text-amber border-amber-border",
  submitted: "bg-blue-bg text-blue border-blue-border",
  archived: "bg-surface-alt text-text-secondary",
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setQuery("");
      setResults([]);
      setSelected(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        const res = await searchCases(query);
        setResults(res);
        setSelected(0);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  function navigate(result: SearchResult) {
    router.push(`/suspicions/${result.case_id}`);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      navigate(results[selected]);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative w-full max-w-[560px] mx-4 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={16} className="text-text-secondary shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search cases, subjects, IDs, addresses…"
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-text-tertiary outline-none"
          />
          {isPending && (
            <div className="w-4 h-4 border-2 border-border border-t-accent rounded-full animate-spin shrink-0" />
          )}
          <button
            onClick={onClose}
            className="shrink-0 text-text-secondary hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-[360px] overflow-y-auto py-1.5">
            {results.map((r, i) => {
              const matchInfo = MATCH_TYPE_LABELS[r.match_type] ?? { label: r.match_type, icon: <Search size={12} /> };
              const statusCls = STATUS_COLORS[r.status] ?? "bg-border text-text-secondary";
              return (
                <li key={`${r.case_id}-${i}`}>
                  <button
                    onMouseEnter={() => setSelected(i)}
                    onClick={() => navigate(r)}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                      i === selected ? "bg-surface-alt" : "hover:bg-surface-alt"
                    }`}
                  >
                    {/* Case icon */}
                    <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <FileText size={14} />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-foreground truncate">
                          {r.title || r.case_number}
                        </span>
                        <span className="text-[11px] text-text-tertiary font-mono shrink-0">
                          {r.case_number}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-text-secondary" style={{ display: "flex" }}>
                          {matchInfo.icon}
                        </span>
                        <span className="text-[11px] text-text-secondary truncate">
                          {matchInfo.label}: {r.match_value}
                        </span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded border ${statusCls}`}
                    >
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Empty state */}
        {query.trim().length >= 2 && results.length === 0 && !isPending && (
          <div className="px-4 py-8 text-center text-[13px] text-text-secondary">
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Hint footer */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[11px] text-text-tertiary">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
