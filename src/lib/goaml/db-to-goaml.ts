import { COUNTRY_NAME_TO_CODE } from "@/lib/country-codes";
import type {
  GoAMLReport,
  GoAMLTransaction,
  GoAMLTransactionSide,
  GoAMLPerson,
  GoAMLEntity,
  GoAMLAccount,
  GoAMLPhone,
  GoAMLAddress,
  GoAMLPersonIdentification,
  GoAMLActivity,
} from "./types";

interface DbReport {
  entity_reference: string;
  report_code: string;
  report_type: string;
  submission_code: string;
  fiu_ref_number?: string;
}

interface DbReportingEntity {
  rentity_id: string;
  rentity_branch: string | null;
  local_currency: string;
  compliance_officer_name: string;
  compliance_officer_email: string | null;
}

interface DbTransaction {
  transaction_number: string;
  transaction_location: string;
  transaction_description: string | null;
  date_transaction: string;
  transmode_code: string;
  transmode_comment: string | null;
  amount_local: number;
  amount_foreign: number | null;
  currency_code_local: string;
  currency_code_foreign: string | null;
  late_deposit: boolean;
  comments: string | null;
  goods_description: string | null;
}

interface DbPerson {
  first_name: string;
  last_name: string;
  middle_name: string | null;
  title: string | null;
  gender: string | null;
  birthdate: string | null;
  birth_place: string | null;
  mothers_name: string | null;
  nationality: string | null;
  residence: string | null;
  occupation: string | null;
  source_of_wealth: string | null;
  comments: string | null;
  is_my_client: boolean;
  role: string;
}

interface DbEntity {
  name: string;
  commercial_name: string | null;
  incorporation_legal_form: string | null;
  incorporation_number: string | null;
  business_type: string | null;
  incorporation_country: string | null;
  incorporation_date: string | null;
  comments: string | null;
  is_my_client: boolean;
  role: string;
}

interface DbAccount {
  institution_name: string;
  institution_code: string | null;
  institution_code_type: string | null;
  branch: string | null;
  account_number: string;
  currency_code: string | null;
  account_type: string | null;
  balance: number | null;
  balance_date: string | null;
  status: string | null;
  opened_date: string | null;
  closed_date: string | null;
  comments: string | null;
  is_my_client: boolean;
}

interface DbAddress {
  address_type: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  country_code: string | null;
  comments: string | null;
}

interface DbPhone {
  phone_type: string | null;
  country_prefix: string | null;
  number: string;
  extension: string | null;
  comments: string | null;
}

interface DbIdentification {
  type: string;
  number: string;
  issue_date: string | null;
  expiry_date: string | null;
  issued_by: string | null;
  issue_country: string | null;
  comments: string | null;
}

interface DbTransactionParty {
  direction: "from" | "to";
  party_type: "person" | "entity" | "account";
  person: (DbPerson & { addresses: DbAddress[]; phones: DbPhone[]; identifications: DbIdentification[] }) | null;
  entity: (DbEntity & { addresses: DbAddress[]; phones: DbPhone[] }) | null;
  account: (DbAccount & { person: DbPerson | null; entity: DbEntity | null }) | null;
}

interface DbIndicator {
  indicator_code: string;
}

interface DbCase {
  title: string;
}

export interface ReportData {
  report: DbReport;
  reporting_entity: DbReportingEntity;
  case_record: DbCase;
  transactions: (DbTransaction & { parties: DbTransactionParty[] })[];
  persons: (DbPerson & { addresses: DbAddress[]; phones: DbPhone[]; identifications: DbIdentification[] })[];
  entities: (DbEntity & { addresses: DbAddress[]; phones: DbPhone[] })[];
  accounts: (DbAccount & { person: DbPerson | null; entity: DbEntity | null })[];
  indicators: DbIndicator[];
  reason?: string;
}

