export interface GoAMLReport {
  rentity_id: number;
  rentity_branch?: string;
  submission_code: "E" | "M";
  report_code: ReportCode;
  entity_reference: string;
  fiu_ref_number?: string;
  report_date: string; // YYYY-MM-DD
  currency_code_local: string;
  reporting_person?: ReportingPerson;
  location?: GoAMLAddress;
  reason?: string;
  action?: string;
  transactions: GoAMLTransaction[];
  activity?: GoAMLActivity;
  report_indicators: string[];
}

export type ReportCode =
  | "STR"
  | "SAR"
  | "LCT"
  | "IFT"
  | "AIF"
  | "BCR";

export interface ReportingPerson {
  gender?: string;
  title?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  birthdate?: string;
  nationality1?: string;
  residence?: string;
  phones?: GoAMLPhone[];
  addresses?: GoAMLAddress[];
  email?: string;
  occupation?: string;
}

export interface GoAMLTransaction {
  transactionnumber: string;
  internal_ref_number?: string;
  transaction_location: string;
  transaction_description?: string;
  date_transaction: string;
  teller?: string;
  authorized?: string;
  late_deposit?: boolean;
  date_posting?: string;
  transmode_code: string;
  transmode_comment?: string;
  amount_local: number;
  t_from?: GoAMLTransactionSide;
  t_from_my_client?: GoAMLTransactionSide;
  t_to?: GoAMLTransactionSide;
  t_to_my_client?: GoAMLTransactionSide;
  comments?: string;
}

export interface GoAMLTransactionSide {
  funds_code?: string;
  funds_comment?: string;
  foreign_currency?: GoAMLForeignCurrency;
  from_country?: string;
  to_country?: string;
  account?: GoAMLAccount;
  person?: GoAMLPerson;
  entity?: GoAMLEntity;
  is_my_client: boolean;
}

export interface GoAMLForeignCurrency {
  foreign_currency_code: string;
  foreign_amount: number;
  foreign_exchange_rate?: number;
}

export interface GoAMLAccount {
  institution_name: string;
  institution_code?: string;
  swift?: string;
  institution_country?: string;
  non_bank_institution?: boolean;
  branch: string;
  account: string;
  currency_code?: string;
  account_name?: string;
  iban?: string;
  client_number?: string;
  personal_account_type?: string;
  t_entity?: GoAMLEntity;
  signatories?: GoAMLSignatory[];
  opened?: string;
  closed?: string;
  balance?: number;
  date_balance?: string;
  status_code?: string;
  comments?: string;
}

export interface GoAMLSignatory {
  is_primary?: boolean;
  t_person: GoAMLPerson;
}

export interface GoAMLPerson {
  gender?: string;
  title?: string;
  first_name: string;
  middle_name?: string;
  prefix?: string;
  last_name: string;
  birthdate?: string;
  birth_place?: string;
  mothers_name?: string;
  ssn?: string;
  passport_number?: string;
  passport_country?: string;
  id_number?: string;
  nationality1?: string;
  nationality2?: string;
  nationality3?: string;
  residence?: string;
  phones?: GoAMLPhone[];
  addresses?: GoAMLAddress[];
  email?: string;
  occupation?: string;
  employer_name?: string;
  identifications?: GoAMLPersonIdentification[];
  source_of_wealth?: string;
  comments?: string;
  is_my_client: boolean;
}

export interface GoAMLEntity {
  name: string;
  commercial_name?: string;
  incorporation_legal_form?: string;
  incorporation_number?: string;
  business?: string;
  phones?: GoAMLPhone[];
  addresses?: GoAMLAddress[];
  email?: string;
  incorporation_state?: string;
  incorporation_country_code?: string;
  director_ids?: GoAMLPerson[];
  incorporation_date?: string;
  tax_number?: string;
  tax_reg_number?: string;
  comments?: string;
  is_my_client: boolean;
}

export interface GoAMLPersonIdentification {
  type: string;
  number: string;
  issue_date?: string;
  expiry_date?: string;
  issued_by?: string;
  issue_country: string;
  comments?: string;
}

export interface GoAMLPhone {
  tph_contact_type: string;
  tph_communication_type: string;
  tph_country_prefix?: string;
  tph_number: string;
  tph_extension?: string;
  comments?: string;
}

export interface GoAMLAddress {
  address_type: string;
  address: string;
  town?: string;
  city: string;
  zip?: string;
  country_code: string;
  state?: string;
  comments?: string;
}

export interface GoAMLActivity {
  report_parties: GoAMLReportParty[];
}

export interface GoAMLReportParty {
  person?: GoAMLPerson;
  person_my_client?: GoAMLPerson;
  entity?: GoAMLEntity;
  entity_my_client?: GoAMLEntity;
  account?: GoAMLAccount;
  account_my_client?: GoAMLAccount;
}
