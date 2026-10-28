"use client";

import { useState } from "react";
import { X } from "@/components/ui/icons";

type Field = { label: string; name: string; type: string; placeholder: string; required: boolean };

const fields: Field[] = [
  { label: "Full name", name: "name", type: "text", placeholder: "Jane Smith", required: true },
  { label: "Email address", name: "email", type: "email", placeholder: "jane@company.co.nz", required: true },
  { label: "Mobile number", name: "mobile", type: "tel", placeholder: "+64 21 000 0000", required: true },
  { label: "Company name", name: "company", type: "text", placeholder: "Acme Law Partners", required: true },
  { label: "Job title", name: "jobTitle", type: "text", placeholder: "AML Compliance Officer", required: true },
];

type Status = "idle" | "submitting" | "success" | "error";

export function BookCallModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", mobile: "", company: "", jobTitle: "" });
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch("/api/book-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h2 className="font-serif text-2xl font-semibold">Book a call</h2>
            <p className="text-text-secondary text-[13px] mt-1">
              We&rsquo;ll reach out within one business day.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-foreground hover:bg-surface-alt transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {status === "success" ? (
          <div className="p-6 pt-8 text-center">
            <div className="w-12 h-12 bg-green-bg border border-green-border rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="font-medium text-[15px] mb-1">Thanks, we&rsquo;ll be in touch.</p>
            <p className="text-text-secondary text-[13px]">Expect a call within one business day.</p>
            <button
              onClick={onClose}
              className="mt-6 text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 pt-5 flex flex-col gap-4">
            {fields.map((f) => (
              <div key={f.name}>
                <label className="block text-[12px] font-medium text-text-secondary mb-1.5">
                  {f.label}
                </label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  required={f.required}
                  value={form[f.name as keyof typeof form]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                  className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
            ))}

            {status === "error" && (
              <p className="text-red text-[12px]">Something went wrong. Please try again or email us directly.</p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="mt-1 w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-semibold text-[14px] py-2.5 rounded-lg transition-colors"
            >
              {status === "submitting" ? "Sending…" : "Request a call"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
