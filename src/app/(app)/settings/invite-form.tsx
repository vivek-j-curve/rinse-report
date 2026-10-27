"use client";

import { useState } from "react";
import { inviteTeamMember } from "@/lib/actions/invitations";
import { UserPlus, Copy, Check, Mail } from "@/components/ui/icons";
import type { UserRole } from "@/types/database";

const ROLES: { value: UserRole; label: string; hint: string }[] = [
  { value: "admin", label: "Admin", hint: "Can manage cases, team, and settings" },
  { value: "analyst", label: "Analyst", hint: "Can create and manage cases" },
  { value: "viewer", label: "Viewer", hint: "View-only access to cases" },
];

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("analyst");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await inviteTeamMember(email.trim(), role);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    const link = `${window.location.origin}/invite/${result.token}`;
    setInviteLink(link);
    setEmail("");
    setLoading(false);
  }

  async function copyLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-bg border border-red-border text-red text-[13px] px-3.5 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      {inviteLink ? (
        <div className="space-y-3">
          <div className="bg-green-bg border border-green-border rounded-lg px-3.5 py-3">
            <p className="text-[13px] font-medium text-green mb-1">
              Invitation created
            </p>
            <p className="text-[12px] text-text-secondary">
              Share this link with your team member. It expires in 7 days.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 px-3.5 py-2.5 rounded-lg border border-border bg-surface text-[12px] font-mono text-text-secondary truncate">
              {inviteLink}
            </div>
            <button
              type="button"
              onClick={copyLink}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-surface-alt text-[13px] font-medium transition-colors shrink-0"
            >
              {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => { setInviteLink(null); setCopied(false); }}
            className="text-[13px] text-accent hover:underline"
          >
            Invite another person
          </button>
        </div>
      ) : (
        <form onSubmit={handleInvite} className="space-y-3">
          <div>
            <label className="block text-[13px] font-medium mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="email"
                required
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-border bg-surface text-foreground text-[14px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                placeholder="colleague@lawfirm.co.nz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-1.5">Role</label>
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-left transition-colors ${
                    role === r.value
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-border bg-surface hover:bg-surface-alt"
                  }`}
                >
                  <div className="text-[13px] font-medium">{r.label}</div>
                  <div className="text-[11px] text-text-tertiary mt-0.5 leading-tight">
                    {r.hint}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!email.trim() || loading}
            className="flex items-center justify-center gap-1.5 w-full bg-accent text-white py-2.5 rounded-full text-[14px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            <UserPlus size={15} />
            {loading ? "Sending…" : "Send invitation"}
          </button>
        </form>
      )}
    </div>
  );
}