// Normalize a stored country value to ISO 3166-1 alpha-2 code.
// Handles both already-correct codes ("NZ") and legacy full names ("New Zealand").
function toCountryCode(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value.length === 2) return value.toUpperCase();
  return COUNTRY_NAME_TO_CODE[value] ?? value;
}

// XSD sql_date is xs:dateTime — must be "YYYY-MM-DDTHH:MM:SS", not just "YYYY-MM-DD".
function toDateTime(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value.includes("T")) return value; // already has time component
  return `${value}T00:00:00`;
}

// The FIU issues rentity_ids like "NZ-LAW-00142". XSD requires xs:int, so extract trailing digits.
function parseRentityId(id: string): number {
  const match = id.match(/(\d+)$/);
  if (match) return parseInt(match[1], 10);
  const direct = parseInt(id, 10);
  return isNaN(direct) ? 0 : direct;
}

const LEGAL_FORM_MAP: Record<string, string> = {
  limited: "G",       // Limited
  partnership: "M",   // Partnership
  sole_trader: "S",   // Sole Proprietorship
  trust: "T",         // Trust
  other: "L",         // Other
};

// communication_type enum (XSD): A=FAX, B=Landline, C=Mobile, D=Other
const PHONE_COMM_TYPE_MAP: Record<string, string> = {
  mobile: "C",
  landline: "B",
  fax: "A",
};

// contact_type enum (XSD): I=Home, C=Business, O=Registered, J=Mailing, S=Work, L=Other
const ADDRESS_TYPE_MAP: Record<string, string> = {
  residential: "I",  // Home address
  business: "C",     // Business address
  registered: "O",   // Registered
  mailing: "J",      // Mailing address
};

// tph_contact_type for phone numbers - what location context the number belongs to
const PHONE_CONTACT_TYPE_MAP: Record<string, string> = {
  mobile: "I",    // Home address (personal)
  landline: "S",  // Work
  fax: "C",       // Business address
};

const ID_TYPE_MAP: Record<string, string> = {
  drivers_licence: "A",   // Driver's licence
  passport: "F",          // Passport
  national_id: "C",       // Identification card
  birth_certificate: "1", // Birth certificate
  other: "E",             // Other
};

// account_status_type enum (XSD): A=Active, B=Closed by customer, C=Closed by RE, D=Closed due to inactivity, E=Inactive, F=New, G=No account
const ACCOUNT_STATUS_MAP: Record<string, string> = {
  active: "A",
  closed: "C",   // Closed by reporting entity
  dormant: "E",  // Inactive (no transactions within 1 year)
  frozen: "-",   // No exact XSD equivalent - use unknown
};

export function mapReportDataToGoAML(data: ReportData): GoAMLReport {
  const { report, reporting_entity, transactions, indicators } = data;

  const reportDate = new Date().toISOString().replace(/\.\d{3}Z$/, "");

  const goamlReport: GoAMLReport = {
    rentity_id: parseRentityId(reporting_entity.rentity_id),
    rentity_branch: reporting_entity.rentity_branch ?? undefined,
    submission_code: (report.submission_code as "E" | "M") || "E",
    report_code: report.report_code as GoAMLReport["report_code"],
    entity_reference: report.entity_reference,
    fiu_ref_number: report.fiu_ref_number || undefined,
    report_date: reportDate,
    currency_code_local: reporting_entity.local_currency,
    reporting_person: {
      first_name: reporting_entity.compliance_officer_name.split(" ")[0] || "",
      last_name:
        reporting_entity.compliance_officer_name.split(" ").slice(1).join(" ") ||
        reporting_entity.compliance_officer_name,
    },
    reason: data.reason,
    transactions: [],
    report_indicators: indicators.map((i) => i.indicator_code),
  };

  const hasTransactions = report.report_type === "STR" || report.report_type === "LCT" || report.report_type === "IFT";

  if (hasTransactions && transactions.length > 0) {
    goamlReport.transactions = transactions.map((tx) =>
      mapTransaction(tx, reporting_entity.local_currency)
    );
  }

  if (
    (report.report_type === "SAR" || !hasTransactions || transactions.length === 0) &&
    (data.persons.length > 0 || data.entities.length > 0)
  ) {
    goamlReport.activity = mapActivity(data);
  }

  return goamlReport;
}

