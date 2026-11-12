"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  searchable = false,
  small = false,
  className = "",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  searchable?: boolean;
  small?: boolean;
  className?: string;
  disabled?: boolean;
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

  const selected = options.find((o) => o.value === value);

  const filtered = searchable && search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  function openDropdown() {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropHeight = Math.min(260, filtered.length * 36 + (searchable ? 48 : 0));
      const above = spaceBelow < dropHeight + 8 && rect.top > dropHeight + 8;
      setDropdownStyle({
        position: "fixed",
        [above ? "bottom" : "top"]: above ? window.innerHeight - rect.top + 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    setOpen(true);
    if (searchable) setTimeout(() => inputRef.current?.focus(), 0);
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

  const textSize = small ? "text-[12px]" : "text-[13px]";

  const dropdown = open && mounted ? createPortal(
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
    >
      {searchable && (
        <div className="p-2 border-b border-border">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full bg-surface-alt border border-border rounded px-2.5 py-1.5 text-[13px] placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </div>
      )}
      <div className="max-h-[220px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-[13px] text-text-tertiary">No results</div>
        ) : (
          filtered.map((o) => (
            <button
              key={o.value}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
                setSearch("");
              }}
              className={`w-full text-left px-3 py-2 ${textSize} hover:bg-surface-alt transition-colors ${
                value === o.value ? "bg-accent/10 text-accent font-medium" : "text-text"
              }`}
            >
              {o.label}
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
        disabled={disabled}
        onClick={() => {
          if (open) { setOpen(false); setSearch(""); } else openDropdown();
        }}
        className={`w-full bg-surface border border-border rounded-lg px-3 py-2 ${textSize} text-left focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent flex items-center justify-between gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className={selected ? "text-text" : "text-text-tertiary"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`shrink-0 text-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {dropdown}
    </div>
  );
}
