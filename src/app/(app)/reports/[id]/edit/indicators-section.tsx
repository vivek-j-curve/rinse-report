"use client";

import { useState, useEffect, useRef } from "react";
import { saveIndicators } from "@/lib/actions/reports";
import { INDICATOR_GROUPS, SECTOR_SUPERVISOR_CODES, type IndicatorGroup } from "@/lib/indicators";

const SCAM_CODE = "CS1";

export function IndicatorsSection({
  reportId,
  selectedIndicators,
  reportType,
  onUpdate,
  onRegisterSave,
}: {
  reportId: string;
  selectedIndicators: string[];
  reportType: "STR" | "SAR" | "LCT" | "IFT";
  onUpdate: () => void;
  onRegisterSave?: (fn: (() => Promise<void>) | null) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedIndicators)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleIndicator(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    setSaved(false);
  }

  function selectAll(group: IndicatorGroup) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const ind of group.indicators) next.add(ind.code);
      return next;
    });
    setSaved(false);
  }

  function deselectAll(group: IndicatorGroup) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const ind of group.indicators) next.delete(ind.code);
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await saveIndicators(reportId, Array.from(selected));
    setSaving(false);
    setSaved(true);
    onUpdate();
  }

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    if (!onRegisterSave) return;
    onRegisterSave(() => handleSaveRef.current());
    return () => onRegisterSave(null);
  }, [onRegisterSave]);

  const groupHasAny = (g: IndicatorGroup) =>
    g.indicators.some((i) => selected.has(i.code));

  const hasScam = selected.has(SCAM_CODE);

  return (
    <div>
      {hasScam && (
        <div className="rounded-lg bg-surface border border-accent/30 px-4 py-3 text-[13px] mb-5">
          <p className="font-semibold">Scam report — check your Reason field</p>
          <p className="text-text-secondary mt-0.5">
            Because CS1 is selected, the <strong>Reason for Suspicion</strong> must begin with the word{" "}
            <code className="font-mono font-bold">SCAM</code> (all capitals). The FIU accepts scam reports for intelligence purposes only.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold">Suspicion Indicators</h3>
          <p className="text-[12px] text-text-tertiary mt-0.5">
            Select all indicators that apply to this {reportType} report. At
            least one is required.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-text-secondary">
            {selected.size} selected
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-[13px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : saved ? "Saved" : "Save Indicators"}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {INDICATOR_GROUPS.map((group) => {
          const visibleIndicators = group.indicators.filter((ind) => !SECTOR_SUPERVISOR_CODES.has(ind.code));
          if (visibleIndicators.length === 0) return null;
          const visibleGroup = { ...group, indicators: visibleIndicators };
          return (
          <div key={group.title}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-[13px] font-semibold">{group.title}</h4>
                <p className="text-[11px] text-text-tertiary">
                  {group.description}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => selectAll(visibleGroup)}
                  className="text-[11px] text-accent hover:underline"
                >
                  Select all
                </button>
                {groupHasAny(visibleGroup) && (
                  <>
                    <span className="text-text-tertiary">·</span>
                    <button
                      onClick={() => deselectAll(visibleGroup)}
                      className="text-[11px] text-text-secondary hover:underline"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-1">
              {visibleIndicators.map((ind) => (
                <div
                  key={ind.code}
                  onClick={() => toggleIndicator(ind.code)}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors select-none ${
                    selected.has(ind.code)
                      ? "bg-accent/5 border border-accent/20"
                      : "hover:bg-surface-alt border border-transparent"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(ind.code)}
                    readOnly
                    className="mt-0.5 rounded border-border pointer-events-none"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-text-tertiary font-medium">
                        {ind.code}
                      </span>
                      <span className="text-[13px]">{ind.label}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
