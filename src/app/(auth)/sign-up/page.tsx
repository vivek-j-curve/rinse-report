"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "@/components/ui/icons";
import { registerOrganisation } from "@/lib/actions/auth";
import type { IndustryType } from "@/types/database";

// ─── helpers ────────────────────────────────────────────────────────────────

const INDUSTRIES: { value: IndustryType; label: string }[] = [
  { value: "law_firm", label: "Law firm" },
  { value: "accountant", label: "Accountancy practice" },
  { value: "real_estate", label: "Real estate agency" },
  { value: "tcsp", label: "Trust & company service provider (TCSP)" },
  { value: "money_remitter", label: "Money remitter" },
  { value: "currency_exchanger", label: "Currency exchanger" },
  { value: "non_bank_deposit_taker", label: "Non-bank deposit taker" },
  { value: "lender", label: "Lender / finance company" },
  { value: "payment_service_provider", label: "Payment service provider" },
  { value: "wealth_provider", label: "Wealth / investment service provider" },
  { value: "casino", label: "Casino" },
  { value: "other", label: "Other" },
];

const NZ_REGIONS = [
  "Auckland",
  "Wellington",
  "Canterbury",
  "Waikato",
  "Bay of Plenty",
  "Otago",
  "Hawke's Bay",
  "Manawatū-Whanganui",
  "Northland",
  "Taranaki",
  "Southland",
  "Nelson",
  "Marlborough",
  "Tasman",
  "Gisborne",
  "West Coast",
];

