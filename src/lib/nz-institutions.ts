export type NZInstitution = {
  name: string;
  codeType: "nz_bank_prefix" | "swift" | null;
  code: string;
};

// NZ registered banks — prefix codes from RBNZ bank account number scheme (first 2 digits)
// SWIFT codes from published BIC directories
export const NZ_INSTITUTIONS: NZInstitution[] = [
  // ── Major NZ trading banks (NZ bank prefix) ──────────────────────────────
  { name: "ANZ Bank New Zealand Limited",          codeType: "nz_bank_prefix", code: "01" },
  { name: "Bank of New Zealand (BNZ)",             codeType: "nz_bank_prefix", code: "02" },
  { name: "Westpac New Zealand Limited",           codeType: "nz_bank_prefix", code: "03" },
  { name: "ASB Bank Limited",                      codeType: "nz_bank_prefix", code: "12" },
  { name: "TSB Bank Limited",                      codeType: "nz_bank_prefix", code: "15" },
  { name: "Kiwibank Limited",                      codeType: "nz_bank_prefix", code: "38" },
  { name: "Heartland Bank Limited",                codeType: "nz_bank_prefix", code: "31" },
  { name: "The Co-operative Bank Limited",         codeType: "nz_bank_prefix", code: "07" },
  { name: "SBS Bank (Southland Building Society)", codeType: "nz_bank_prefix", code: "03" },

  // ── International banks operating in NZ (SWIFT) ──────────────────────────
  { name: "HSBC New Zealand Limited",              codeType: "swift", code: "HKBANZ2A" },
  { name: "Rabobank New Zealand Limited",          codeType: "swift", code: "RABONZ22" },
  { name: "Bank of China (New Zealand) Limited",   codeType: "swift", code: "BKCHCNBJ" },
  { name: "Industrial and Commercial Bank of China (NZ) Limited", codeType: "swift", code: "ICBKNZ2A" },
  { name: "China Construction Bank (New Zealand) Limited",        codeType: "swift", code: "PCBCCNBJ" },
  { name: "Citibank N.A. New Zealand Branch",      codeType: "swift", code: "CITINZ2X" },
  { name: "JPMorgan Chase Bank N.A. New Zealand Branch",          codeType: "swift", code: "CHASUS33" },

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
