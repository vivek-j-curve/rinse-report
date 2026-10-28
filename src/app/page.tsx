import Link from "next/link";
import {
  Shield,
  CheckCircle,
  Clock,
  Lock,
  FileText,
  LayoutGrid,
  AlertTriangle,
  ArrowRight,
  Flag,
} from "@/components/ui/icons";

export const metadata = {
  title: "Rinse Report: AML/CFT Filing for New Zealand",
  description:
    "Guided suspicious activity reporting with goAML XML generation and SLA tracking for New Zealand reporting entities. Start at $200 NZD/month.",
};

const features = [
  {
    icon: FileText,
    title: "Answer questions. Get a compliant report.",
    body: "A branching questionnaire leads compliance staff through STR and SAR intake. No XML field names. No goAML UI. Just plain-language questions that map to the correct fields behind the scenes.",
  },
  {
    icon: CheckCircle,
    title: "goAML XML, ready to upload to the FIU portal.",
    body: "Every answer maps to the correct fields automatically. When you're ready to file, download a valid XML file and upload it directly to the FIU portal. No manual schema work.",
  },
  {
    icon: Clock,
    title: "The 5-business-day clock, always visible.",
    body: "The countdown starts the moment a suspicion is formed. Colour-coded indicators show green (3+ days left), amber (1 to 2 days), and red (breached). NZ public holidays and regional anniversaries included.",
  },
  {
    icon: LayoutGrid,
    title: "Nothing gets lost. Every case, tracked end to end.",
    body: "From the moment a suspicion is raised to the day it's filed with the FIU, every case has an owner, a status, and a full activity timeline. No more chasing colleagues for updates or losing context between staff.",
  },
  {
    icon: Lock,
    title: "Auditor-ready records and an immutable audit trail.",
    body: "Owner, Admin, Analyst, and Viewer roles with row-level security. Every action is logged with who, when, and what changed. MFA enforced for all users. Encrypted at rest and in transit.",
  },
  {
    icon: Flag,
    title: "Your filing performance, at a glance.",
    body: "SLA compliance rates, filing volumes by report type, typology trends, and rejection rates across all your reporting entities. Dashboards built for AML compliance officers, not just data teams.",
  },
];

const entities = [
  "Law firms",
  "Accountancy practices",
  "Real estate agencies",
  "Trust & company service providers",
  "Money remitters & currency exchangers",
  "Non-bank deposit takers",
  "Lenders & finance companies",
  "Payment service providers",
  "Wealth & investment service providers",
  "Casinos",
];

const problems = [
  {
    heading: "The goAML portal rejects reports constantly",
    detail:
      "No inline validation, no guidance on what an accepted report looks like. Staff submit with errors and the FIU sends it back, burning days of the 5-business-day window.",
  },
  {
    heading: "Manual deadline tracking is a breach waiting to happen",
    detail:
      "Spreadsheet reminders and calendar entries miss the 5-business-day deadline. Each breach risks a regulatory sanction under the AML/CFT Act 2009.",
  },
  {
    heading: "Reports in shared Drive folders are not compliant",
    detail:
      "Shared folders accessible to unauthorised staff, no audit trail, and no encryption at rest. That alone is an AML/CFT Act breach.",
  },
];

