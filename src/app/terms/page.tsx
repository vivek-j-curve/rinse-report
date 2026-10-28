import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Terms and Conditions — Rinse Report",
  description: "Terms and conditions for using the Rinse Report AML/CFT compliance platform.",
};

const EFFECTIVE_DATE = "28 October 2026";
const CONTACT_EMAIL = "admin@rinsereport.com";
const MONTHLY_FEE = "$200 NZD";

export default function TermsPage() {
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
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold mb-4">Terms and Conditions</h1>
          <p className="text-text-secondary text-[14px]">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="text-[14px] text-text-secondary leading-relaxed mb-8 p-4 bg-surface-alt border border-border rounded-xl">
          Please read these Terms and Conditions carefully before using Rinse Report. By creating an account or using the platform, you agree to be bound by these terms. If you do not agree, do not use the service.
        </div>

        <div>
          <Section title="1. Definitions">
            <p>In these Terms and Conditions:</p>
            <ul>
              <li><strong>&ldquo;Rinse Report&rdquo;</strong>, <strong>&ldquo;we&rdquo;</strong>, <strong>&ldquo;us&rdquo;</strong>, or <strong>&ldquo;our&rdquo;</strong> refers to the operator of the Rinse Report platform.</li>
              <li><strong>&ldquo;Platform&rdquo;</strong> means the Rinse Report software-as-a-service application accessible at app.rinsereport.com.</li>
              <li><strong>&ldquo;Subscriber&rdquo;</strong>, <strong>&ldquo;you&rdquo;</strong>, or <strong>&ldquo;your&rdquo;</strong> means the organisation or individual who has registered for a Rinse Report account.</li>
              <li><strong>&ldquo;Reporting Entity&rdquo;</strong> means a reporting entity as defined under the Anti-Money Laundering and Countering Financing of Terrorism Act 2009 (AML/CFT Act).</li>
              <li><strong>&ldquo;User&rdquo;</strong> means any individual authorised by the Subscriber to access the Platform.</li>
              <li><strong>&ldquo;Subscription&rdquo;</strong> means a paid plan providing access to the Platform for a specified number of Reporting Entities.</li>
            </ul>
          </Section>

          <Section title="2. Eligibility and account registration">
            <p>
              The Platform is designed for Reporting Entities subject to the New Zealand AML/CFT Act 2009 and their compliance advisers. By registering, you represent that:
            </p>
            <ul>
              <li>You are at least 18 years of age and have the legal authority to enter into a binding agreement on behalf of your organisation.</li>
              <li>All information you provide during registration is accurate, current, and complete.</li>
              <li>You will maintain the accuracy of your account information and promptly update it when it changes.</li>
            </ul>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">{CONTACT_EMAIL}</a> if you suspect any unauthorised access to your account.
            </p>
          </Section>

          <Section title="3. Subscription and billing">
            <SubSection title="Fees">
              <p>
                Access to the Platform is provided on a subscription basis at{" "}
                <strong>{MONTHLY_FEE} per Reporting Entity per month</strong> (excluding GST). Fees are billed monthly in advance via our payment processor (Stripe).
              </p>
            </SubSection>
            <SubSection title="GST">
              <p>
                All fees are stated exclusive of New Zealand Goods and Services Tax (GST). Where applicable, GST will be added to invoices at the prevailing rate (currently 15%).
              </p>
            </SubSection>
            <SubSection title="Payment">
              <p>
                By subscribing, you authorise us to charge your nominated payment method each month. If payment fails, we will notify you and may suspend access to the Platform until the outstanding amount is paid.
              </p>
            </SubSection>
            <SubSection title="Price changes">
              <p>
                We may change subscription fees by giving you at least 30 days&rsquo; written notice by email. Continued use of the Platform after the notice period constitutes acceptance of the new fees.
              </p>
            </SubSection>
          </Section>

          <Section title="4. Cancellation and termination">
            <SubSection title="Cancellation by you">
              <p>
                You may cancel your Subscription at any time by contacting us at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">{CONTACT_EMAIL}</a> or through the account settings in the Platform. Cancellation takes effect at the end of your current billing period. No refunds are provided for the remaining portion of a billing period.
              </p>
            </SubSection>
            <SubSection title="Termination by us">
              <p>
                We may suspend or terminate your access to the Platform immediately, without prior notice, if:
              </p>
              <ul>
                <li>You materially breach these Terms and Conditions and fail to remedy that breach within 14 days of written notice from us.</li>
                <li>You use the Platform in a manner that could harm us, other users, or third parties.</li>
                <li>Required by law or a regulatory authority.</li>
              </ul>
            </SubSection>
            <SubSection title="Effect of termination">
              <p>
                Upon termination, your access to the Platform will cease. We will retain your data for 90 days after termination, during which you may request an export. After that period, your data will be securely deleted.
              </p>
            </SubSection>
          </Section>

          <Section title="5. Acceptable use">
            <p>You agree to use the Platform only for lawful purposes and in accordance with these Terms. You must not:</p>
            <ul>
              <li>Use the Platform in a way that violates any applicable New Zealand or international law or regulation.</li>
              <li>Submit false, misleading, or inaccurate information in AML/CFT reports or account details.</li>
              <li>Attempt to gain unauthorised access to any part of the Platform, other users&rsquo; data, or our systems.</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Platform.</li>
              <li>Use the Platform to transmit malware, viruses, or any other harmful code.</li>
              <li>Resell or sublicense access to the Platform to third parties without our prior written consent.</li>
            </ul>
          </Section>

          <Section title="6. Your data">
            <p>
              You retain full ownership of all data you input into the Platform, including AML/CFT report data, case information, and any uploaded files (&ldquo;Customer Data&rdquo;).
            </p>
            <p>
              You grant us a limited, non-exclusive licence to process, store, and transmit Customer Data solely to the extent necessary to provide the Platform services to you.
            </p>
            <p>
              You are responsible for ensuring that any personal information you enter into the Platform has been collected lawfully and that you have a legal basis for providing it to us.
            </p>
            <p>
              We do not access or use Customer Data for any purpose other than providing and improving the Platform, except as required by law.
            </p>
          </Section>

          <Section title="7. Platform availability">
            <p>
              We aim to provide the Platform with high availability. However, we do not guarantee that the Platform will be available at all times, free from errors, or that it will meet all of your requirements. Scheduled maintenance windows will be communicated in advance where possible.
            </p>
            <p>
              We are not liable for any loss arising from downtime, errors, or interruptions to the Platform.
            </p>
          </Section>

          <Section title="8. Compliance disclaimer">
            <p>
              The Platform is a technology tool designed to assist reporting entities in preparing and filing AML/CFT reports. It does not constitute legal or compliance advice. You remain solely responsible for:
            </p>
            <ul>
              <li>The accuracy and completeness of all information submitted in your reports.</li>
              <li>Compliance with the AML/CFT Act 2009, the Financial Intelligence Unit&rsquo;s requirements, and all other applicable laws and regulations.</li>
              <li>Decisions about whether a transaction or activity is suspicious and whether a report should be filed.</li>
              <li>Timely submission of reports to the FIU within the 5-business-day deadline under section 40 of the AML/CFT Act 2009.</li>
            </ul>
            <p>
              We do not accept responsibility for any regulatory breach, penalty, or enforcement action arising from a failure to file, a late filing, or an inaccurate filing, regardless of whether the Platform was used.
            </p>
          </Section>

          <Section title="9. Intellectual property">
            <p>
              The Platform, including its software, design, features, user interface, and all content created by us, is owned by Rinse Report and protected by New Zealand and international intellectual property law. Nothing in these Terms grants you any right to use our trademarks, trade names, or branding.
            </p>
            <p>
              You may not copy, modify, distribute, or create derivative works based on any part of the Platform without our prior written consent.
            </p>
          </Section>

          <Section title="10. Limitation of liability">
            <p>
              To the maximum extent permitted by applicable New Zealand law (including the Consumer Guarantees Act 1993 and Fair Trading Act 1986, where applicable):
            </p>
            <ul>
              <li>
                Our total liability to you for any claim arising under or in connection with these Terms or the Platform (whether in contract, tort, statute, or otherwise) is limited to the total fees paid by you to us in the 3 months immediately preceding the event giving rise to the claim.
              </li>
              <li>
                We are not liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profit, revenue, data, goodwill, or opportunity, whether or not we were advised of the possibility of such loss.
              </li>
            </ul>
            <p>
              Nothing in these Terms limits liability that cannot be excluded by law, including liability for death or personal injury caused by negligence or fraudulent misrepresentation.
            </p>
          </Section>

          <Section title="11. Indemnity">
            <p>
              You agree to indemnify and hold harmless Rinse Report and its officers, employees, and contractors from any claims, losses, damages, costs (including legal costs), and expenses arising from:
            </p>
            <ul>
              <li>Your breach of these Terms.</li>
              <li>Your use of the Platform in violation of any applicable law or regulation.</li>
              <li>Any claim by a third party arising from Customer Data you submitted to the Platform.</li>
            </ul>
          </Section>

          <Section title="12. Privacy">
            <p>
              We collect and use personal information in accordance with our{" "}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>
              , which forms part of these Terms and Conditions.
            </p>
          </Section>

          <Section title="13. Changes to these terms">
            <p>
              We may update these Terms and Conditions from time to time. We will notify you of any material changes by email at least 14 days before the changes take effect. Continued use of the Platform after the notice period constitutes acceptance of the updated Terms. The effective date at the top of this page will always reflect the current version.
            </p>
          </Section>

          <Section title="14. Governing law and disputes">
            <p>
              These Terms and Conditions are governed by the laws of New Zealand. Any dispute arising from these Terms will be subject to the exclusive jurisdiction of the courts of New Zealand.
            </p>
            <p>
              Before initiating any formal legal proceedings, you agree to contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">{CONTACT_EMAIL}</a> and attempt to resolve the dispute informally within 30 days.
            </p>
          </Section>

          <Section title="15. General">
            <ul>
              <li><strong>Entire agreement.</strong> These Terms and Conditions, together with the Privacy Policy, constitute the entire agreement between you and Rinse Report regarding the Platform and supersede all prior agreements or understandings.</li>
              <li><strong>Severability.</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.</li>
              <li><strong>Waiver.</strong> Our failure to enforce any provision of these Terms is not a waiver of our right to enforce it in the future.</li>
              <li><strong>Assignment.</strong> You may not assign your rights or obligations under these Terms without our prior written consent. We may assign our rights and obligations with notice to you.</li>
            </ul>
          </Section>

          <Section title="16. Contact">
            <p>
              For any questions about these Terms and Conditions, contact us at{" "}
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
