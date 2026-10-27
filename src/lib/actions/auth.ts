"use server";

import { createClient } from "@/lib/supabase/server";
import type { IndustryType } from "@/types/database";

export interface RegisterData {
  // Step 1
  full_name: string;
  email: string;
  password: string;
  // Step 2
  org_name: string;
  org_address_line: string;
  org_city: string;
  // Step 3
  entity_name: string;
  rentity_id: string;
  rentity_branch: string;
  compliance_officer_name: string;
  compliance_officer_email: string;
  local_currency: string;
  industry: IndustryType;
  holiday_region: string;
  data_retention_years: 5 | 7;
}

export async function registerOrganisation(
  data: RegisterData
): Promise<{ error?: string }> {
  const supabase = await createClient();

  // 1. Create Supabase auth user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: { data: { full_name: data.full_name } },
  });

  if (signUpError) return { error: signUpError.message };
  if (!authData.user) return { error: "Failed to create account" };

  // Sign in immediately so subsequent DB calls are authenticated
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  if (signInError) return { error: signInError.message };

  // Re-create client to pick up the new session from cookies
  const authed = await createClient();

  // 2. Create organisation
  const { data: org, error: orgError } = await authed
    .from("organisations")
    .insert({
      name: data.org_name,
      address_line_1: data.org_address_line,
      address_city: data.org_city,
      address_country: "NZ",
    })
    .select()
    .single();

  if (orgError) return { error: orgError.message };

  // 3. Create profile (owner)
  const { error: profileError } = await authed.from("profiles").insert({
    id: authData.user.id,
    organisation_id: org.id,
    full_name: data.full_name,
    email: data.email,
    role: "owner",
  });

  if (profileError) return { error: profileError.message };

  // 4. Create first reporting entity (trialing subscription)
  const { error: entityError } = await authed
    .from("reporting_entities")
    .insert({
      organisation_id: org.id,
      name: data.entity_name,
      rentity_id: data.rentity_id,
      rentity_branch: data.rentity_branch || null,
      compliance_officer_name: data.compliance_officer_name,
      compliance_officer_email: data.compliance_officer_email || null,
      local_currency: data.local_currency,
      industry: data.industry,
      holiday_region: data.holiday_region,
      data_retention_years: data.data_retention_years,
      subscription_status: "trialing",
    });

  if (entityError) return { error: entityError.message };

  return {};
}

export async function updatePassword(
  password: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return {};
}

export async function sendPasswordReset(
  email: string,
  redirectOrigin: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${redirectOrigin}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: error.message };
  return {};
}
