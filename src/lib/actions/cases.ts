"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotificationsForOrg } from "@/lib/actions/notifications";
import type { SuspicionStatus, CasePriority } from "@/types/database";

export async function createCase(formData: {
  reporting_entity_id: string;
  title: string;
  description: string;
  suspicion_formed_at: string;
  priority?: CasePriority;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("organisation_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "No profile found" };

  const now = new Date();
  const caseNumber = `RR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

  const formed = new Date(formData.suspicion_formed_at);
  let bizDays = 0;
  const d = new Date(formed);
  while (bizDays < 5) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) bizDays++;
  }
  const slaDeadline = d.toISOString().split("T")[0];

  const { data: caseRow, error } = await supabase
    .from("cases")
    .insert({
      organisation_id: profile.organisation_id,
      reporting_entity_id: formData.reporting_entity_id,
      case_number: caseNumber,
      title: formData.title,
      suspicion_formed_at: formData.suspicion_formed_at,
      sla_deadline: slaDeadline,
      priority: formData.priority ?? "medium",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  const { error: suspicionError } = await supabase.from("suspicions").insert({
    case_id: caseRow.id,
    organisation_id: profile.organisation_id,
    description: formData.description,
    raised_by: user.id,
  });

  if (suspicionError) return { error: suspicionError.message };

  revalidatePath("/dashboard");
  revalidatePath("/suspicions");

  // Notify admins/owners about the new case (fire-and-forget)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.rinsereport.com";
  createNotificationsForOrg({
    organisationId: profile.organisation_id,
    excludeUserId: user.id,
    type: "new_suspicion",
    title: `New case: ${formData.title}`,
    body: formData.description.slice(0, 120),
    resourceId: caseRow.id,
    resourceType: "case",
    sendEmail: true,
    emailSubject: `New case opened: ${formData.title}`,
    emailBody: `A new suspicion case has been opened: <strong>${formData.title}</strong>.<br><br>${formData.description.slice(0, 200)}`,
    actionUrl: `${appUrl}/suspicions/${caseRow.id}`,
  }).catch(() => {});

  return { data: caseRow };
}

export async function updateCaseStatus(
  caseId: string,
  status: SuspicionStatus
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cases")
    .update({ status })
    .eq("id", caseId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/suspicions");
  return { success: true };
}

export async function getCases() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select(
      `
      *,
      reporting_entity:reporting_entities(name),
      suspicions(id, description),
      creator:profiles!cases_created_by_fkey(full_name)
    `
    )
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, data: [] };
  return { data: data ?? [] };
}

export async function getCase(caseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select(
      `
      *,
      reporting_entity:reporting_entities(name),
      suspicions(*),
      questionnaire_responses(*),
      attachments(*),
      creator:profiles!cases_created_by_fkey(full_name)
    `
    )
    .eq("id", caseId)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getCaseDetail(caseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select(
      `
      *,
      reporting_entity:reporting_entities(name, local_currency),
      suspicions(*, raiser:profiles!suspicions_raised_by_fkey(full_name)),
      attachments(*),
      reports(id, report_type, status, entity_reference, created_at),
      creator:profiles!cases_created_by_fkey(full_name),
      assignee:profiles!cases_assigned_to_fkey(full_name),
      filer:profiles!cases_filed_by_fkey(full_name)
    `
    )
    .eq("id", caseId)
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function getCaseActivity(caseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select(`*, actor:profiles!audit_log_user_id_fkey(full_name)`)
    .eq("resource_id", caseId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return { error: error.message, data: [] };
  return { data: data ?? [] };
}

export async function assignCase(caseId: string, userId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cases")
    .update({ assigned_to: userId })
    .eq("id", caseId);

  if (error) return { error: error.message };
  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/cases");
  return { success: true };
}

export async function linkSuspicionToCase(suspicionId: string, targetCaseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: suspicion, error: fetchError } = await supabase
    .from("suspicions")
    .select("case_id, organisation_id")
    .eq("id", suspicionId)
    .single();

  if (fetchError || !suspicion) return { error: "Suspicion not found" };

  const sourceCaseId = suspicion.case_id;

  const { error: updateError } = await supabase
    .from("suspicions")
    .update({ case_id: targetCaseId })
    .eq("id", suspicionId);

  if (updateError) return { error: updateError.message };

  // If the source case now has no suspicions and no reports, delete it
  if (sourceCaseId !== targetCaseId) {
    const { count: suspicionCount } = await supabase
      .from("suspicions")
      .select("id", { count: "exact", head: true })
      .eq("case_id", sourceCaseId);

    const { count: reportCount } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("case_id", sourceCaseId);

    if ((suspicionCount ?? 0) === 0 && (reportCount ?? 0) === 0) {
      await supabase.from("cases").delete().eq("id", sourceCaseId);
    }
  }

  revalidatePath(`/cases/${targetCaseId}`);
  revalidatePath("/cases");
  revalidatePath("/suspicions");
  return { success: true };
}

export async function getAvailableSuspicionsForCase(
  reportingEntityId: string,
  excludeCaseId: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suspicions")
    .select(`*, case:cases!suspicions_case_id_fkey(id, case_number, title, reporting_entity_id)`)
    .neq("case_id", excludeCaseId)
    .eq("case.reporting_entity_id", reportingEntityId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return { error: error.message, data: [] };
  return { data: data ?? [] };
}

export async function getAvailableCasesForSuspicion(
  reportingEntityId: string,
  excludeCaseId: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select(`id, case_number, title, status, suspicions(id)`)
    .eq("reporting_entity_id", reportingEntityId)
    .neq("id", excludeCaseId)
    .not("status", "in", '("resolved","filed")')
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return { error: error.message, data: [] };
  return { data: data ?? [] };
}
