"use client";

import { useState, useEffect } from "react";

// YYYY-MM-DD → DD/MM/YYYY
function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

// Extract digits, format as DD/MM/YYYY progressively
function formatDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// DD/MM/YYYY (8 digits) → YYYY-MM-DD
function displayToIso(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.length !== 8) return "";
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  const date = new Date(`${y}-${m}-${d}`);
  if (isNaN(date.getTime())) return "";
  return `${y}-${m}-${d}`;
}

export function DateInput({
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  small = false,
  className = "",
}: {
  value: string;
  onChange: (isoValue: string) => void;
  placeholder?: string;
  small?: boolean;
  className?: string;
}) {
  const [display, setDisplay] = useState(() => isoToDisplay(value));

  // Sync when the ISO value changes from outside
  useEffect(() => {
    const incoming = isoToDisplay(value);
    if (incoming !== display) setDisplay(incoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleChange(raw: string) {
    const formatted = formatDigits(raw);
    setDisplay(formatted);
    const iso = displayToIso(formatted);
    onChange(iso); // empty string when incomplete/invalid — caller clears the value
  }

  const isInvalid =
    display.length > 0 &&
    display.replace(/\D/g, "").length === 8 &&
    !displayToIso(display);

  const textSize = small ? "text-[12px]" : "text-[13px]";

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      maxLength={10}
      className={`w-full bg-surface border ${
        isInvalid ? "border-red focus:ring-red/30" : "border-border focus:border-accent focus:ring-accent/30"
      } rounded-lg px-3 py-2 ${textSize} placeholder:text-text-tertiary focus:outline-none focus:ring-2 font-mono ${className}`}
    />
  );
}
