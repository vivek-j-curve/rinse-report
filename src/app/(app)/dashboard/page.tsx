import { connection } from "next/server";
import { Suspense } from "react";
import { AlertTriangle, CheckCircle, Clock, FileText } from "@/components/ui/icons";
import { SlaBadge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/get-profile";
import Link from "next/link";
import { CreateReportModal } from "./create-report-modal";
import { PeriodFilter } from "./period-filter";

// ─── helpers ────────────────────────────────────────────────────────────────

function countBizDays(from: Date, to: Date): number {
  let count = 0;
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  if (d >= end) return 0;
  while (d < end) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

function getSlaInfo(slaDeadline: string | null): {
  status: "breached" | "urgent" | "ok";
  label: string;
} {
  if (!slaDeadline) return { status: "ok", label: "No deadline" };
  const now = new Date();
  const deadline = new Date(slaDeadline);
  if (deadline < now) return { status: "breached", label: "Overdue" };
  const bizDays = countBizDays(now, deadline);
  if (bizDays === 0) return { status: "urgent", label: "Due today" };
  if (bizDays === 1) return { status: "urgent", label: "1 biz day left" };
  if (bizDays <= 2) return { status: "urgent", label: `${bizDays} biz days left` };
  return { status: "ok", label: `${bizDays} biz days left` };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
  });
}

function avgDays(items: { suspicion_formed_at: string; filed_at: string | null }[]) {
  const filed = items.filter((c) => c.filed_at);
  if (!filed.length) return null;
  const total = filed.reduce((sum, c) => {
    const diff =
      (new Date(c.filed_at!).getTime() - new Date(c.suspicion_formed_at).getTime()) /
      (1000 * 60 * 60 * 24);
    return sum + diff;
  }, 0);
  return Math.round(total / filed.length);
}

// ─── chart components (pure SVG / CSS) ──────────────────────────────────────

function SlaRing({ pct }: { pct: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const color =
    pct >= 90
      ? "var(--green)"
      : pct >= 70
        ? "var(--amber)"
        : "var(--red)";
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text
        x="44"
        y="44"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="17"
        fontWeight="700"
        fill="var(--text)"
        fontFamily="var(--font-sans)"
      >
        {pct}%
      </text>
    </svg>
  );
}

function StatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[13px] text-text-secondary">{label}</span>
        <span className="text-[13px] font-semibold tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function ReportTypePill({
  type,
  count,
}: {
  type: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-accent-subtle text-accent">
          {type}
        </span>
        <span className="text-[13px] text-text-secondary">
          {type === "STR"
            ? "Suspicious Transaction"
            : type === "SAR"
              ? "Suspicious Activity"
              : type === "LCT"
                ? "Large Cash"
                : "International Funds Transfer"}
        </span>
      </div>
      <span className="text-[13px] font-semibold tabular-nums">{count}</span>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export const instant = false;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await connection();
  const { period = "30" } = await searchParams;

  const profile = await getProfile();
  const supabase = await createClient();

  const periodDays = period === "all" ? null : parseInt(period, 10) || 30;
  const periodStart = periodDays
    ? new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
    : null;

  // ── fetch all cases (unfiltered) for all-time SLA compliance ──
  let casesQ = supabase
    .from("cases")
    .select(
      `id, case_number, title, status, sla_deadline, suspicion_formed_at,
       filed_at, resolved_at, created_at, reporting_entity_id,
       suspicions(id, description),
       creator:profiles!cases_created_by_fkey(full_name),
       assignee:profiles!cases_assigned_to_fkey(full_name)`
    )
    .eq("organisation_id", profile.organisation_id)
    .order("created_at", { ascending: false });

  if (periodStart) {
    casesQ = casesQ.gte("created_at", periodStart.toISOString());
  }

  // ── report type breakdown from questionnaire_responses ──
  let qrQ = supabase
    .from("questionnaire_responses")
    .select("report_type, case_id")
    .eq("organisation_id", profile.organisation_id);

  if (periodStart) {
    qrQ = qrQ.gte("created_at", periodStart.toISOString());
  }

  const [{ data: cases }, { data: qResponses }] = await Promise.all([
    casesQ,
    qrQ,
  ]);

  const allCases = cases ?? [];
  const allQR = qResponses ?? [];

  // ── derived metrics ──────────────────────────────────────────
  const activeCases = allCases.filter(
    (c) => c.status !== "filed" && c.status !== "resolved"
  );
  const filedCases = allCases.filter((c) => c.status === "filed");
  const resolvedCases = allCases.filter((c) => c.status === "resolved");
  const closedCases = [...filedCases, ...resolvedCases];

  const atRiskCases = activeCases.filter((c) => {
    const sla = getSlaInfo(c.sla_deadline);
    return sla.status === "breached" || sla.status === "urgent";
  });

  // SLA compliance: closed cases that were filed within SLA
  const breachedCount = closedCases.filter((c) => {
    if (!c.sla_deadline) return false;
    const closedAt = c.filed_at ?? c.resolved_at ?? c.created_at;
    return new Date(closedAt) > new Date(c.sla_deadline);
  }).length;
  const slaCompliance =
    closedCases.length > 0
      ? Math.round(((closedCases.length - breachedCount) / closedCases.length) * 100)
      : 100;

  // Avg days to file
  const avgDaysToFile = avgDays(
    allCases.map((c) => ({
      suspicion_formed_at: c.suspicion_formed_at,
      filed_at: c.filed_at,
    }))
  );

  // Status counts
  const statusCounts = {
    raised: allCases.filter((c) => c.status === "raised").length,
    investigating: allCases.filter((c) => c.status === "investigating").length,
    to_file: allCases.filter((c) => c.status === "to_file").length,
    filed: filedCases.length,
    resolved: resolvedCases.length,
  };

  // Report type counts
  const typeCounts: Record<string, number> = {};
  for (const qr of allQR) {
    typeCounts[qr.report_type] = (typeCounts[qr.report_type] ?? 0) + 1;
  }

  const isEmpty = allCases.length === 0;
  const recentCases = allCases.slice(0, 8);

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Dashboard</h1>
          <p className="text-text-secondary text-[13.5px] mt-0.5">
            {isEmpty
              ? "No suspicions yet — get started below"
              : period === "all"
                ? "All-time overview"
                : `Last ${period} days`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Suspense fallback={null}>
            <PeriodFilter current={period} />
          </Suspense>
          <Link
            href="/suspicions/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold border border-border rounded-full hover:bg-surface-alt transition-colors"
          >
            + New Suspicion
          </Link>
          {!isEmpty && (
            <CreateReportModal
              cases={activeCases.map((c) => {
                const desc = c.suspicions?.[0]?.description ?? "";
                const suspicionType = desc.startsWith("[ACTIVITY] ")
                  ? "activity"
                  : "transaction";
                return {
                  id: c.id,
                  case_number: c.case_number,
                  title: c.title,
                  suspicion_type: suspicionType as "transaction" | "activity",
                };
              })}
            />
          )}
        </div>
      </div>

      {isEmpty ? (
        /* ── Empty state ─────────────────────────────────────── */
        <div className="bg-surface border border-border rounded-[10px] p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h2 className="font-serif text-xl font-semibold mb-1">
            No suspicions yet
          </h2>
          <p className="text-text-secondary text-sm mb-4 max-w-sm mx-auto">
            When you or your team raise a suspicion it will appear here for
            tracking.
          </p>
          <Link
            href="/suspicions/new"
            className="inline-flex bg-accent text-white px-5 py-2.5 rounded-full text-[14px] font-semibold hover:bg-accent-hover transition-colors"
          >
            Raise a suspicion
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── KPI row ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active */}
            <div className="bg-surface border border-border rounded-[10px] p-5">
              <div className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                Active
              </div>
              <div className="font-serif text-4xl mt-2">{activeCases.length}</div>
              <div className="text-[12px] text-text-secondary mt-1">
                Open suspicions
              </div>
            </div>

            {/* At risk */}
            <div
              className={`bg-surface border rounded-[10px] p-5 ${
                atRiskCases.length > 0
                  ? "border-red-border bg-red-bg"
                  : "border-border"
              }`}
            >
              <div className="flex items-center justify-between text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                At Risk
                <AlertTriangle
                  size={16}
                  className={
                    atRiskCases.length > 0 ? "text-red" : "text-text-tertiary"
                  }
                />
              </div>
              <div
                className={`font-serif text-4xl mt-2 ${
                  atRiskCases.length > 0 ? "text-red" : ""
                }`}
              >
                {atRiskCases.length}
              </div>
              <div className="text-[12px] text-text-secondary mt-1">
                {atRiskCases.length === 0
                  ? "All within SLA"
                  : "Require immediate attention"}
              </div>
            </div>

            {/* SLA compliance */}
            <div className="bg-surface border border-border rounded-[10px] p-5">
              <div className="flex items-center justify-between text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                SLA Compliance
                <CheckCircle size={16} className="text-text-tertiary" />
              </div>
              <div className="font-serif text-4xl mt-2">
                {slaCompliance}
                <span className="font-sans text-xl text-text-tertiary">%</span>
              </div>
              <div className="text-[12px] text-text-secondary mt-1">
                {closedCases.length} closed · {breachedCount} breach
                {breachedCount !== 1 ? "es" : ""}
              </div>
            </div>

            {/* Filed */}
            <div className="bg-surface border border-border rounded-[10px] p-5">
              <div className="flex items-center justify-between text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                Filed
                <FileText size={16} className="text-text-tertiary" />
              </div>
              <div className="font-serif text-4xl mt-2">{filedCases.length}</div>
              <div className="text-[12px] text-text-secondary mt-1">
                {avgDaysToFile !== null
                  ? `Avg ${avgDaysToFile}d to file`
                  : "With FIU"}
              </div>
            </div>
          </div>

          {/* ── SLA at-risk alert ─────────────────────────────────── */}
          {atRiskCases.length > 0 && (
            <div className="bg-red-bg border border-red-border rounded-[10px] overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-red-border">
                <AlertTriangle size={15} className="text-red shrink-0" />
                <span className="text-[13px] font-semibold text-red">
                  {atRiskCases.length} case
                  {atRiskCases.length !== 1 ? "s" : ""} require urgent attention
                </span>
              </div>
              <div>
                {atRiskCases.slice(0, 5).map((c) => {
                  const sla = getSlaInfo(c.sla_deadline);
                  return (
                    <Link
                      key={c.id}
                      href={`/suspicions/${c.id}`}
                      className="flex items-center gap-3 px-5 py-3 border-b border-red-border last:border-0 hover:bg-red-bg/70 transition-colors"
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          sla.status === "breached" ? "bg-red" : "bg-amber"
                        }`}
                      />
                      <span className="flex-1 text-[13.5px] font-medium truncate">
                        {c.title}
                      </span>
                      <span className="text-[12px] text-text-secondary shrink-0">
                        {c.case_number}
                      </span>
                      <SlaBadge status={sla.status}>{sla.label}</SlaBadge>
                    </Link>
                  );
                })}
                {atRiskCases.length > 5 && (
                  <Link
                    href="/suspicions"
                    className="block px-5 py-2.5 text-[12.5px] text-red font-medium hover:underline"
                  >
                    View all {atRiskCases.length} at-risk cases →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ── Main content ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
            {/* Left: recent suspicions */}
            <div className="bg-surface border border-border rounded-[10px]">
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <h2 className="text-[13px] font-semibold">Recent Suspicions</h2>
                <Link
                  href="/suspicions"
                  className="text-[12.5px] text-accent font-medium hover:underline"
                >
                  View all
                </Link>
              </div>
              {recentCases.map((c) => {
                const sla = getSlaInfo(c.sla_deadline);
                return (
                  <Link
                    key={c.id}
                    href={`/suspicions/${c.id}`}
                    className="flex items-start gap-3 px-5 py-3 border-t border-border hover:bg-surface-alt transition-colors"
                  >
                    <span
                      className={`w-2 h-2 rounded-full mt-[5px] shrink-0 ${
                        sla.status === "breached"
                          ? "bg-red"
                          : sla.status === "urgent"
                            ? "bg-amber"
                            : "bg-green"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium truncate">
                        {c.title}
                      </div>
                      <div className="text-[12px] text-text-tertiary mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{c.case_number}</span>
                        <span>·</span>
                        <span>{c.creator?.full_name ?? "Unknown"}</span>
                        <span>·</span>
                        <span>{formatDate(c.created_at)}</span>
                        {c.status !== "raised" && (
                          <>
                            <span>·</span>
                            <span className="capitalize">
                              {c.status.replace("_", " ")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <SlaBadge status={sla.status}>{sla.label}</SlaBadge>
                  </Link>
                );
              })}
              {allCases.length > 8 && (
                <div className="px-5 py-3 border-t border-border">
                  <Link
                    href="/suspicions"
                    className="text-[12.5px] text-accent font-medium hover:underline"
                  >
                    View all {allCases.length} suspicions →
                  </Link>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="flex flex-col gap-4">
              {/* Status distribution */}
              <div className="bg-surface border border-border rounded-[10px] p-5">
                <div className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider mb-4">
                  Status Distribution
                </div>
                <div className="space-y-3">
                  <StatusBar
                    label="Raised"
                    count={statusCounts.raised}
                    total={allCases.length}
                    color="var(--text-3)"
                  />
                  <StatusBar
                    label="Investigating"
                    count={statusCounts.investigating}
                    total={allCases.length}
                    color="var(--amber)"
                  />
                  <StatusBar
                    label="To File"
                    count={statusCounts.to_file}
                    total={allCases.length}
                    color="var(--accent)"
                  />
                  <StatusBar
                    label="Filed with FIU"
                    count={statusCounts.filed}
                    total={allCases.length}
                    color="var(--green)"
                  />
                  <StatusBar
                    label="Resolved"
                    count={statusCounts.resolved}
                    total={allCases.length}
                    color="var(--text-2)"
                  />
                </div>
              </div>

              {/* SLA compliance ring */}
              <div className="bg-surface border border-border rounded-[10px] p-5">
                <div className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  SLA Compliance
                </div>
                <div className="flex items-center gap-4">
                  <SlaRing pct={slaCompliance} />
                  <div className="space-y-2 text-[12.5px]">
                    <div>
                      <div className="font-semibold text-green">
                        {closedCases.length - breachedCount}
                      </div>
                      <div className="text-text-secondary">On time</div>
                    </div>
                    <div>
                      <div className="font-semibold text-red">{breachedCount}</div>
                      <div className="text-text-secondary">Breached</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Report type breakdown */}
              {Object.keys(typeCounts).length > 0 && (
                <div className="bg-surface border border-border rounded-[10px] p-5">
                  <div className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Report Types
                  </div>
                  {(["STR", "SAR", "LCT", "IFT"] as const).map((type) =>
                    typeCounts[type] != null ? (
                      <ReportTypePill
                        key={type}
                        type={type}
                        count={typeCounts[type]}
                      />
                    ) : null
                  )}
                </div>
              )}

              {/* Avg time to file */}
              {avgDaysToFile !== null && (
                <div className="bg-surface border border-border rounded-[10px] p-5">
                  <div className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Avg Time to File
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-3xl">{avgDaysToFile}</span>
                    <span className="text-text-secondary text-sm">
                      calendar days
                    </span>
                  </div>
                  <div className="text-[12px] text-text-secondary mt-1">
                    Suspicion formed → filed with FIU
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
