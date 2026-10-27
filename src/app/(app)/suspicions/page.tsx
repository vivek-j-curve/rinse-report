import { connection } from "next/server";
import { Plus } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/get-profile";
import Link from "next/link";
import { KanbanBoard } from "./kanban-board";

export const instant = false;

export default async function SuspicionsPage() {
  await connection();
  const profile = await getProfile();
  const supabase = await createClient();

  const { data: cases } = await supabase
    .from("cases")
    .select(
      `
      id, case_number, title, status, sla_deadline, created_at,
      suspicions(id, description),
      creator:profiles!cases_created_by_fkey(full_name)
    `
    )
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  const allCases = (cases ?? []).map((c) => ({
    ...c,
    creator: c.creator as { full_name: string } | null,
    suspicions: c.suspicions as { id: string; description: string }[] | null,
  }));

  const isEmpty = allCases.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Suspicions
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Track and manage suspicious activity reports
          </p>
        </div>
        <Link
          href="/suspicions/new"
          className="flex items-center gap-1.5 bg-accent text-white px-4 py-2 rounded-full text-[13.5px] font-semibold hover:bg-accent-hover transition-colors"
        >
          <Plus size={16} />
          New Suspicion
        </Link>
      </div>

      {isEmpty ? (
        <div className="bg-surface border border-border rounded-[10px] p-10 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h2 className="font-serif text-xl font-semibold mb-1">
            No suspicions raised yet
          </h2>
          <p className="text-text-secondary text-sm mb-4 max-w-sm mx-auto">
            When a suspicious activity is identified, raise a suspicion to
            begin the reporting workflow.
          </p>
          <Link
            href="/suspicions/new"
            className="inline-flex items-center gap-1.5 bg-accent text-white px-5 py-2.5 rounded-full text-[14px] font-semibold hover:bg-accent-hover transition-colors"
          >
            <Plus size={16} />
            Raise a suspicion
          </Link>
        </div>
      ) : (
        <KanbanBoard cases={allCases} />
      )}
    </div>
  );
}
