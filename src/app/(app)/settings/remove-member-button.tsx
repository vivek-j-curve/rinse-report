"use client";

import { useState } from "react";
import { removeTeamMember } from "@/lib/actions/invitations";
import { UserMinus } from "@/components/ui/icons";

export function RemoveMemberButton({ id, name }: { id: string; name: string }) {
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm(`Remove ${name} from the organisation? They will lose access immediately.`)) return;
    setLoading(true);
    const result = await removeTeamMember(id);
    if (result.error) {
      alert(result.error);
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      className="p-1.5 rounded-md text-text-tertiary hover:text-red hover:bg-red/10 transition-colors disabled:opacity-50"
      title="Remove member"
    >
      <UserMinus size={14} />
    </button>
  );
}
