"use client";


import { useState } from "react";
import Link from "next/link";
import { sendPasswordReset } from "@/lib/actions/auth";
import { Mail, ArrowLeft } from "@/components/ui/icons";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-foreground text-[14px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const origin = window.location.origin;
    const result = await sendPasswordReset(email.trim(), origin);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent">
          <Mail size={22} />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Check your inbox
          </h1>
          <p className="text-text-secondary text-sm mt-2 leading-relaxed">
            We sent a password reset link to{" "}
            <span className="font-medium text-foreground">{email}</span>. The
            link expires in 1 hour.
          </p>
        </div>
        <p className="text-[13px] text-text-secondary">
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-accent font-medium hover:underline"
          >
            Send again
          </button>
        </p>
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {error && (
        <div className="bg-red-bg border border-red-border text-red text-[13px] px-3.5 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium mb-1.5">
            Email address
          </label>
          <input
            type="email"
            required
            className={inputCls}
            placeholder="jane@lawfirm.co.nz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={!email.trim() || loading}
          className="w-full bg-accent text-white py-2.5 rounded-full text-[14px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <Link
        href="/login"
        className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-foreground transition-colors"
      >
        <ArrowLeft size={13} />
        Back to sign in
      </Link>
    </div>
  );
}
