export const instant = false;

import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InviteForm } from "./invite-form";
import { RevokeButton } from "./revoke-button";
import { RemoveMemberButton } from "./remove-member-button";
import { ChangeRoleSelect } from "./change-role-select";
import { User, Shield, Clock } from "@/components/ui/icons";
import type { UserRole } from "@/types/database";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  analyst: "Analyst",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-amber/10 text-amber border-amber/20",
  admin: "bg-accent/10 text-accent border-accent/20",
  analyst: "bg-green/10 text-green border-green/20",
  viewer: "bg-border text-text-secondary border-border",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ROLE_COLORS[role] ?? ROLE_COLORS.read_only}`}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function SettingsPage() {
  await connection();
  const now = new Date().toISOString();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organisation_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const canManageTeam = profile.role === "owner" || profile.role === "admin";

  const removable: Record<string, string[]> = {
    owner: ["admin", "analyst", "viewer"],
    admin: ["owner", "analyst", "viewer"],
  };

  const manageable: Record<string, string[]> = {
    owner: ["admin", "analyst", "viewer"],
    admin: ["admin", "analyst", "viewer"],
  };

  const currentUserId = user.id;
  const currentRole = profile.role;

  function canRemoveMember(targetId: string, targetRole: string) {
    if (targetId === currentUserId) return false;
    return removable[currentRole]?.includes(targetRole) ?? false;
  }

  function canChangeRole(targetId: string, targetRole: string) {
    if (targetId === currentUserId) return false;
    return manageable[currentRole]?.includes(targetRole) ?? false;
  }

  const [membersResult, invitesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .eq("organisation_id", profile.organisation_id)
      .order("created_at", { ascending: true }),
    canManageTeam
      ? supabase
          .from("invitations")
          .select("id, email, role, created_at, expires_at")
          .eq("organisation_id", profile.organisation_id)
          .is("accepted_at", null)
          .gt("expires_at", now)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const members = membersResult.data ?? [];
  const invitations = (invitesResult as { data: typeof invitesResult.data }).data ?? [];

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">
          Manage your organisation and team
        </p>
      </div>

      {/* Team members */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <User size={16} className="text-text-secondary" />
          <h2 className="text-[15px] font-semibold">Team members</h2>
          <span className="ml-auto text-[12px] text-text-tertiary">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
          {members.map((m) => (
            <div
              key={m.id}
              className={`flex items-center gap-3 px-4 py-3 bg-surface ${m.id === user.id ? "bg-accent/3" : ""}`}
            >
              <div className="w-8 h-8 rounded-full bg-surface-alt border border-border flex items-center justify-center shrink-0 text-[13px] font-semibold text-text-secondary">
                {(m.full_name ?? m.email ?? "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium truncate">
                    {m.full_name ?? "—"}
                  </span>
                  {m.id === user.id && (
                    <span className="text-[11px] text-text-tertiary">(you)</span>
                  )}
                </div>
                <div className="text-[12px] text-text-tertiary truncate">
                  {m.email ?? "—"}
                </div>
              </div>
              {canChangeRole(m.id, m.role) ? (
                <ChangeRoleSelect memberId={m.id} currentRole={m.role as UserRole} />
              ) : (
                <RoleBadge role={m.role} />
              )}
              {canRemoveMember(m.id, m.role) && (
                <RemoveMemberButton id={m.id} name={m.full_name ?? m.email ?? "this member"} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pending invitations */}
      {canManageTeam && invitations.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-text-secondary" />
            <h2 className="text-[15px] font-semibold">Pending invitations</h2>
            <span className="ml-auto text-[12px] text-text-tertiary">
              {invitations.length} pending
            </span>
          </div>

          <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3 bg-surface">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium truncate">{inv.email}</div>
                  <div className="text-[12px] text-text-tertiary">
                    Expires {formatDate(inv.expires_at)}
                  </div>
                </div>
                <RoleBadge role={inv.role} />
                <RevokeButton id={inv.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invite form */}
      {canManageTeam && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-text-secondary" />
            <h2 className="text-[15px] font-semibold">Invite a team member</h2>
          </div>
          <div className="rounded-xl border border-border p-4 bg-surface">
            <InviteForm />
          </div>
        </section>
      )}

      {!canManageTeam && (
        <p className="text-[13px] text-text-secondary">
          Only owners and admins can invite team members.
        </p>
      )}
    </div>
  );
}
