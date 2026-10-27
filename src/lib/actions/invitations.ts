"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
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
    .select("organisation_id, role")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Profile not found" };
  if (profile.role !== "owner" && profile.role !== "admin") {
    return { error: "Insufficient permissions" };
  }

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
  const supabase = await createClient();

  // Load invitation
  const { data: inv, error: invError } = await supabase
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

  // Create Supabase auth user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: { data: { full_name: data.full_name } },
  });

  if (signUpError) return { error: signUpError.message };
  if (!authData.user) return { error: "Failed to create account" };

  // Sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  if (signInError) return { error: signInError.message };

  const authed = await createClient();

  // Create profile
  const { error: profileError } = await authed.from("profiles").insert({
    id: authData.user.id,
    organisation_id: inv.organisation_id,
    full_name: data.full_name,
    email: data.email.toLowerCase(),
    role: inv.role,
  });

  if (profileError) return { error: profileError.message };

  // Mark invitation accepted
  await authed
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", inv.id);

  return {};
}
