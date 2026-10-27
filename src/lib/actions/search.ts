"use server";

import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
  case_id: string;
  case_number: string;
  title: string;
  status: string;
  priority: string;
  match_type: string;
  match_value: string;
  creator_name: string;
  created_at: string;
}

export async function searchCases(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_cases", {
    p_query: query.trim(),
    p_limit: 12,
  });

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  return (data as SearchResult[]) ?? [];
}