const trustSignals = [
  "STR and SAR reports",
  "5-business-day SLA tracking",
  "NZ public holidays included",
  "MFA enforced for all users",
  "Row-level data isolation",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 bg-accent rounded-[7px] flex items-center justify-center text-white">
              <Shield size={14} />
            </div>
            <span className="font-sans font-bold text-[15px] tracking-tight">
              Rinse Report
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors px-3 py-1.5 rounded-md"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-[13px] font-medium bg-accent hover:bg-accent-hover text-white px-3.5 py-1.5 rounded-md transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-1.5 bg-accent-subtle text-accent text-[12px] font-medium px-3 py-1 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-accent rounded-full" />
            For New Zealand reporting entities
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl font-semibold leading-[1.1] mb-6 max-w-2xl mx-auto">
            From suspicion to FIU filing
            <br />
            <em>in under 30 minutes.</em>
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Rinse Report replaces the goAML portal with a guided questionnaire
            that generates compliant XML, tracks your 5-business-day SLA, and
            stores everything securely under role-based access.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium text-[14px] px-5 py-2.5 rounded-lg transition-colors"
            >
              Start filing properly
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/login"
              className="text-[14px] font-medium text-text-secondary hover:text-foreground transition-colors px-5 py-2.5"
            >
              Sign in to your account
            </Link>
          </div>
          <p className="text-text-tertiary text-[12px] mt-4">
            $200 NZD per reporting entity per month. No setup fee.
          </p>
        </section>

        {/* Trust signals */}
        <section className="border-y border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-2">
              {trustSignals.map((s) => (
                <span key={s} className="text-[12px] text-text-tertiary font-medium flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-green shrink-0" />
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Problem strip */}
        <section className="bg-surface-alt border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <p className="text-center text-[12px] font-medium text-text-tertiary uppercase tracking-wide mb-10">
              Why compliance officers switch to Rinse Report
            </p>
            <div className="grid sm:grid-cols-3 gap-8">
              {problems.map((p) => (
                <div key={p.heading}>
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle size={15} className="text-amber shrink-0 mt-0.5" />
                    <h3 className="font-medium text-[14px]">{p.heading}</h3>
                  </div>
                  <p className="text-text-secondary text-[13px] leading-relaxed pl-[23px]">
                    {p.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-3">
              Everything the FIU process demands
            </h2>
            <p className="text-text-secondary text-[15px] max-w-lg mx-auto">
              Built specifically for NZ non-bank reporting entities navigating
              the AML/CFT Act 2009.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-surface border border-border rounded-xl p-6"
              >
                <div className="w-9 h-9 bg-accent-subtle rounded-lg flex items-center justify-center mb-4">
                  <f.icon size={17} className="text-accent" />
                </div>
                <h3 className="font-medium text-[14px] mb-2">{f.title}</h3>
                <p className="text-text-secondary text-[13px] leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA repeat */}
        <section className="border-y border-border bg-surface-alt">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 flex flex-col sm:flex-row items-start sm:items-center gap-8">
            <div className="flex-1">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
                One login for all your clients
              </h2>
              <p className="text-text-secondary text-[14px] leading-relaxed max-w-lg">
                Compliance consultancies can manage multiple reporting entities
                from a single organisation account. Each entity has its own
                subscription, cases, and filings. You manage them all from one place.
              </p>
            </div>
            <Link
              href="/sign-up"
              className="shrink-0 flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium text-[14px] px-5 py-2.5 rounded-lg transition-colors"
            >
              Start filing properly
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="max-w-md mx-auto text-center">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-3">
              Simple pricing
            </h2>
            <p className="text-text-secondary text-[15px] mb-10">
              One flat rate per reporting entity. No tiers, no seat limits.
            </p>
            <div className="bg-surface border border-border-strong rounded-2xl p-8">
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-4xl font-bold font-sans">$200</span>
                <span className="text-text-secondary text-[14px]">NZD / month</span>
              </div>
              <p className="text-text-secondary text-[13px] mb-8">per reporting entity</p>
              <ul className="text-left space-y-3 mb-8">
                {[
                  "Unlimited users per organisation",
                  "STR and SAR report types",
                  "goAML XML generation",
                  "SLA tracking and notifications",
                  "Case management and audit trail",
                  "Dashboard analytics",
                  "20MB attachments per suspicion",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px]">
                    <CheckCircle size={15} className="text-green mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="block w-full bg-accent hover:bg-accent-hover text-white font-medium text-[14px] py-3 rounded-lg transition-colors text-center"
              >
                Start filing properly
              </Link>
              <p className="text-text-tertiary text-[12px] mt-4">
                Cancel anytime.
              </p>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="border-t border-border bg-surface-alt">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
              Who uses Rinse Report
            </h2>
            <p className="text-text-secondary text-[14px] mb-10">
              Any reporting entity under the AML/CFT Act 2009.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {entities.map((e) => (
                <span
                  key={e}
                  className="bg-surface border border-border text-[13px] text-text-secondary px-3.5 py-1.5 rounded-full"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-4">
            Ready to file with confidence?
          </h2>
          <p className="text-text-secondary text-[15px] mb-8 max-w-sm mx-auto">
            Set up your organisation and first reporting entity in minutes.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium text-[14px] px-6 py-3 rounded-lg transition-colors"
          >
            Start filing properly
            <ArrowRight size={15} />
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded-[5px] flex items-center justify-center text-white">
              <Shield size={11} />
            </div>
            <span className="font-sans font-bold text-[13px] tracking-tight">
              Rinse Report
            </span>
          </div>
          <p className="text-text-tertiary text-[12px]">
            &copy; 2026 Rinse Report. Built for New Zealand AML/CFT compliance.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-text-tertiary hover:text-text-secondary text-[12px] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-text-tertiary hover:text-text-secondary text-[12px] transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
