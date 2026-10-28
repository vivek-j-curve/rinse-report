"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { COUNTRIES, COUNTRY_CODE_TO_NAME } from "@/lib/country-codes";

export { COUNTRY_CODE_TO_NAME } from "@/lib/country-codes";
export { COUNTRY_NAME_TO_CODE } from "@/lib/country-codes";

export function CountrySelect({
  value,
  onChange,
  placeholder = "Search for a country...",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // value is an ISO code; resolve display name (handle legacy full-name values too)
  const displayName = COUNTRY_CODE_TO_NAME[value] ?? value;

  const filtered = search
    ? COUNTRIES.filter(([, name]) => name.toLowerCase().includes(search.toLowerCase()))
    : COUNTRIES;

  function openDropdown() {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        ref.current && !ref.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const dropdown = open && mounted ? createPortal(
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-surface border border-border rounded-lg shadow-lg overflow-hidden"
    >
      <div className="p-2 border-b border-border">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type to search..."
          className="w-full bg-surface-alt border border-border rounded px-2.5 py-1.5 text-[13px] placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent/30"
        />
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-[13px] text-text-tertiary">
            No countries found
          </div>
        ) : (
          filtered.map(([code, name]) => (
            <button
              key={code}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(code);
                setOpen(false);
                setSearch("");
              }}
              className={`w-full text-left px-3 py-1.5 text-[13px] hover:bg-surface-alt transition-colors ${
                value === code ? "bg-accent/10 text-accent font-medium" : ""
              }`}
            >
              {name}
            </button>
          ))
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (open) { setOpen(false); setSearch(""); } else openDropdown();
        }}
        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] text-left focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent flex items-center justify-between"
      >
        <span className={value ? "" : "text-text-tertiary"}>
          {value ? displayName : placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-text-tertiary">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {dropdown}
    </div>
  );
}
