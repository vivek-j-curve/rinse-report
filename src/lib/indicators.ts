export type IndicatorOption = { code: string; label: string; group: string };

export const INDICATOR_OPTIONS: IndicatorOption[] = [
  // Behaviour
  { code: "BH1", label: "Exhibits a lack of concern about fees/costs and/or seeks to conduct a transaction urgently", group: "Behaviour" },
  { code: "BH2", label: "Makes statements regarding illegal activities", group: "Behaviour" },
  { code: "BH3", label: "Nervous/erratic/defensive behaviour and/or avoids contact", group: "Behaviour" },
  { code: "BH4", label: "Questions processes and thresholds and/or indicates a desire to avoid reporting", group: "Behaviour" },
  { code: "BH5", label: "Unwilling or unable to provide information regarding the activity/transaction", group: "Behaviour" },
  // Cash Transactions
  { code: "Cash1", label: "Multiple or large cash deposits", group: "Cash Transactions" },
  { code: "Cash2", label: "Presents cash packed, transported, or wrapped in an uncommon way, or where total sum is unknown", group: "Cash Transactions" },
  { code: "Cash4", label: "Presents cash that smells musty, or like known drugs or chemicals", group: "Cash Transactions" },
  { code: "Cash5", label: "Exchanging smaller bills for larger denominations (refining)", group: "Cash Transactions" },
  { code: "Cash6", label: "Multiple or large cash withdrawals", group: "Cash Transactions" },
  // CDD
  { code: "CDD1", label: "Identity/information cannot be verified or refuses/avoids providing identification, or halts transaction when identification is requested", group: "Customer Due Diligence" },
  { code: "CDD2", label: "Provides only a PO box and/or virtual office address", group: "Customer Due Diligence" },
  { code: "CDD3", label: "Provides inconsistent, conflicting, false, vague, or misleading information", group: "Customer Due Diligence" },
  // Unusual Transactions
  { code: "UNT1", label: "Transaction to/from shell companies or suspected shell companies", group: "Unusual Transactions" },
  { code: "UNT5", label: "Multiple deposits to account without further movement", group: "Unusual Transactions" },
  { code: "UNT6", label: "Needlessly complex or appears to be an attempt to hide source of funds", group: "Unusual Transactions" },
  { code: "UNT7", label: "Structuring or smurfing", group: "Unusual Transactions" },
  // Serious Crime
  { code: "CEM", label: "Transactions or activity indicate involvement with child exploitation material (domestic or international)", group: "Serious Crime" },
  { code: "CHT", label: "Transactions or activity indicate human trafficking, slave trading, or labour exploitation", group: "Serious Crime" },
  { code: "CS1", label: "Relates to phone/email/mail/online scams (romance, lottery, charity). Involves a victim or offender", group: "Serious Crime" },
  { code: "CT", label: "Tax evasion", group: "Serious Crime" },
  // Criminal Links
  { code: "CG1", label: "Gang affiliated clothing and/or known to be affiliated with gang or organised crime groups", group: "Criminal Links" },
  { code: "CG2", label: "Transactions from/to known criminals or gang members", group: "Criminal Links" },
  { code: "CL1", label: "Corruption - entity/individual connected to government, civil, charitable, or reporting entity", group: "Criminal Links" },
  { code: "CL2", label: "Payments to/from person(s)/entity(ies) of concern identified via open source", group: "Criminal Links" },
  // Terrorism & Sanctions
  { code: "CFT", label: "Transactions (from/to) may be linked to terrorist activities/groups", group: "Terrorism & Sanctions" },
  { code: "TList", label: "Is listed on a known/designated terrorist list", group: "Terrorism & Sanctions" },
  { code: "SANC", label: "Involves individual(s) or entity(ies) identified on sanctions lists", group: "Terrorism & Sanctions" },
  // High-Risk Jurisdictions
  { code: "HRJ1", label: "Is believed to have travelled to high risk or sanctioned jurisdiction(s)", group: "High-Risk Jurisdictions" },
  { code: "HRJ2", label: "Transaction/activity involves high risk or sanctioned jurisdiction(s)", group: "High-Risk Jurisdictions" },
  // Third Party
  { code: "THP1", label: "Acts on behalf of and/or is accompanied/influenced by another party", group: "Third Party" },
  { code: "THP2", label: "Inward/outward payment from/to unrelated party linked to multiple suspicious, non-familial third parties", group: "Third Party" },
  // Goods & Assets
  { code: "G2", label: "Purchase of travel/stored value cards in NZ with use offshore - not by purchaser", group: "Goods & Assets" },
  { code: "G3", label: "Purchase of high value assets", group: "Goods & Assets" },
  { code: "G4", label: "Trade-based money laundering", group: "Goods & Assets" },
  { code: "G5", label: "Buying and selling shares/bonds/funds etc. within short timeframes", group: "Goods & Assets" },
  { code: "G6", label: "Online/in-person purchase of goods or services that are illegal or used for illegal purposes in NZ", group: "Goods & Assets" },
  // Use of Services / Methods
  { code: "USE1", label: "Application-based payment methods or Virtual Asset Providers / Cryptocurrency", group: "Use of Services / Methods" },
  { code: "USE2", label: "Casino or gambling platform/entity", group: "Use of Services / Methods" },
  { code: "USE3", label: "Professional services (e.g. lawyers, real estate agents, Trust and Company Service Providers)", group: "Use of Services / Methods" },
  // Regulatory / Intelligence
  { code: "Alerts", label: "FIU/Police alerts or requests for information and intel related to goAML disseminations", group: "Regulatory / Intelligence" },
  { code: "BCR1", label: "Border cash report - declared cash", group: "Regulatory / Intelligence" },
  { code: "BCR2", label: "Border cash report - undeclared cash", group: "Regulatory / Intelligence" },
  { code: "DIA", label: "Department of Internal Affairs (DIA) — sole AML/CFT supervisor from 1 July 2026", group: "Regulatory / Intelligence" },
];

