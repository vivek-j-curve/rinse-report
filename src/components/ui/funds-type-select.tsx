"use client";

import { useState, useRef, useEffect } from "react";

export const FUNDS_TYPES: { code: string; name: string }[] = [
  { code: "-", name: "Unknown" },
  { code: "D", name: "Cash" },
  { code: "N", name: "Electronically held funds" },
  { code: "I", name: "Cheque" },
  { code: "L", name: "Credit card" },
  { code: "M", name: "E-currency / Cryptocurrency" },
  { code: "S", name: "Traveller's cheques" },
  { code: "A", name: "Bank draft" },
  { code: "B", name: "Bearer bond" },
  { code: "C", name: "Bill of exchange" },
  { code: "E", name: "Cash (different currency)" },
  { code: "F", name: "Cash (different denomination)" },
  { code: "G", name: "Casino chips" },
  { code: "H", name: "Certificate of deposit" },
  { code: "J", name: "Counterfeit" },
  { code: "K", name: "Credit" },
  { code: "O", name: "Money order" },
  { code: "P", name: "Other" },
  { code: "Q", name: "Other negotiable instrument" },
  { code: "R", name: "Promissory note" },
];

export function FundsTypeSelect({
  value,
  onChange,
  placeholder = "Select funds type...",
  small = false,
}: {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? FUNDS_TYPES.filter(
        (f) =>
          f.code.toLowerCase().includes(query.toLowerCase()) ||
          f.name.toLowerCase().includes(query.toLowerCase())
      )
    : FUNDS_TYPES;

  const selected = FUNDS_TYPES.find((f) => f.code === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpen() {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSelect(code: string) {
    onChange(code);
    setOpen(false);
    setQuery("");
  }

  const sizeClass = small ? "text-[12px] px-2.5 py-1.5" : "text-[13px] px-3 py-2";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center justify-between gap-2 bg-surface border border-border rounded-lg ${sizeClass} focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent hover:bg-surface-alt/50 transition-colors text-left`}
      >
        {selected ? (
          <span>
            <span className="font-mono font-semibold">{selected.code}</span>
            <span className="text-text-secondary ml-1.5">{selected.name}</span>
          </span>
        ) : (
          <span className="text-text-tertiary">{placeholder}</span>
        )}
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-text-tertiary shrink-0">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-surface border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search funds types..."
              className="w-full bg-surface-alt border border-border rounded-md px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {value && (
              <button
                type="button"
                onClick={() => handleSelect("")}
                className="w-full text-left px-3 py-1.5 text-[12px] text-text-tertiary hover:bg-surface-alt transition-colors"
              >
                Clear selection
              </button>
            )}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-[12px] text-text-tertiary">No results</div>
            )}
            {filtered.map((f) => (
              <button
                key={f.code}
                type="button"
                onClick={() => handleSelect(f.code)}
                className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-surface-alt transition-colors flex items-center gap-2 ${
                  f.code === value ? "bg-accent/10 text-accent" : ""
                }`}
              >
                <span className="font-mono font-semibold w-6 shrink-0">{f.code}</span>
                <span className="text-text-secondary truncate">{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
