"use client";

export const instant = false;

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Smartphone, Shield } from "@/components/ui/icons";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-foreground text-[14px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors tracking-[0.2em] text-center text-xl font-mono";

export default function MfaSetupPage() {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function enroll() {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Rinse Report",
      });
      if (error || !data) {
        setError(error?.message ?? "Failed to start MFA setup");
        setEnrolling(false);
        return;
      }
      setFactorId(data.id);
      setQrUrl(data.totp.qr_code);
      setSecret(data.totp.secret);
      setEnrolling(false);
    }
    enroll();
  }, []);

  async function handleVerify() {
    if (!factorId || code.length !== 6) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Get or create challenge
    let cId = challengeId;
    if (!cId) {
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chErr || !ch) {
        setError(chErr?.message ?? "Failed to create challenge");
        setLoading(false);
        return;
      }
      cId = ch.id;
      setChallengeId(ch.id);
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: cId,
      code,
    });

    if (verifyError) {
      setError(verifyError.message);
      setCode("");
      setChallengeId(null); // Reset so a new challenge is issued on retry
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent mb-2">
        <Smartphone size={22} />
      </div>

      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Secure your account
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Set up an authenticator app to protect your account with two-factor authentication.
        </p>
      </div>

      {error && (
        <div className="bg-red-bg border border-red-border text-red text-[13px] px-3.5 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      {enrolling ? (
        <div className="flex items-center justify-center py-12 text-text-tertiary text-sm">
          Setting up…
        </div>
      ) : (
        <>
          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <p className="text-[13px] font-medium">
                Scan this QR code with your authenticator app
              </p>
            </div>
            <p className="text-[12px] text-text-secondary ml-7">
              Use Google Authenticator, Authy, 1Password, or any TOTP app.
            </p>
            {qrUrl && (
              <div className="ml-7 flex flex-col items-start gap-3">
                <div className="border border-border rounded-xl p-3 bg-white inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrUrl} alt="TOTP QR code" width={160} height={160} />
                </div>
                {secret && (
                  <div>
                    <p className="text-[11px] text-text-tertiary mb-1">
                      Or enter this key manually:
                    </p>
                    <code className="text-[12px] font-mono bg-surface-alt px-2.5 py-1.5 rounded-lg border border-border tracking-wider select-all">
                      {secret}
                    </code>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <p className="text-[13px] font-medium">Enter the 6-digit code</p>
            </div>
            <div className="ml-7">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className={inputCls}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && code.length === 6 && handleVerify()}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={code.length !== 6 || loading}
            className="w-full flex items-center justify-center gap-1.5 bg-accent text-white py-2.5 rounded-full text-[14px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Enable two-factor auth"}
          </button>

          <p className="text-center text-[12px] text-text-tertiary">
            You can manage 2FA later in Settings.{" "}
            <Link href="/dashboard" className="text-accent hover:underline">
              Skip for now
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
