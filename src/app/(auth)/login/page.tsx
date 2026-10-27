"use client";

export const instant = false;

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Smartphone } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-foreground text-[14px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Check assurance level — if MFA is enrolled, require TOTP
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (
      aalData?.nextLevel === "aal2" &&
      aalData.nextLevel !== aalData.currentLevel
    ) {
      // Need MFA — list factors and start challenge
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if (totp) {
        const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
          factorId: totp.id,
        });
        if (chErr || !ch) {
          setError(chErr?.message ?? "Failed to start MFA challenge");
          setLoading(false);
          return;
        }
        setFactorId(totp.id);
        setChallengeId(ch.id);
        setStep("mfa");
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || !challengeId || mfaCode.length !== 6) return;
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: mfaCode,
    });

    if (verifyError) {
      setError(verifyError.message);
      setMfaCode("");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (step === "mfa") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent">
          <Smartphone size={22} />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            Two-factor authentication
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        {error && (
          <div className="bg-red-bg border border-red-border text-red text-[13px] px-3.5 py-2.5 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleMfa} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium mb-1.5">
              Authenticator code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className={`${inputCls} tracking-[0.2em] text-center text-xl font-mono`}
              placeholder="000000"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={mfaCode.length !== 6 || loading}
            className="w-full bg-accent text-white py-2.5 rounded-full text-[14px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setStep("credentials"); setError(null); setMfaCode(""); }}
          className="text-[13px] text-text-secondary hover:text-foreground transition-colors"
        >
          ← Use a different account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Enter your email to access your reporting dashboard.
        </p>
      </div>

      {error && (
        <div className="bg-red-bg border border-red-border text-red text-[13px] px-3.5 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSignIn}>
        <div>
          <label className="block text-[13px] font-medium mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.co.nz"
            required
            className={inputCls}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[13px] font-medium">Password</label>
            <Link
              href="/forgot-password"
              className="text-[12px] text-accent hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className={inputCls}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-white py-2.5 rounded-full text-[14px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="flex items-center gap-2 text-text-tertiary text-[12px] justify-center">
        <Lock size={12} />
        Secured with 256-bit encryption
      </div>

      <p className="text-center text-[13px] text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-accent font-medium hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
