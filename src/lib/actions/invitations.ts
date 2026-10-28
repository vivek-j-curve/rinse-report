"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendInviteEmail } from "@/lib/email/send-invite";
import type { UserRole } from "@/types/database";

export async function inviteTeamMember(
  email: string,
  role: UserRole
): Promise<{ error?: string; token?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("organisation_id, role, full_name")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Profile not found" };
  if (profile.role !== "owner" && profile.role !== "admin") {
    return { error: "Insufficient permissions" };
  }

  const { data: org } = await supabase
    .from("organisations")
    .select("name")
    .eq("id", profile.organisation_id)
    .single();

  // Check for existing active invitation
  const { data: existing } = await supabase
    .from("invitations")
    .select("id")
    .eq("organisation_id", profile.organisation_id)
    .eq("email", email.toLowerCase())
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (existing) return { error: "An active invitation already exists for this email" };

  const { data: inv, error } = await supabase
    .from("invitations")
    .insert({
      organisation_id: profile.organisation_id,
      email: email.toLowerCase(),
      role,
      invited_by: user.id,
    })
    .select("token")
    .single();

  if (error) return { error: error.message };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const inviteUrl = `${appUrl}/invite/${inv.token}`;

  const emailResult = await sendInviteEmail({
    toEmail: email.toLowerCase(),
    inviteUrl,
    orgName: org?.name ?? "your organisation",
    inviterName: profile.full_name,
  });

  if (emailResult.error) return { error: `Invitation created but email failed: ${emailResult.error}` };

  revalidatePath("/settings");
  return { token: inv.token };
}

export async function revokeInvitation(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("organisation_id, role")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Profile not found" };
  if (profile.role !== "owner" && profile.role !== "admin") {
    return { error: "Insufficient permissions" };
  }

  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", id)
    .eq("organisation_id", profile.organisation_id)
    .is("accepted_at", null);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}

export async function acceptInvitation(data: {
  token: string;
  full_name: string;
  email: string;
  password: string;
}): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const supabase = await createClient();

  // Load invitation via admin client — anon key is blocked by RLS here
  const { data: inv, error: invError } = await admin
    .from("invitations")
    .select("*")
    .eq("token", data.token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (invError || !inv) return { error: "Invitation not found or has expired" };
  if (inv.email !== data.email.toLowerCase()) {
    return { error: "Email does not match invitation" };
  }

  // Create user via admin API so email is pre-confirmed — user proved ownership by clicking the invite link
  const { data: authData, error: signUpError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: data.full_name,
      organisation_id: inv.organisation_id,
      role: inv.role,
    },
  });

  if (signUpError) return { error: signUpError.message };
  if (!authData.user) return { error: "Failed to create account" };

  // Sign in now that the email is confirmed
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  if (signInError) return { error: signInError.message };

  const authed = await createClient();

  // Upsert profile — trigger may have already created it from metadata; upsert is safe either way
  const { error: profileError } = await authed.from("profiles").upsert({
    id: authData.user.id,
    organisation_id: inv.organisation_id,
    full_name: data.full_name,
    role: inv.role,
  });

  if (profileError) return { error: profileError.message };

  // Mark invitation accepted
  await admin
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", inv.id);

  return {};
}