function mapTransaction(
  tx: DbTransaction & { parties: DbTransactionParty[] },
  localCurrency: string
): GoAMLTransaction {
  const goamlTx: GoAMLTransaction = {
    transactionnumber: tx.transaction_number,
    transaction_location: tx.transaction_location,
    transaction_description: tx.transaction_description ?? undefined,
    date_transaction: toDateTime(tx.date_transaction) ?? tx.date_transaction,
    transmode_code: tx.transmode_code,
    transmode_comment: tx.transmode_comment ?? undefined,
    amount_local: tx.amount_local,
    late_deposit: tx.late_deposit || undefined,
    comments: tx.comments ?? undefined,
  };

  const fromParties = tx.parties.filter((p) => p.direction === "from");
  const toParties = tx.parties.filter((p) => p.direction === "to");

  if (fromParties.length > 0) {
    const fromParty = fromParties[0];
    const side = mapTransactionParty(fromParty, tx, localCurrency);
    if (side) {
      if (side.is_my_client) {
        goamlTx.t_from_my_client = side;
      } else {
        goamlTx.t_from = side;
      }
    }
  }

  if (toParties.length > 0) {
    const toParty = toParties[0];
    const side = mapTransactionParty(toParty, tx, localCurrency);
    if (side) {
      if (side.is_my_client) {
        goamlTx.t_to_my_client = side;
      } else {
        goamlTx.t_to = side;
      }
    }
  }

  return goamlTx;
}

function mapTransactionParty(
  party: DbTransactionParty,
  tx: DbTransaction,
  localCurrency: string
): GoAMLTransactionSide | null {
  const side: GoAMLTransactionSide = {
    is_my_client: false,
    from_country: party.direction === "from" ? "NZ" : undefined,
    to_country: party.direction === "to" ? "NZ" : undefined,
  };

  if (tx.currency_code_foreign && tx.amount_foreign) {
    side.foreign_currency = {
      foreign_currency_code: tx.currency_code_foreign,
      foreign_amount: tx.amount_foreign,
    };
  }

  if (party.party_type === "account" && party.account) {
    side.account = mapAccount(party.account);
    side.is_my_client = party.account.is_my_client;
  } else if (party.party_type === "person" && party.person) {
    side.person = mapPerson(party.person);
    side.is_my_client = party.person.is_my_client;
  } else if (party.party_type === "entity" && party.entity) {
    side.entity = mapEntity(party.entity);
    side.is_my_client = party.entity.is_my_client;
  } else {
    return null;
  }

  return side;
}

function mapPerson(
  person: DbPerson & {
    addresses: DbAddress[];
    phones: DbPhone[];
    identifications: DbIdentification[];
  }
): GoAMLPerson {
  return {
    gender: person.gender ?? undefined,
    title: person.title ?? undefined,
    first_name: person.first_name,
    middle_name: person.middle_name ?? undefined,
    last_name: person.last_name,
    birthdate: toDateTime(person.birthdate),
    birth_place: person.birth_place ?? undefined,
    mothers_name: person.mothers_name ?? undefined,
    nationality1: toCountryCode(person.nationality),
    residence: toCountryCode(person.residence),
    occupation: person.occupation ?? undefined,
    source_of_wealth: person.source_of_wealth ?? undefined,
    comments: person.comments ?? undefined,
    is_my_client: person.is_my_client,
    phones: person.phones.map(mapPhone),
    addresses: person.addresses.map(mapAddress),
    identifications: person.identifications.map(mapIdentification),
  };
}

