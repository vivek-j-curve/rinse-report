"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";

export default function NewSuspicionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entities, setEntities] = useState<{ id: string; name: string }[]>([]);

  const [entityId, setEntityId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [suspicionDate, setSuspicionDate] = useState("");
  const [suspicionType, setSuspicionType] = useState<"transaction" | "activity">("transaction");
  const [keyParties, setKeyParties] = useState("");

  useEffect(() => {
    async function loadEntities() {
      const supabase = createClient();
      const { data } = await supabase
        .from("reporting_entities")
        .select("id, name")
        .order("name");
      if (data) {
        setEntities(data);
        if (data.length === 1) setEntityId(data[0].id);
      }
    }
    loadEntities();
    setSuspicionDate(new Date().toISOString().split("T")[0]);
  }, []);

  async function handleSubmit(e: React.FormEvent, asDraft = false) {
    e.preventDefault();
    if (!asDraft && (!entityId || !title || !description)) {
      setError("Please fill in all required fields");
      return;
    }
    if (asDraft && (!title || !entityId)) {
      setError("Please provide at least a title and reporting entity to save as draft");
      return;
    }

    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      setError("Profile not found");
      setLoading(false);
      return;
    }

    const now = new Date();
    const caseNumber = `RR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

    const formed = new Date(suspicionDate);
    const slaDays = suspicionType === "activity" ? 3 : 5;
    let bizDays = 0;
    const d = new Date(formed);
    while (bizDays < slaDays) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) bizDays++;
    }
    const slaDeadline = d.toISOString().split("T")[0];

    const { data: caseRow, error: caseError } = await supabase
      .from("cases")
      .insert({
        organisation_id: profile.organisation_id,
        reporting_entity_id: entityId,
        case_number: caseNumber,
        title,
        status: asDraft ? ("draft" as const) : ("raised" as const),
        suspicion_formed_at: suspicionDate,
        sla_deadline: slaDeadline,
        priority: "medium" as const,
        created_by: user.id,
      })
      .select()
      .single();

    if (caseError) {
      setError(caseError.message);
      setLoading(false);
      return;
    }

    const typePrefix = suspicionType === "activity" ? "[ACTIVITY] " : "[TRANSACTION] ";
    const partiesSuffix = keyParties.trim() ? `\n\n[PARTIES] ${keyParties.trim()}` : "";
    const { error: suspicionError } = await supabase
      .from("suspicions")
      .insert({
        case_id: caseRow.id,
        organisation_id: profile.organisation_id,
        description: typePrefix + description + partiesSuffix,
        raised_by: user.id,
      });

    if (suspicionError) {
      setError(suspicionError.message);
      setLoading(false);
      return;
    }

    // Reset form state before navigating so the router cache doesn't preserve
    // stale values if the user arrives here via back/forward navigation.
    setTitle("");
    setDescription("");
    setKeyParties("");
    setSuspicionDate(new Date().toISOString().split("T")[0]);
    setSuspicionType("transaction");

    // replace (not push) so the form is removed from the browser history stack
    router.replace(`/suspicions/${caseRow.id}`);
  }

  return (
    <>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text mb-3"
        >
          <ArrowLeft size={14} />
          Back to suspicions
        </button>
        <h1 className="text-[28px] font-bold tracking-tight">
          Raise a Suspicion
        </h1>
        <p className="text-text-secondary text-[13.5px] mt-0.5">
          Walk through each section to build your report
        </p>
      </div>

      <div className="bg-surface border border-border rounded-[10px] p-6 max-w-2xl">
        {error && (
          <div className="bg-red/10 border border-red/20 text-red text-[13px] px-3.5 py-2.5 rounded-lg mb-5">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {entities.length > 1 && (
            <div>
              <label className="block text-[13px] font-semibold mb-1.5">
                Reporting Entity
              </label>
              <select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                required
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              >
                <option value="">Select reporting entity...</option>
                {entities.map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-semibold mb-2">
              Suspicion Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "transaction", label: "Transaction Suspicion", desc: "Unusual or suspicious transactions (use for STR)" },
                  { value: "activity", label: "Activity Suspicion", desc: "Suspicious behaviour with no specific transaction (use for SAR)" },
                ] as const
              ).map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSuspicionType(t.value)}
                  className={`text-left px-3.5 py-3 rounded-lg border transition-colors ${
                    suspicionType === t.value
                      ? "border-accent bg-accent/8"
                      : "border-border hover:bg-surface-alt"
                  }`}
                >
                  <div className={`text-[13px] font-semibold ${suspicionType === t.value ? "text-accent" : ""}`}>
                    {t.label}
                  </div>
                  <div className="text-[11.5px] text-text-tertiary mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title for this suspicion (e.g. Unusual wire transfers - Chen Ltd)"
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13.5px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                suspicionType === "activity"
                  ? "Describe the suspicious behaviour or pattern of activity (no specific transaction required)..."
                  : "Describe the suspicious transaction(s), including amounts, dates, and parties involved..."
              }
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13.5px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
            />
            <p className="text-[11.5px] text-text-tertiary mt-1.5">
              {suspicionType === "activity"
                ? "Activity suspicions are typically filed as a SAR (Suspicious Activity Report) with the FIU."
                : "Transaction suspicions are typically filed as an STR (Suspicious Transaction Report) with the FIU."}
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5">
              Key accounts / entities involved
              <span className="ml-1.5 text-[11px] font-normal text-text-tertiary">optional</span>
            </label>
            <input
              type="text"
              value={keyParties}
              onChange={(e) => setKeyParties(e.target.value)}
              placeholder="e.g. BNZ account 02-1234-5678901-00, Chen Holdings Ltd"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13.5px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
            <p className="text-[11.5px] text-text-tertiary mt-1.5">
              A quick note for your records - the report builder is where you add structured entity and account details for filing.
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-semibold mb-1.5">
              Date Suspicion Formed
            </label>
            <input
              type="date"
              value={suspicionDate}
              onChange={(e) => setSuspicionDate(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-text-tertiary">
              You can complete the full questionnaire after raising
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
                className="text-[13.5px] font-medium px-5 py-2 rounded-full border border-border hover:bg-surface-alt transition-colors disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save as Draft"}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-accent text-white text-[13.5px] font-semibold px-5 py-2 rounded-full hover:bg-accent-hover transition-colors disabled:opacity-60"
              >
                {loading ? "Raising..." : "Raise Suspicion"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