function passwordStrength(p: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[a-z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const labels = ["", "Weak", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "",
    "var(--red)",
    "var(--red)",
    "var(--amber)",
    "var(--green)",
    "var(--green)",
  ];
  return { score, label: labels[score] || "", color: colors[score] || "" };
}

// ─── shared input ────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium mb-1.5">{label}</label>
      {children}
      {hint && (
        <p className="text-[12px] text-text-secondary mt-1">{hint}</p>
      )}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-foreground text-[14px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors";

const selectCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-foreground text-[14px] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors";

// ─── page ────────────────────────────────────────────────────────────────────

interface FormData {
  full_name: string;
  email: string;
  password: string;
  org_name: string;
  org_address_line: string;
  org_city: string;
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

const INITIAL: FormData = {
  full_name: "",
  email: "",
  password: "",
  org_name: "",
  org_address_line: "",
  org_city: "",
  entity_name: "",
  rentity_id: "",
  rentity_branch: "",
  compliance_officer_name: "",
  compliance_officer_email: "",
  local_currency: "NZD",
  industry: "law_firm",
  holiday_region: "Auckland",
  data_retention_years: 7,
};

const STEPS = ["Your account", "Organisation", "Reporting entity"];

export default function SignUpPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const set = (k: keyof FormData, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  const pw = passwordStrength(form.password);

  function canAdvance() {
    if (step === 0)
      return (
        form.full_name.trim() &&
        form.email.trim() &&
        pw.score >= 3
      );
    if (step === 1) return form.org_name.trim() && form.org_city.trim();
    return (
      form.entity_name.trim() &&
      form.rentity_id.trim() &&
      form.compliance_officer_name.trim()
    );
  }

  async function handleNext() {
    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }
    // Step 3 submit
    setLoading(true);
    setError(null);
    const result = await registerOrganisation(form);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/mfa-setup");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div>
        <div className="flex items-center gap-1 mb-5">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-1 flex-1 last:flex-none">
              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                    i < step
                      ? "bg-green text-white"
                      : i === step
                        ? "bg-accent text-white"
                        : "bg-border text-text-tertiary"
                  }`}
                >
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span
                  className={`text-[12px] font-medium ${
                    i === step ? "text-foreground" : "text-text-tertiary"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-border mx-2" />
              )}
            </div>
          ))}
        </div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          {STEPS[step]}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {step === 0 && "Create your login credentials"}
          {step === 1 && "Tell us about your practice"}
          {step === 2 && "Set up your first reporting entity"}
        </p>
      </div>

      {error && (
        <div className="bg-red-bg border border-red-border text-red text-[13px] px-3.5 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      {/* Step 1 */}
      {step === 0 && (
        <div className="space-y-4">
          <Field label="Full name">
            <input
              className={inputCls}
              placeholder="Jane Smith"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
            />
          </Field>
          <Field label="Email address">
            <input
              type="email"
              className={inputCls}
              placeholder="jane@lawfirm.co.nz"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field
            label="Password"
            hint="Min 12 characters, uppercase, lowercase, number, and symbol"
          >
            <input
              type="password"
              className={inputCls}
              placeholder="Create a strong password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
            {form.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(pw.score / 5) * 100}%`,
                      background: pw.color,
                    }}
                  />
                </div>
                <span className="text-[11px] font-medium" style={{ color: pw.color }}>
                  {pw.label}
                </span>
              </div>
            )}
          </Field>
        </div>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <div className="space-y-4">
          <Field
            label="Organisation name"
            hint="The name of your practice or consultancy"
          >
            <input
              className={inputCls}
              placeholder="Smith & Associates Law"
              value={form.org_name}
              onChange={(e) => set("org_name", e.target.value)}
            />
          </Field>
          <Field label="Address">
            <input
              className={inputCls}
              placeholder="123 Queen Street"
              value={form.org_address_line}
              onChange={(e) => set("org_address_line", e.target.value)}
            />
          </Field>
          <Field label="City">
            <input
              className={inputCls}
              placeholder="Auckland"
              value={form.org_city}
              onChange={(e) => set("org_city", e.target.value)}
            />
          </Field>
        </div>
      )}

      {/* Step 3 */}
      {step === 2 && (
        <div className="space-y-4">
          <Field
            label="Reporting entity name"
            hint="As registered with the FIU"
          >
            <input
              className={inputCls}
              placeholder="Smith & Associates Law Limited"
              value={form.entity_name}
              onChange={(e) => set("entity_name", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="FIU entity ID (rentity_id)">
              <input
                className={inputCls}
                placeholder="NZ-12345"
                value={form.rentity_id}
                onChange={(e) => set("rentity_id", e.target.value)}
              />
            </Field>
            <Field label="Branch (optional)">
              <input
                className={inputCls}
                placeholder="City Office"
                value={form.rentity_branch}
                onChange={(e) => set("rentity_branch", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Compliance officer name">
            <input
              className={inputCls}
              placeholder="Jane Smith"
              value={form.compliance_officer_name}
              onChange={(e) => set("compliance_officer_name", e.target.value)}
            />
          </Field>
          <Field label="Compliance officer email (optional)">
            <input
              type="email"
              className={inputCls}
              placeholder="jane@lawfirm.co.nz"
              value={form.compliance_officer_email}
              onChange={(e) => set("compliance_officer_email", e.target.value)}
            />
          </Field>
          <Field label="Industry type">
            <select
              className={selectCls}
              value={form.industry}
              onChange={(e) => set("industry", e.target.value as IndustryType)}
            >
              {INDUSTRIES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Holiday region">
              <select
                className={selectCls}
                value={form.holiday_region}
                onChange={(e) => set("holiday_region", e.target.value)}
              >
                {NZ_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Data retention">
              <select
                className={selectCls}
                value={form.data_retention_years}
                onChange={(e) =>
                  set("data_retention_years", Number(e.target.value) as 5 | 7)
                }
              >
                <option value={7}>7 years</option>
                <option value={5}>5 years</option>
              </select>
            </Field>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-border text-[14px] font-medium hover:bg-surface-alt transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canAdvance() || loading}
          className="flex-1 flex items-center justify-center gap-1.5 bg-accent text-white py-2.5 rounded-full text-[14px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {loading ? (
            "Creating account…"
          ) : step < 2 ? (
            <>
              Continue <ArrowRight size={14} />
            </>
          ) : (
            "Create account"
          )}
        </button>
      </div>

      <p className="text-center text-[13px] text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-accent font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
