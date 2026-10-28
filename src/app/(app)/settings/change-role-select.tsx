"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { updateMemberRole } from "@/lib/actions/invitations";
import type { UserRole } from "@/types/database";

const ROLE_OPTIONS: { value: UserRole; label: string; colors: string }[] = [
  { value: "admin",   label: "Admin",   colors: "bg-accent/10 text-accent border-accent/20" },
  { value: "analyst", label: "Analyst", colors: "bg-green/10 text-green border-green/20" },
  { value: "viewer",  label: "Viewer",  colors: "bg-border text-text-secondary border-border" },
];

function roleColors(role: UserRole) {
  return ROLE_OPTIONS.find((o) => o.value === role)?.colors ?? "bg-border text-text-secondary border-border";
}

function roleLabel(role: UserRole) {
  return ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
}

export function ChangeRoleSelect({
  memberId,
  currentRole,
}: {
  memberId: string;
  currentRole: UserRole;
}) {
  const [role, setRole] = useState<UserRole>(currentRole);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function openDropdown() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        zIndex: 9999,
      });
    }
    setOpen(true);
  }

  async function select(newRole: UserRole) {
    setOpen(false);
    if (newRole === role) return;
    setLoading(true);
    const prev = role;
    setRole(newRole);
    const result = await updateMemberRole(memberId, newRole);
    if (result.error) {
      setRole(prev);
      alert(result.error);
    }
    setLoading(false);
  }

  const dropdown = open && mounted ? createPortal(
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-surface border border-border rounded-lg shadow-lg overflow-hidden py-1 min-w-[110px]"
    >
      {ROLE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => select(opt.value)}
          className={`w-full text-left px-3 py-1.5 text-[13px] flex items-center gap-2 hover:bg-surface-alt transition-colors ${
            opt.value === role ? "font-medium" : ""
          }`}
        >
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${opt.colors}`}>
            {opt.label}
          </span>
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={loading}
        onClick={() => open ? setOpen(false) : openDropdown()}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-opacity disabled:opacity-50 ${roleColors(role)}`}
      >
        {roleLabel(role)}
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="opacity-60 shrink-0">
          <path d="M2 3L4 5L6 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {dropdown}
    </>
  );
}
