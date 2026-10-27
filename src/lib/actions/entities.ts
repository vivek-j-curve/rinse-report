"use server";

import { createClient } from "@/lib/supabase/server";

export async function getReportingEntities() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reporting_entities")
    .select("id, name, fiu_entity_id, industry_type, subscription_status")
    .order("name");

  if (error) return { error: error.message, data: [] };
  return { data: data ?? [] };
}

export async function getReportingEntity(entityId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reporting_entities")
    .select("*")
    .eq("id", entityId)
    .single();

  if (error) return { error: error.message };
  return { data };
}