export type IndicatorGroup = {
  title: string;
  description: string;
  indicators: { code: string; label: string }[];
};

export const INDICATOR_GROUPS: IndicatorGroup[] = [
  { title: "Behaviour", description: "Customer behaviour patterns", indicators: INDICATOR_OPTIONS.filter((i) => i.group === "Behaviour") },
  { title: "Cash Transactions", description: "Cash-related indicators", indicators: INDICATOR_OPTIONS.filter((i) => i.group === "Cash Transactions") },
  { title: "Customer Due Diligence", description: "Identity and verification concerns", indicators: INDICATOR_OPTIONS.filter((i) => i.group === "Customer Due Diligence") },
  { title: "Unusual Transactions", description: "Structuring and unusual transaction patterns", indicators: INDICATOR_OPTIONS.filter((i) => i.group === "Unusual Transactions") },
  { title: "Serious Crime", description: "Indicators of specific serious crimes", indicators: INDICATOR_OPTIONS.filter((i) => i.group === "Serious Crime") },
  { title: "Criminal Links", description: "Links to known criminals or organised crime", indicators: INDICATOR_OPTIONS.filter((i) => i.group === "Criminal Links") },
  { title: "Terrorism & Sanctions", description: "Terrorism financing and sanctions list matches", indicators: INDICATOR_OPTIONS.filter((i) => i.group === "Terrorism & Sanctions") },
  { title: "High-Risk Jurisdictions", description: "Links to sanctioned or high-risk countries", indicators: INDICATOR_OPTIONS.filter((i) => i.group === "High-Risk Jurisdictions") },
  { title: "Third Party", description: "Third-party involvement indicators", indicators: INDICATOR_OPTIONS.filter((i) => i.group === "Third Party") },
  { title: "Goods & Assets", description: "Purchase of goods, assets, or trade-based laundering", indicators: INDICATOR_OPTIONS.filter((i) => i.group === "Goods & Assets") },
  { title: "Use of Services / Methods", description: "Use of specific services or payment methods", indicators: INDICATOR_OPTIONS.filter((i) => i.group === "Use of Services / Methods") },
  { title: "Regulatory / Intelligence", description: "FIU/Police alerts, border cash reports, and regulator referrals", indicators: INDICATOR_OPTIONS.filter((i) => i.group === "Regulatory / Intelligence") },
];

export const SECTOR_SUPERVISOR_CODES = new Set(["DIA"]);