function mapEntity(
  entity: DbEntity & { addresses: DbAddress[]; phones: DbPhone[] }
): GoAMLEntity {
  return {
    name: entity.name,
    commercial_name: entity.commercial_name ?? undefined,
    incorporation_legal_form: entity.incorporation_legal_form
      ? LEGAL_FORM_MAP[entity.incorporation_legal_form] ?? "-"
      : undefined,
    incorporation_number: entity.incorporation_number ?? undefined,
    business: entity.business_type ?? undefined,
    incorporation_country_code: entity.incorporation_country ?? undefined,
    incorporation_date: toDateTime(entity.incorporation_date),
    comments: entity.comments ?? undefined,
    is_my_client: entity.is_my_client,
    phones: entity.phones.map(mapPhone),
    addresses: entity.addresses.map(mapAddress),
  };
}

function mapAccount(
  account: DbAccount & { person: DbPerson | null; entity: DbEntity | null }
): GoAMLAccount {
  const goamlAccount: GoAMLAccount = {
    institution_name: account.institution_name,
    branch: account.branch ?? "N/A",
    account: account.account_number,
    currency_code: account.currency_code ?? undefined,
    personal_account_type: account.account_type ?? undefined,
    balance: account.balance ?? undefined,
    date_balance: toDateTime(account.balance_date),
    status_code: account.status
      ? ACCOUNT_STATUS_MAP[account.status] ?? undefined
      : undefined,
    opened: toDateTime(account.opened_date),
    closed: toDateTime(account.closed_date),
    comments: account.comments ?? undefined,
  };

  if (account.institution_code_type === "swift" && account.institution_code) {
    goamlAccount.swift = account.institution_code;
  } else if (account.institution_code) {
    goamlAccount.institution_code = account.institution_code;
  } else {
    // XSD requires institution_code OR swift; use "-" (unknown) as fallback
    goamlAccount.institution_code = "-";
  }

  return goamlAccount;
}

function mapPhone(phone: DbPhone): GoAMLPhone {
  return {
    tph_contact_type: PHONE_CONTACT_TYPE_MAP[phone.phone_type ?? ""] ?? "L",
    tph_communication_type: PHONE_COMM_TYPE_MAP[phone.phone_type ?? ""] ?? "D",
    tph_country_prefix: phone.country_prefix ?? undefined,
    tph_number: phone.number,
    tph_extension: phone.extension ?? undefined,
    comments: phone.comments ?? undefined,
  };
}

function mapAddress(addr: DbAddress): GoAMLAddress {
  return {
    address_type: ADDRESS_TYPE_MAP[addr.address_type ?? ""] ?? "L",
    address: addr.address_line ?? "N/A",
    city: addr.city ?? "N/A",
    state: addr.state ?? undefined,
    zip: addr.postcode ?? undefined,
    country_code: addr.country_code ?? "NZ",
    comments: addr.comments ?? undefined,
  };
}

function mapIdentification(id: DbIdentification): GoAMLPersonIdentification {
  return {
    type: ID_TYPE_MAP[id.type] ?? "-",
    number: id.number,
    issue_date: toDateTime(id.issue_date),
    expiry_date: toDateTime(id.expiry_date),
    issued_by: id.issued_by ?? undefined,
    issue_country: id.issue_country ?? "NZ",
    comments: id.comments ?? undefined,
  };
}

function mapActivity(data: ReportData): GoAMLActivity {
  const reportParties: GoAMLActivity["report_parties"] = [];

  for (const person of data.persons) {
    if (person.is_my_client) {
      reportParties.push({ person_my_client: mapPerson(person) });
    } else {
      reportParties.push({ person: mapPerson(person) });
    }
  }

  for (const entity of data.entities) {
    if (entity.is_my_client) {
      reportParties.push({ entity_my_client: mapEntity(entity) });
    } else {
      reportParties.push({ entity: mapEntity(entity) });
    }
  }

  return { report_parties: reportParties };
}
