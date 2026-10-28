export type Answers = Record<string, string | string[]>;

export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "date"
  | "number"
  | "country"
  | "radio"
  | "checkbox-group";

export type FieldOption = {
  value: string;
  label: string;
  description?: string;
  group?: string;
};

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: FieldOption[];
  required?: boolean;
  helper?: string;
  rows?: number;
};

export type Step = {
  id: string;
  title: string;
  subtitle?: string;
  fields: FieldDef[];
  /** Return true to skip this step */
  skipIf?: (answers: Answers, isSAR: boolean) => boolean;
};

const isLCT = (a: Answers) => a.report_type === "LCT";
const isIFT = (a: Answers) => a.report_type === "IFT";
const isSTR = (a: Answers) => a.report_type === "STR" || !a.report_type;
const isSarType = (a: Answers, isSAR: boolean) => isSAR || a.report_type === "SAR";
const isStrOrSar = (a: Answers, isSAR: boolean) => isSarType(a, isSAR) || isSTR(a);
const isPerson = (a: Answers) => a.subject_type === "person";
const isEntity = (a: Answers) => a.subject_type === "entity";
const noTransaction = (a: Answers) => a.has_transaction === "no";

const TRANSMODE_OPTIONS: FieldOption[] = [
  { value: "CA", label: "Cash" },
  { value: "WT", label: "Wire transfer (telegraphic transfer)" },
  { value: "ET", label: "Electronic transfer (internet/online banking)" },
  { value: "CQ", label: "Cheque" },
  { value: "CC", label: "Credit card" },
  { value: "DC", label: "Debit card" },
  { value: "FX", label: "Foreign exchange / currency conversion" },
  { value: "OT", label: "Other" },
];

const ID_TYPE_OPTIONS: FieldOption[] = [
  { value: "P", label: "Passport" },
  { value: "D", label: "Driver's licence" },
  { value: "I", label: "Birth certificate / national ID" },
  { value: "C", label: "Company certificate / incorporation document" },
  { value: "O", label: "Other" },
];

const ENTITY_TYPE_OPTIONS: FieldOption[] = [
  { value: "company", label: "Company / corporation" },
  { value: "trust", label: "Trust" },
  { value: "partnership", label: "Partnership" },
  { value: "sole_trader", label: "Sole trader" },
  { value: "association", label: "Association / incorporated society" },
  { value: "charity", label: "Charitable trust / charity" },
  { value: "government", label: "Government / public body" },
  { value: "other", label: "Other" },
];

import { INDICATOR_OPTIONS as SHARED_INDICATOR_OPTIONS } from "@/lib/indicators";

export const INDICATOR_OPTIONS: FieldOption[] = SHARED_INDICATOR_OPTIONS.map((i) => ({
  value: i.code,
  label: `${i.code} — ${i.label}`,
  group: i.group,
}));

