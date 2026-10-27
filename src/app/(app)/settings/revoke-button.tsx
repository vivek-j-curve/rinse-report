"use client";

import { useState } from "react";
import { revokeInvitation } from "@/lib/actions/invitations";
import { Trash2 } from "@/components/ui/icons";

export function RevokeButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    if (!confirm("Revoke this invitation? The link will stop working.")) return;
    setLoading(true);
    await revokeInvitation(id);
    // Page will revalidate via revalidatePath in the server action
  }

  return (
    <button
      type="button"
      onClick={handleRevoke}
      disabled={loading}
      className="p-1.5 rounded-md text-text-tertiary hover:text-red hover:bg-red/10 transition-colors disabled:opacity-50"
      title="Revoke invitation"
    >
      <Trash2 size={14} />
    </button>
  );
}
