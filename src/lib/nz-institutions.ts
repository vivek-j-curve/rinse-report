export type NZInstitution = {
  name: string;
  codeType: "nz_bank_prefix" | "swift" | null;
  code: string;
  swiftCode?: string; // SWIFT/BIC for display when primary code is nz_bank_prefix
};

// NZ registered banks — SWIFT codes confirmed via SWIFT BIC directory (wise.com)
// NZ bank prefix = first 2 digits of NZ account number (RBNZ scheme)
export const NZ_INSTITUTIONS: NZInstitution[] = [
  // ── Major NZ trading banks ────────────────────────────────────────────────
  { name: "ANZ Bank New Zealand Limited",          codeType: "swift", code: "ANZBNZ22", swiftCode: "ANZBNZ22" },
  { name: "Bank of New Zealand (BNZ)",             codeType: "swift", code: "BKNZNZ22", swiftCode: "BKNZNZ22" },
  { name: "Westpac New Zealand Limited",           codeType: "swift", code: "WPACNZ2W", swiftCode: "WPACNZ2W" },
  { name: "ASB Bank Limited",                      codeType: "swift", code: "ASBBNZ2A", swiftCode: "ASBBNZ2A" },
  { name: "TSB Bank Limited",                      codeType: "swift", code: "TSBANZ22", swiftCode: "TSBANZ22" },
  { name: "Kiwibank Limited",                      codeType: "swift", code: "KIWINZ22", swiftCode: "KIWINZ22" },
  { name: "Heartland Bank Limited",                codeType: "swift", code: "HEATNZ22", swiftCode: "HEATNZ22" },
  { name: "The Co-operative Bank Limited",         codeType: "nz_bank_prefix", code: "07" },
  { name: "SBS Bank (Southland Building Society)", codeType: "swift", code: "SBSYNZ22", swiftCode: "SBSYNZ22" },

  // ── International banks operating in NZ ──────────────────────────────────
  { name: "Rabobank New Zealand Limited",          codeType: "swift", code: "RABONZ22", swiftCode: "RABONZ22" },
  { name: "China Construction Bank (New Zealand) Limited",        codeType: "swift", code: "PCBCNZ22", swiftCode: "PCBCNZ22" },
  { name: "HSBC New Zealand Limited",              codeType: "swift", code: "HKBANZ2A", swiftCode: "HKBANZ2A" },
  { name: "Industrial and Commercial Bank of China (NZ) Limited", codeType: "swift", code: "ICBKNZ2A", swiftCode: "ICBKNZ2A" },
  { name: "Bank of China (New Zealand) Limited",   codeType: "swift", code: "BKCHNZ22", swiftCode: "BKCHNZ22" },
  { name: "Bank of India (New Zealand) Limited",   codeType: "swift", code: "BKIDNZ2A", swiftCode: "BKIDNZ2A" },
  { name: "Bank of Baroda (New Zealand) Limited",  codeType: "swift", code: "BARBNZ2A", swiftCode: "BARBNZ2A" },
  { name: "Citibank N.A. New Zealand Branch",      codeType: "swift", code: "CITINZ2X", swiftCode: "CITINZ2X" },
  { name: "JPMorgan Chase Bank N.A. New Zealand Branch",          codeType: "swift", code: "CHASNZ2X", swiftCode: "CHASNZ2X" },
  { name: "Deutsche Bank AG New Zealand Branch",   codeType: "swift", code: "DEUTNZAA", swiftCode: "DEUTNZAA" },

  // ── Non-bank deposit takers / financial institutions ─────────────────────
  { name: "Emerge Group Limited",                  codeType: null, code: "" },
  { name: "Finance Now Limited",                   codeType: null, code: "" },
  { name: "Latitude Financial Services",           codeType: null, code: "" },
  { name: "Flexi-Finance Limited (Q Card)",        codeType: null, code: "" },
  { name: "Nelson Building Society",               codeType: null, code: "" },
  { name: "Wairarapa Building Society",            codeType: null, code: "" },
  { name: "NZCU Baywide",                          codeType: null, code: "" },
  { name: "NZCU South",                            codeType: null, code: "" },
  { name: "First Credit Union",                    codeType: null, code: "" },
  { name: "Police Credit Union",                   codeType: null, code: "" },
  { name: "NBS Financial Group",                   codeType: null, code: "" },

  // ── Payment services / e-money ────────────────────────────────────────────
  { name: "PayPal New Zealand",                    codeType: null, code: "" },
  { name: "Wise New Zealand",                      codeType: null, code: "" },

  // ── Other / Unknown ───────────────────────────────────────────────────────
  { name: "Other / Unknown",                       codeType: null, code: "" },
];

export const INSTITUTION_NAMES = NZ_INSTITUTIONS.map((i) => i.name);

export function lookupInstitution(name: string): NZInstitution | undefined {
  return NZ_INSTITUTIONS.find((i) => i.name === name);
}
