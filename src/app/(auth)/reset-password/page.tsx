"use client";

export const instant = false;

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/lib/actions/auth";
import { Lock } from "@/components/ui/icons";

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

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pw = passwordStrength(password);
  const mismatch = confirm && password !== confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (pw.score < 3) {
      setError("Please choose a stronger password");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await updatePassword(password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent">
        <Lock size={22} />
      </div>
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Set a new password
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Choose a strong password for your account.
        </p>
      </div>

      {error && (
        <div className="bg-red-bg border border-red-border text-red text-[13px] px-3.5 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium mb-1.5">New password</label>
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

        <div>
          <label className="block text-[13px] font-medium mb-1.5">Confirm password</label>
          <input
            type="password"
            required
            className={`${inputCls} ${mismatch ? "border-red focus:border-red focus:ring-red/30" : ""}`}
            placeholder="Repeat your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {mismatch && (
            <p className="text-[12px] text-red mt-1">Passwords do not match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!password || !confirm || !!mismatch || pw.score < 3 || loading}
          className="w-full bg-accent text-white py-2.5 rounded-full text-[14px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
