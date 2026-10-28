import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Privacy Policy — Rinse Report",
  description: "How Rinse Report collects, uses, and protects your information under the New Zealand Privacy Act 2020.",
};

const EFFECTIVE_DATE = "28 October 2026";
const CONTACT_EMAIL = "vivek@jcurve.co.nz";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 bg-accent rounded-[7px] flex items-center justify-center text-white">
              <Shield size={14} />
            </div>
            <span className="font-sans font-bold text-[15px] tracking-tight">Rinse Report</span>
          </Link>
          <Link href="/login" className="text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors">
            Sign in
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-16">
        <div className="mb-10">
          <p className="text-[12px] font-medium text-text-tertiary uppercase tracking-wide mb-3">Legal</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold mb-4">Privacy Policy</h1>
          <p className="text-text-secondary text-[14px]">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="prose-legal">
          <Section title="1. Who we are">
            <p>
              Rinse Report (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a software service that helps New
              Zealand reporting entities manage Anti-Money Laundering and Countering Financing of Terrorism (AML/CFT) filings
              with the New Zealand Police Financial Intelligence Unit (FIU).
            </p>
            <p>
              We are bound by the New Zealand <strong>Privacy Act 2020</strong> and the Information Privacy Principles (IPPs)
              it contains.
            </p>
            <p>
              For any privacy-related queries, contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section title="2. What information we collect">
            <p>We collect personal information in the following categories:</p>
            <SubSection title="Account and organisation information">
              <ul>
                <li>Name, email address, and password (hashed — we never store your password in plain text)</li>
                <li>Organisation name, role within the organisation, and job title</li>
                <li>Billing contact name and email address</li>
              </ul>
            </SubSection>
            <SubSection title="AML/CFT case and report data">
              <ul>
                <li>Information about subjects of suspicion reports (individuals or entities), including names, dates of birth, addresses, identification document numbers, and financial transaction details</li>
                <li>Narrative descriptions of suspicious activity</li>
                <li>Files and attachments uploaded to support a filing (up to 20 MB per case)</li>
                <li>Dates, times, and statuses of filings submitted to the FIU</li>
              </ul>
              <p className="text-text-secondary text-[13px] mt-2">
                This data is provided by your organisation as part of your AML/CFT compliance obligations. It may include personal information about third parties (such as transaction subjects). You, as the reporting entity, are responsible for ensuring you have a lawful basis to collect and provide this information.
              </p>
            </SubSection>
            <SubSection title="Usage and technical information">
              <ul>
                <li>Log data including IP address, browser type, pages visited, and timestamps</li>
                <li>Audit trail data recording who performed which actions and when, within your organisation account</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="3. How we use your information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and operate the Rinse Report platform, including generating compliant goAML XML files</li>
              <li>Manage your account, subscription, and billing</li>
              <li>Send transactional communications (account invitations, password resets, SLA deadline alerts, filing confirmations)</li>
              <li>Maintain the security and integrity of the platform and its audit trail</li>
              <li>Comply with our legal obligations</li>
              <li>Respond to your support requests</li>
            </ul>
            <p>
              We do not use your AML/CFT report data for any purpose other than providing the service to your organisation. We do not sell, share, or use your data for advertising or marketing purposes.
            </p>
          </Section>

          <Section title="4. Disclosure of your information">
            <p>We share personal information only in the following circumstances:</p>
            <SubSection title="Service providers">
              <p>We use the following third-party processors to operate the platform:</p>
              <ul>
                <li><strong>Supabase</strong> &mdash; database hosting and authentication. Data is stored on infrastructure in AWS regions (primarily Sydney, Australia).</li>
                <li><strong>Resend</strong> &mdash; transactional email delivery</li>
                <li><strong>Stripe</strong> &mdash; subscription billing and payment processing</li>
                <li><strong>Vercel</strong> &mdash; application hosting and content delivery</li>
              </ul>
              <p>Each provider is bound by data processing terms consistent with applicable privacy law.</p>
            </SubSection>
            <SubSection title="Legal requirements">
              <p>
                We may disclose personal information if required to do so by law, court order, or a lawful request by a New Zealand government agency.
              </p>
            </SubSection>
            <SubSection title="Business transfers">
              <p>
                If Rinse Report is acquired or merged with another business, your information may be transferred to the new owner. We will notify you before any transfer occurs.
              </p>
            </SubSection>
            <p>We do not otherwise disclose your personal information to third parties without your consent.</p>
          </Section>

          <Section title="5. Storage and security">
            <p>
              Your data is stored on Supabase-managed infrastructure within Amazon Web Services data centres. Data is encrypted at rest and in transit using industry-standard protocols.
            </p>
            <p>
              Access to your organisation&rsquo;s data within the platform is controlled by role-based permissions (Owner, Admin, Analyst, Viewer) with row-level security enforced at the database layer. Multi-factor authentication (MFA) is required for all users.
            </p>
            <p>
              We retain your data for as long as your subscription is active. If you cancel your subscription, we will retain your data for 90 days to allow you to export it, after which it will be securely deleted unless a longer retention period is required by law or your obligations under the AML/CFT Act 2009.
            </p>
          </Section>

          <Section title="6. Offshore disclosure">
            <p>
              Some of your personal information is stored and processed outside New Zealand, including in Australia (AWS Sydney region) and the United States (Resend, Stripe, Vercel). Where personal information is sent offshore, we take reasonable steps to ensure it is adequately protected, consistent with Principle 12 of the Privacy Act 2020.
            </p>
          </Section>

          <Section title="7. Your rights">
            <p>Under the Privacy Act 2020, you have the right to:</p>
            <ul>
              <li>
                <strong>Access</strong> your personal information held by us (Principle 6). Contact us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">{CONTACT_EMAIL}</a> to make a request. We will respond within 20 working days.
              </li>
              <li>
                <strong>Correct</strong> your personal information if it is inaccurate, incomplete, or misleading (Principle 7). Most account information can be updated directly within the platform.
              </li>
              <li>
                <strong>Complain</strong> if you believe we have breached the Privacy Act 2020 (see section 9 below).
              </li>
            </ul>
          </Section>

          <Section title="8. Cookies and tracking">
            <p>
              Rinse Report uses session cookies to manage authenticated user sessions. We do not use tracking cookies, third-party advertising cookies, or analytics tools that identify individual users across sites.
            </p>
            <p>
              We may collect aggregate, anonymised usage data (such as page load times and feature usage frequency) to improve the platform. This data cannot be used to identify you.
            </p>
          </Section>

          <Section title="9. Complaints">
            <p>
              If you have a complaint about how we have handled your personal information, please contact us first at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">{CONTACT_EMAIL}</a>. We will acknowledge your complaint within 5 working days and aim to resolve it within 20 working days.
            </p>
            <p>
              If you are not satisfied with our response, you may complain to the New Zealand Privacy Commissioner at{" "}
              <a href="https://www.privacy.org.nz" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                www.privacy.org.nz
              </a>{" "}
              or by calling 0800 803 909.
            </p>
          </Section>

          <Section title="10. Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email or by displaying a notice in the platform at least 14 days before the changes take effect. The effective date at the top of this page will always reflect the current version.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For any questions about this Privacy Policy or our privacy practices, contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </Section>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded-[5px] flex items-center justify-center text-white">
              <Shield size={11} />
            </div>
            <span className="font-sans font-bold text-[13px] tracking-tight">Rinse Report</span>
          </Link>
          <p className="text-text-tertiary text-[12px]">
            &copy; 2026 Rinse Report. Built for New Zealand AML/CFT compliance.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-text-tertiary hover:text-text-secondary text-[12px] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-text-tertiary hover:text-text-secondary text-[12px] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-sans font-semibold text-[17px] mb-4 text-foreground">{title}</h2>
      <div className="text-[14px] text-text-secondary leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pl-4 border-l-2 border-border my-4">
      <h3 className="font-medium text-[13px] text-foreground mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
