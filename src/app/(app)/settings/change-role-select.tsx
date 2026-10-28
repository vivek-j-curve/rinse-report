"use client";

import { useState } from "react";
import { updateMemberRole } from "@/lib/actions/invitations";
import type { UserRole } from "@/types/database";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "analyst", label: "Analyst" },
  { value: "viewer", label: "Viewer" },
];

export function ChangeRoleSelect({
  memberId,
  currentRole,
}: {
  memberId: string;
  currentRole: UserRole;
}) {
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as UserRole;
    if (newRole === currentRole) return;
    setLoading(true);
    const result = await updateMemberRole(memberId, newRole);
    if (result.error) {
      alert(result.error);
    }
    setLoading(false);
  }

  return (
    <select
      defaultValue={currentRole}
      onChange={handleChange}
      disabled={loading}
      className="text-[12px] font-semibold rounded-full border px-2 py-0.5 bg-surface appearance-none cursor-pointer disabled:opacity-50
        border-border text-text-secondary hover:border-accent focus:outline-none focus:border-accent transition-colors"
    >
      {ROLE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
