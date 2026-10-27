"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { acceptInvitation } from "@/lib/actions/invitations";
import { Shield } from "@/components/ui/icons";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-foreground text-[14px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors";

function passwordStrength(p: string): { score: number; label: string; color: string } {
  let score = 0;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[a-z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const labels = ["", "Weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "var(--red)", "var(--red)", "var(--amber)", "var(--green)", "var(--green)"];
  return { score, label: labels[score] || "", color: colors[score] || "" };
}

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pw = passwordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.score < 3) {
      setError("Please choose a stronger password");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await acceptInvitation({ token, full_name, email, password });
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
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent">
        <Shield size={22} />
      </div>
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Accept your invitation
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Create an account to join your team on Rinse Report.
        </p>
      </div>

      {error && (
        <div className="bg-red-bg border border-red-border text-red text-[13px] px-3.5 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium mb-1.5">Full name</label>
          <input
            required
            className={inputCls}
            placeholder="Jane Smith"
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium mb-1.5">Email address</label>
          <input
            type="email"
            required
            className={inputCls}
            placeholder="jane@lawfirm.co.nz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-[12px] text-text-secondary mt-1">
            Must match the email your invitation was sent to.
          </p>
        </div>
        <div>
          <label className="block text-[13px] font-medium mb-1.5">Password</label>
          <input
            type="password"
            required
            className={inputCls}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-[12px] text-text-secondary mt-1">
            Min 12 characters, uppercase, lowercase, number, and symbol
          </p>
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(pw.score / 5) * 100}%`, background: pw.color }}
                />
              </div>
              <span className="text-[11px] font-medium" style={{ color: pw.color }}>
                {pw.label}
              </span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!full_name.trim() || !email.trim() || pw.score < 3 || loading}
          className="w-full bg-accent text-white py-2.5 rounded-full text-[14px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Join team"}
        </button>
      </form>

      <p className="text-center text-[13px] text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-accent font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
