"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ReportType, QuestionnaireStatus } from "@/types/database";

export async function saveQuestionnaire(formData: {
  case_id: string;
  report_type: ReportType;
  template_id?: string;
  current_step: number;
  total_steps: number;
  responses: Record<string, unknown>;
  status?: QuestionnaireStatus;
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

  const existing = await supabase
    .from("questionnaire_responses")
    .select("id")
    .eq("case_id", formData.case_id)
    .eq("report_type", formData.report_type)
    .maybeSingle();

  const status = formData.status ?? "draft";

  if (existing.data) {
    const { error } = await supabase
      .from("questionnaire_responses")
      .update({
        responses: formData.responses as unknown as Record<string, never>,
        status,
        current_step: formData.current_step,
        total_steps: formData.total_steps,
        completed_at: status === "complete" ? new Date().toISOString() : null,
      })
      .eq("id", existing.data.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("questionnaire_responses")
      .insert({
        case_id: formData.case_id,
        organisation_id: profile.organisation_id,
        report_type: formData.report_type,
        template_id: formData.template_id ?? null,
        current_step: formData.current_step,
        total_steps: formData.total_steps,
        responses: formData.responses as unknown as Record<string, never>,
        status,
        completed_at: status === "complete" ? new Date().toISOString() : null,
      });

    if (error) return { error: error.message };
  }

  revalidatePath(`/suspicions`);
  return { success: true };
}

export async function getQuestionnaireResponses(caseId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questionnaire_responses")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  if (error) return { error: error.message, data: [] };
  return { data: data ?? [] };
}