export const STEPS: Step[] = [
  // ── Step 1: Report type (skipped for SAR / activity suspicions) ──
  {
    id: "report_type",
    title: "What type of report is this?",
    subtitle: "Select the report type. Choose SAR if this relates to suspicious behaviour with no specific transaction to report.",
    fields: [
      {
        key: "report_type",
        label: "Report type",
        type: "radio",
        required: true,
        helper:
          "STR (Suspicious Transaction Report) - unusual or suspicious transactions. If you're unsure, STR is most common.",
        options: [
          { value: "STR", label: "STR - Suspicious Transaction Report", description: "Unusual or suspicious transactions" },
          { value: "SAR", label: "SAR - Suspicious Activity Report", description: "Suspicious behaviour or activity with no specific transaction" },
        ],
      },
    ],
    skipIf: (_a, isSAR) => isSAR,
  },

  // ── Step 2: Narrative (all types) ──
  {
    id: "narrative",
    title: "Describe the suspicious activity",
    subtitle: "Provide a clear, factual account of what happened.",
    fields: [
      {
        key: "narrative",
        label: "Narrative",
        type: "textarea",
        rows: 6,
        required: true,
        placeholder:
          "Describe the behaviour chronologically. Start with when you first noticed something unusual and what specifically triggered your concern...",
        helper:
          "Be specific and factual. Include dates, amounts, and the sequence of events. Avoid jargon and write as if the FIU analyst has no prior knowledge of this customer. This narrative goes directly into the filed report.",
      },
    ],
  },

  // ── STR / SAR: Subject ──
  {
    id: "subject_type",
    title: "Who is the subject of this report?",
    subtitle: "Identify whether this suspicion relates to a person or an organisation.",
    fields: [
      {
        key: "subject_type",
        label: "Subject type",
        type: "radio",
        required: true,
        options: [
          { value: "person", label: "A person", description: "An individual (natural person)" },
          { value: "entity", label: "An organisation", description: "A company, trust, partnership, or other legal entity" },
        ],
      },
    ],
    skipIf: (a, _isSAR) => isLCT(a) || isIFT(a),
  },

  // ── STR / SAR: Person - name ──
  {
    id: "person_name",
    title: "Subject's name",
    subtitle: "Enter the subject's legal name as it appears on their identification.",
    fields: [
      {
        key: "first_names",
        label: "First and middle names",
        type: "text",
        required: true,
        placeholder: "e.g. James Robert",
        helper: "Enter all given names. If only one name is known, enter that.",
      },
      {
        key: "last_name",
        label: "Last name / family name",
        type: "text",
        required: true,
        placeholder: "e.g. Chen",
      },
    ],
    skipIf: (a, isSAR) => (!isStrOrSar(a, isSAR)) || isEntity(a),
  },

  // ── STR / SAR: Person - personal details ──
  {
    id: "person_details",
    title: "Subject's personal details",
    subtitle: "Provide what is known - leave blank if not available.",
    fields: [
      {
        key: "date_of_birth",
        label: "Date of birth",
        type: "date",
        helper: "If exact DOB is unknown, leave blank and note what is known in the narrative.",
      },
      {
        key: "nationality",
        label: "Nationality / citizenship",
        type: "text",
        placeholder: "e.g. New Zealand, Chinese",
      },
      {
        key: "occupation",
        label: "Occupation / business activity",
        type: "text",
        placeholder: "e.g. Real estate agent, Student, Director",
        helper: "The subject's stated or known occupation. If unknown, leave blank.",
      },
    ],
    skipIf: (a, isSAR) => (!isStrOrSar(a, isSAR)) || isEntity(a),
  },

  // ── STR / SAR: Person - ID ──
  {
    id: "person_id",
    title: "Subject's identification",
    subtitle: "Enter identification details if known.",
    fields: [
      {
        key: "id_type",
        label: "ID type",
        type: "select",
        options: ID_TYPE_OPTIONS,
        helper: "Select the type of ID you have sighted or that is on record.",
      },
      {
        key: "id_number",
        label: "ID number",
        type: "text",
        placeholder: "e.g. AB123456 (passport), 12345678 (driver licence)",
      },
      {
        key: "id_country",
        label: "Issuing country",
        type: "country",
        helper: "The country that issued the ID document.",
      },
    ],
    skipIf: (a, isSAR) => (!isStrOrSar(a, isSAR)) || isEntity(a),
  },

  // ── STR / SAR: Person - address ──
  {
    id: "person_address",
    title: "Subject's address",
    subtitle: "Enter the subject's known residential or mailing address.",
    fields: [
      {
        key: "address",
        label: "Street address",
        type: "text",
        placeholder: "e.g. 123 Queen Street",
      },
      {
        key: "city",
        label: "City / town",
        type: "text",
        placeholder: "e.g. Auckland",
      },
      {
        key: "country",
        label: "Country",
        type: "country",
      },
    ],
    skipIf: (a, isSAR) => (!isStrOrSar(a, isSAR)) || isEntity(a),
  },

  // ── STR / SAR: Entity - details ──
  {
    id: "entity_details",
    title: "Organisation's details",
    subtitle: "Enter details about the legal entity involved.",
    fields: [
      {
        key: "entity_name",
        label: "Legal name",
        type: "text",
        required: true,
        placeholder: "e.g. Chen Holdings Limited",
        helper: "Enter the full registered legal name of the entity.",
      },
      {
        key: "entity_type",
        label: "Entity type",
        type: "select",
        options: ENTITY_TYPE_OPTIONS,
      },
      {
        key: "registration_number",
        label: "Registration / incorporation number",
        type: "text",
        placeholder: "e.g. 1234567 (NZBN or company number)",
      },
    ],
    skipIf: (a, isSAR) => (!isStrOrSar(a, isSAR)) || isPerson(a),
  },

  // ── STR / SAR: Entity - address ──
  {
    id: "entity_address",
    title: "Organisation's registered address",
    subtitle: "Enter the entity's registered office or principal place of business.",
    fields: [
      {
        key: "entity_address",
        label: "Street address",
        type: "text",
        placeholder: "e.g. Level 4, 55 Shortland Street",
      },
      {
        key: "entity_city",
        label: "City / town",
        type: "text",
        placeholder: "e.g. Auckland",
      },
      {
        key: "entity_country",
        label: "Jurisdiction of incorporation",
        type: "country",
        helper: "The country where this entity was incorporated or registered.",
      },
    ],
    skipIf: (a, isSAR) => (!isStrOrSar(a, isSAR)) || isPerson(a),
  },

  // ── STR / SAR: Customer relationship ──
  {
    id: "customer_rel",
    title: "Is the subject your organisation's customer?",
    subtitle: "This affects how the FIU categorises the relationship.",
    fields: [
      {
        key: "is_customer",
        label: "Customer relationship",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes - this is our customer", description: "The subject has an existing relationship with your organisation" },
          { value: "no", label: "No - this is an external party", description: "The subject has no direct relationship with your organisation" },
        ],
        helper:
          "If the subject is your customer, you will be expected to have CDD records. If external, note what information you have about them.",
      },
    ],
    skipIf: (a, _isSAR) => isLCT(a) || isIFT(a),
  },

  // ── STR: Was there a transaction? ──
  {
    id: "has_transaction",
    title: "Was there a specific transaction?",
    subtitle: "Some STRs relate to transactions, others to patterns of activity.",
    fields: [
      {
        key: "has_transaction",
        label: "Transaction involved",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes - there is a specific transaction to report" },
          { value: "no", label: "No - this relates to a pattern of activity without a specific transaction" },
        ],
        helper:
          "If yes, you will be asked for the transaction details. If no, the narrative you provided captures the activity.",
      },
    ],
    skipIf: (a, isSAR) => isSarType(a, isSAR) || isLCT(a) || isIFT(a),
  },

  // ── STR: Transaction basics ──
  {
    id: "transaction_basics",
    title: "Transaction details",
    subtitle: "Enter the key details of the suspicious transaction.",
    fields: [
      {
        key: "transaction_date",
        label: "Transaction date",
        type: "date",
        required: true,
        helper: "The date the transaction was executed or attempted.",
      },
      {
        key: "transaction_amount",
        label: "Amount",
        type: "number",
        required: true,
        placeholder: "e.g. 45000",
        helper: "Enter the amount in the local currency. For foreign currency transactions, also enter the foreign amount below.",
      },
      {
        key: "transaction_currency",
        label: "Currency",
        type: "select",
        required: true,
        options: [
          { value: "NZD", label: "NZD - New Zealand Dollar" },
          { value: "AUD", label: "AUD - Australian Dollar" },
          { value: "USD", label: "USD - US Dollar" },
          { value: "GBP", label: "GBP - British Pound" },
          { value: "EUR", label: "EUR - Euro" },
          { value: "CNY", label: "CNY - Chinese Yuan (Renminbi)" },
          { value: "JPY", label: "JPY - Japanese Yen" },
          { value: "SGD", label: "SGD - Singapore Dollar" },
          { value: "HKD", label: "HKD - Hong Kong Dollar" },
          { value: "INR", label: "INR - Indian Rupee" },
          { value: "OTHER", label: "Other" },
        ],
      },
    ],
    skipIf: (a, isSAR) => isSarType(a, isSAR) || isLCT(a) || isIFT(a) || noTransaction(a),
  },

  // ── STR: Transaction mode + accounts ──
  {
    id: "transaction_mode",
    title: "How was the transaction conducted?",
    subtitle: "Select the transaction method and any relevant account details.",
    fields: [
      {
        key: "transmode_code",
        label: "Transaction method",
        type: "select",
        required: true,
        options: TRANSMODE_OPTIONS,
        helper: "Select the primary method used to conduct the transaction.",
      },
      {
        key: "originating_account",
        label: "Originating account",
        type: "text",
        placeholder: "e.g. 02-1234-5678901-00 (BNZ)",
        helper: "Account number or reference for where funds originated. Include the bank name if known.",
      },
      {
        key: "beneficiary_account",
        label: "Destination / beneficiary account",
        type: "text",
        placeholder: "e.g. 06-0890-9876543-00 (ASB)",
        helper: "Account number or reference for where funds were sent.",
      },
    ],
    skipIf: (a, isSAR) => isSarType(a, isSAR) || isLCT(a) || isIFT(a) || noTransaction(a),
  },

  // ── STR: Transaction narrative ──
  {
    id: "transaction_narr",
    title: "Describe the transaction",
    subtitle: "Provide a short description of what made this specific transaction suspicious.",
    fields: [
      {
        key: "transaction_description",
        label: "Transaction description",
        type: "textarea",
        rows: 4,
        required: true,
        placeholder:
          "e.g. Customer deposited NZD 45,000 cash in three separate visits over two days, each just under NZD 15,000...",
        helper:
          "Focus on the specific transaction - what happened, when, and why it stood out. Cross-reference with the overall narrative if needed.",
      },
    ],
    skipIf: (a, isSAR) => isSarType(a, isSAR) || isLCT(a) || isIFT(a) || noTransaction(a),
  },

  // ── LCT: Cash details ──
  {
    id: "lct_cash",
    title: "Cash transaction details",
    subtitle: "Enter the details of the large cash transaction.",
    fields: [
      {
        key: "lct_amount",
        label: "Cash amount",
        type: "number",
        required: true,
        placeholder: "e.g. 15000",
        helper: "Enter the full NZD amount of the cash transaction. LCT threshold is NZD 10,000.",
      },
      {
        key: "lct_currency",
        label: "Currency",
        type: "select",
        required: true,
        options: [
          { value: "NZD", label: "NZD - New Zealand Dollar" },
          { value: "AUD", label: "AUD - Australian Dollar" },
          { value: "USD", label: "USD - US Dollar" },
          { value: "EUR", label: "EUR - Euro" },
          { value: "GBP", label: "GBP - British Pound" },
          { value: "CNY", label: "CNY - Chinese Yuan" },
          { value: "OTHER", label: "Other" },
        ],
      },
      {
        key: "lct_direction",
        label: "Transaction direction",
        type: "radio",
        required: true,
        options: [
          { value: "deposit", label: "Cash deposit - customer brought cash in" },
          { value: "withdrawal", label: "Cash withdrawal - customer took cash out" },
          { value: "exchange", label: "Currency exchange - cash exchanged for another currency" },
        ],
      },
      {
        key: "lct_date",
        label: "Transaction date",
        type: "date",
        required: true,
      },
    ],
    skipIf: (a, _isSAR) => !isLCT(a),
  },

  // ── LCT: Customer type ──
  {
    id: "lct_subject_type",
    title: "Who conducted the cash transaction?",
    subtitle: "Identify whether the cash customer is a person or an organisation.",
    fields: [
      {
        key: "subject_type",
        label: "Customer type",
        type: "radio",
        required: true,
        options: [
          { value: "person", label: "A person", description: "An individual" },
          { value: "entity", label: "An organisation", description: "A company, trust, or other entity" },
        ],
      },
    ],
    skipIf: (a, _isSAR) => !isLCT(a),
  },

  // ── LCT: Customer - person ──
  {
    id: "lct_person",
    title: "Customer details",
    subtitle: "Enter details about the person who conducted the cash transaction.",
    fields: [
      {
        key: "first_names",
        label: "First and middle names",
        type: "text",
        required: true,
        placeholder: "e.g. James Robert",
      },
      {
        key: "last_name",
        label: "Last name",
        type: "text",
        required: true,
        placeholder: "e.g. Chen",
      },
      {
        key: "date_of_birth",
        label: "Date of birth",
        type: "date",
      },
      {
        key: "nationality",
        label: "Nationality",
        type: "text",
        placeholder: "e.g. New Zealand",
      },
    ],
    skipIf: (a, _isSAR) => !isLCT(a) || isEntity(a),
  },

  // ── LCT: Customer - entity ──
  {
    id: "lct_entity",
    title: "Organisation details",
    subtitle: "Enter details about the organisation that conducted the cash transaction.",
    fields: [
      {
        key: "entity_name",
        label: "Legal name",
        type: "text",
        required: true,
        placeholder: "e.g. Pacific Trading Limited",
      },
      {
        key: "registration_number",
        label: "Registration number",
        type: "text",
        placeholder: "e.g. company number or NZBN",
      },
      {
        key: "entity_country",
        label: "Jurisdiction of incorporation",
        type: "country",
      },
    ],
    skipIf: (a, _isSAR) => !isLCT(a) || isPerson(a),
  },

  // ── LCT: Account details ──
  {
    id: "lct_account",
    title: "Account details",
    subtitle: "Enter the account involved in the cash transaction.",
    fields: [
      {
        key: "account_number",
        label: "Account number",
        type: "text",
        placeholder: "e.g. 02-1234-5678901-00",
        helper: "The account into which cash was deposited or from which it was withdrawn.",
      },
      {
        key: "account_institution",
        label: "Institution",
        type: "text",
        placeholder: "e.g. BNZ, ANZ, Westpac",
      },
    ],
    skipIf: (a, _isSAR) => !isLCT(a),
  },

  // ── LCT: Conductor ──
  {
    id: "lct_conductor",
    title: "Who physically conducted the transaction?",
    subtitle: "If different from the account holder or customer, identify the conductor.",
    fields: [
      {
        key: "conductor_different",
        label: "Was the conductor different from the customer?",
        type: "radio",
        required: true,
        options: [
          { value: "no", label: "No - same person conducted and is the customer" },
          { value: "yes", label: "Yes - a different person physically conducted the transaction" },
        ],
        helper:
          "The conductor is the person who physically performed the transaction - for example, the person at the teller counter - if different from the account holder.",
      },
      {
        key: "conductor_name",
        label: "Conductor's full name",
        type: "text",
        placeholder: "e.g. Mary Chen",
      },
      {
        key: "conductor_id_type",
        label: "Conductor's ID type",
        type: "select",
        options: ID_TYPE_OPTIONS,
      },
      {
        key: "conductor_id_number",
        label: "Conductor's ID number",
        type: "text",
        placeholder: "e.g. LF123456",
      },
    ],
    skipIf: (a, _isSAR) => !isLCT(a),
  },

  // ── IFT: Transfer details ──
  {
    id: "ift_transfer",
    title: "International transfer details",
    subtitle: "Enter the amounts and currencies involved in the transfer.",
    fields: [
      {
        key: "ift_date",
        label: "Transfer date",
        type: "date",
        required: true,
      },
      {
        key: "ift_amount_local",
        label: "Amount in local currency (NZD)",
        type: "number",
        required: true,
        placeholder: "e.g. 50000",
      },
      {
        key: "ift_currency_foreign",
        label: "Foreign currency (if applicable)",
        type: "select",
        options: [
          { value: "USD", label: "USD - US Dollar" },
          { value: "AUD", label: "AUD - Australian Dollar" },
          { value: "GBP", label: "GBP - British Pound" },
          { value: "EUR", label: "EUR - Euro" },
          { value: "CNY", label: "CNY - Chinese Yuan" },
          { value: "JPY", label: "JPY - Japanese Yen" },
          { value: "SGD", label: "SGD - Singapore Dollar" },
          { value: "HKD", label: "HKD - Hong Kong Dollar" },
          { value: "INR", label: "INR - Indian Rupee" },
          { value: "OTHER", label: "Other" },
        ],
        helper: "Leave blank if the transfer was in NZD only.",
      },
      {
        key: "ift_amount_foreign",
        label: "Amount in foreign currency",
        type: "number",
        placeholder: "e.g. 30000",
      },
    ],
    skipIf: (a, _isSAR) => !isIFT(a),
  },

  // ── IFT: Direction ──
  {
    id: "ift_direction",
    title: "Direction of transfer",
    subtitle: "Was the funds transfer coming into New Zealand or going out?",
    fields: [
      {
        key: "ift_direction",
        label: "Transfer direction",
        type: "radio",
        required: true,
        options: [
          { value: "outbound", label: "Outbound - funds sent from NZ to overseas" },
          { value: "inbound", label: "Inbound - funds received from overseas into NZ" },
        ],
      },
    ],
    skipIf: (a, _isSAR) => !isIFT(a),
  },

  // ── IFT: Sender ──
  {
    id: "ift_sender",
    title: "Sending party details",
    subtitle: "Who sent the funds?",
    fields: [
      {
        key: "sender_name",
        label: "Sender's name or organisation",
        type: "text",
        required: true,
        placeholder: "e.g. James Chen or Pacific Trading Ltd",
      },
      {
        key: "sender_country",
        label: "Sender's country",
        type: "country",
        required: true,
      },
      {
        key: "sender_account",
        label: "Sender's account number / IBAN",
        type: "text",
        placeholder: "e.g. IBAN or account reference",
      },
      {
        key: "sender_institution",
        label: "Sender's bank / institution",
        type: "text",
        placeholder: "e.g. Bank of China (Guangzhou)",
      },
    ],
    skipIf: (a, _isSAR) => !isIFT(a),
  },

  // ── IFT: Receiver ──
  {
    id: "ift_receiver",
    title: "Receiving party details",
    subtitle: "Who received the funds?",
    fields: [
      {
        key: "receiver_name",
        label: "Receiver's name or organisation",
        type: "text",
        required: true,
        placeholder: "e.g. Mary Smith or Oceanic Holdings Ltd",
      },
      {
        key: "receiver_country",
        label: "Receiver's country",
        type: "country",
        required: true,
      },
      {
        key: "receiver_account",
        label: "Receiver's account number",
        type: "text",
        placeholder: "e.g. 02-1234-5678901-00 or IBAN",
      },
      {
        key: "receiver_institution",
        label: "Receiver's bank / institution",
        type: "text",
        placeholder: "e.g. ANZ New Zealand",
      },
    ],
    skipIf: (a, _isSAR) => !isIFT(a),
  },

  // ── IFT: Intermediary ──
  {
    id: "ift_intermediary",
    title: "Intermediary institution",
    subtitle: "Was there an intermediary bank or institution involved?",
    fields: [
      {
        key: "has_intermediary",
        label: "Intermediary involved?",
        type: "radio",
        required: true,
        options: [
          { value: "no", label: "No - direct transfer between sender and receiver" },
          { value: "yes", label: "Yes - an intermediary institution was involved" },
        ],
        helper: "An intermediary is a bank or institution that facilitated the transfer between the sending and receiving banks.",
      },
      {
        key: "intermediary_name",
        label: "Intermediary institution name",
        type: "text",
        placeholder: "e.g. Citibank N.A. (New York)",
      },
      {
        key: "intermediary_country",
        label: "Intermediary country",
        type: "country",
      },
    ],
    skipIf: (a, _isSAR) => !isIFT(a),
  },

  // ── Action taken (all types) ──
  {
    id: "action_taken",
    title: "Action taken",
    subtitle: "What action did your organisation take in response to this suspicion?",
    fields: [
      {
        key: "action_taken",
        label: "Action taken",
        type: "textarea",
        rows: 4,
        placeholder:
          "e.g. Transaction was delayed pending further review. Customer was asked to provide source of funds documentation. Account was placed under enhanced monitoring...",
        helper:
          "Describe any steps your organisation has taken: freezing accounts, requesting information from the customer, enhanced monitoring, or declining to proceed with a transaction. Leave blank if no action was taken.",
      },
    ],
  },
];
