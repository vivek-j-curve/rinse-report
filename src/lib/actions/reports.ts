"use server";

import { createClient } from "@/lib/supabase/server";
import { buildGoAMLXml, mapReportDataToGoAML } from "@/lib/goaml";
import type { ReportData } from "@/lib/goaml";
import { buildReportPdf } from "@/lib/pdf/report-pdf";
import type { PdfReportData } from "@/lib/pdf/report-pdf";
import { revalidatePath } from "next/cache";
import { createNotificationsForOrg } from "@/lib/actions/notifications";

// ── helpers ──

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organisation_id, role, full_name")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "No profile found" as const } as const;

  return { supabase, user, profile } as const;
}

// ── Preview questionnaire data for a case ──

export async function getCaseSubjectPreview(caseId: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  const { data: caseRecord } = await supabase
    .from("cases")
    .select("*, questionnaire_responses(*)")
    .eq("id", caseId)
    .eq("organisation_id", profile.organisation_id)
    .single();
  if (!caseRecord) return { error: "Case not found" };

  const questionnaire = (caseRecord.questionnaire_responses ?? []).find(
    (qr: { status: string }) => qr.status === "complete"
  );
  if (!questionnaire) return { data: null };

  const r = (questionnaire.responses ?? {}) as Record<string, string>;
  return {
    data: {
      first_names: r.first_names ?? "",
      last_name: r.last_name ?? "",
      date_of_birth: r.date_of_birth ?? "",
      id_type: r.id_type ?? "",
      id_number: r.id_number ?? "",
      nationality: r.nationality ?? "",
      occupation: r.occupation ?? "",
    },
  };
}

// ── Create a draft report ──

export async function createDraftReport(
  caseId: string,
  reportType: "STR" | "SAR" | "LCT" | "IFT"
) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  if (profile.role !== "owner" && profile.role !== "admin") {
    return { error: "Only admins can create reports" };
  }

  const { data: caseRecord } = await supabase
    .from("cases")
    .select("*, reporting_entities(*), questionnaire_responses(*)")
    .eq("id", caseId)
    .eq("organisation_id", profile.organisation_id)
    .single();
  if (!caseRecord) return { error: "Case not found" };

  const questionnaire = (caseRecord.questionnaire_responses ?? []).find(
    (qr: { status: string }) => qr.status === "complete"
  );
  if (!questionnaire) {
    return { error: "No completed questionnaire found for this case" };
  }

  const existingReport = await supabase
    .from("reports")
    .select("id, version")
    .eq("case_id", caseId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const version = existingReport.data ? existingReport.data.version + 1 : 1;
  const submissionCode = existingReport.data ? "R" : "E";
  const entityRef = `${caseRecord.case_number}-v${version}`;

  const { data: newReport, error: insertError } = await supabase
    .from("reports")
    .insert({
      case_id: caseId,
      organisation_id: profile.organisation_id,
      questionnaire_response_id: questionnaire.id,
      report_type: reportType,
      report_code: reportType,
      entity_reference: entityRef,
      submission_code: submissionCode,
      version,
      status: "draft",
    })
    .select("id")
    .single();

  if (insertError) {
    return { error: `Failed to create report: ${insertError.message}` };
  }

  revalidatePath("/reports");
  revalidatePath(`/suspicions/${caseId}`);

  return { success: true, report_id: newReport.id };
}

// ── Load a report with all related data ──

export async function getReport(reportId: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  const { data: report } = await supabase
    .from("reports")
    .select(
      "*, cases(case_number, title, reporting_entity_id, sla_deadline, suspicion_formed_at, priority, status, reporting_entities(*))"
    )
    .eq("id", reportId)
    .eq("organisation_id", profile.organisation_id)
    .single();
  if (!report) return { error: "Report not found" };

  const [personsRes, entitiesRes, transactionsRes, indicatorsRes, accountsRes, questionnaireRes] =
    await Promise.all([
      supabase
        .from("report_persons")
        .select("*, addresses(*), phones(*), person_identifications(*)")
        .eq("report_id", reportId)
        .eq("organisation_id", profile.organisation_id)
        .order("created_at"),
      supabase
        .from("report_entities")
        .select("*, addresses(*), phones(*)")
        .eq("report_id", reportId)
        .eq("organisation_id", profile.organisation_id)
        .order("created_at"),
      supabase
        .from("report_transactions")
        .select("*, transaction_parties(*)")
        .eq("report_id", reportId)
        .eq("organisation_id", profile.organisation_id)
        .order("created_at"),
      supabase
        .from("report_indicators")
        .select("*")
        .eq("report_id", reportId),
      supabase
        .from("report_accounts")
        .select("*")
        .eq("report_id", reportId)
        .eq("organisation_id", profile.organisation_id)
        .order("created_at"),
      supabase
        .from("questionnaire_responses")
        .select("responses")
        .eq("case_id", report.case_id)
        .order("created_at")
        .limit(1)
        .maybeSingle(),
    ]);

  const suspicionRes = await supabase
    .from("suspicions")
    .select("description, source, created_at")
    .eq("case_id", report.case_id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  return {
    data: {
      report,
      persons: personsRes.data ?? [],
      entities: entitiesRes.data ?? [],
      transactions: transactionsRes.data ?? [],
      indicators: indicatorsRes.data ?? [],
      accounts: accountsRes.data ?? [],
      questionnaireSubject: questionnaireRes.data?.responses ?? null,
      suspicion: suspicionRes.data ?? null,
    },
  };
}

// ── Persons CRUD ──

export async function savePerson(
  reportId: string,
  person: {
    id?: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    title?: string;
    gender?: "M" | "F" | "U";
    birthdate?: string;
    birth_place?: string;
    nationality?: string;
    residence?: string;
    occupation?: string;
    mothers_name?: string;
    source_of_wealth?: string;
    is_my_client: boolean;
    role: "my_client" | "counterparty" | "conductor" | "signatory" | "director" | "beneficiary";
    entity_id?: string;
    comments?: string;
  }
) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  const row = {
    report_id: reportId,
    organisation_id: profile.organisation_id,
    first_name: person.first_name,
    last_name: person.last_name,
    middle_name: person.middle_name || null,
    title: person.title || null,
    gender: (person.gender || null) as "M" | "F" | "U" | null,
    birthdate: person.birthdate || null,
    birth_place: person.birth_place || null,
    nationality: person.nationality || null,
    residence: person.residence || null,
    occupation: person.occupation || null,
    mothers_name: person.mothers_name || null,
    source_of_wealth: person.source_of_wealth || null,
    is_my_client: person.is_my_client,
    role: person.role,
    entity_id: person.entity_id || null,
    comments: person.comments || null,
  };

  if (person.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase
      .from("report_persons")
      .update(row as any)
      .eq("id", person.id)
      .eq("organisation_id", profile.organisation_id);
    if (error) return { error: error.message };
    revalidatePath(`/reports/${reportId}`);
    return { success: true, id: person.id };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase
    .from("report_persons")
    .insert(row as any)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath(`/reports/${reportId}`);
  return { success: true, id: data.id };
}

export async function deletePerson(reportId: string, personId: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  await supabase.from("addresses").delete().eq("person_id", personId);
  await supabase.from("phones").delete().eq("person_id", personId);
  await supabase
    .from("person_identifications")
    .delete()
    .eq("person_id", personId);

  const { error } = await supabase
    .from("report_persons")
    .delete()
    .eq("id", personId)
    .eq("organisation_id", profile.organisation_id);
  if (error) return { error: error.message };

  revalidatePath(`/reports/${reportId}`);
  return { success: true };
}

// ── Person sub-records (addresses, phones, IDs) ──

export async function saveAddress(
  personId: string,
  address: {
    id?: string;
    address_type?: "residential" | "business" | "registered" | "mailing";
    address_line?: string;
    city?: string;
    postcode?: string;
    country_code?: string;
    state?: string;
    comments?: string;
  },
  entityId?: string
) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase } = ctx;

  const row = {
    person_id: entityId ? null : personId,
    entity_id: entityId || null,
    address_type: (address.address_type || null) as
      | "residential"
      | "business"
      | "registered"
      | "mailing"
      | null,
    address_line: address.address_line || null,
    city: address.city || null,
    postcode: address.postcode || null,
    country_code: address.country_code || null,
    state: address.state || null,
    comments: address.comments || null,
  };

  if (address.id) {
    const { error } = await supabase
      .from("addresses")
      .update(row)
      .eq("id", address.id);
    if (error) return { error: error.message };
    return { success: true, id: address.id };
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert(row)
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { success: true, id: data.id };
}

export async function deleteAddress(addressId: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase } = ctx;

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function savePhone(
  personId: string,
  phone: {
    id?: string;
    phone_type?: "mobile" | "landline" | "fax";
    country_prefix?: string;
    number: string;
    extension?: string;
    comments?: string;
  },
  entityId?: string
) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase } = ctx;

  const row = {
    person_id: entityId ? null : personId,
    entity_id: entityId || null,
    phone_type: (phone.phone_type || null) as
      | "mobile"
      | "landline"
      | "fax"
      | null,
    country_prefix: phone.country_prefix || null,
    number: phone.number,
    extension: phone.extension || null,
    comments: phone.comments || null,
  };

  if (phone.id) {
    const { error } = await supabase
      .from("phones")
      .update(row)
      .eq("id", phone.id);
    if (error) return { error: error.message };
    return { success: true, id: phone.id };
  }

  const { data, error } = await supabase
    .from("phones")
    .insert(row)
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { success: true, id: data.id };
}

export async function deletePhone(phoneId: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase } = ctx;

  const { error } = await supabase.from("phones").delete().eq("id", phoneId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function saveIdentification(
  personId: string,
  identification: {
    id?: string;
    type: "drivers_licence" | "passport" | "national_id" | "birth_certificate" | "other";
    number: string;
    issue_date?: string;
    expiry_date?: string;
    issued_by?: string;
    issue_country?: string;
    comments?: string;
  }
) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase } = ctx;

  const row = {
    person_id: personId,
    type: identification.type,
    number: identification.number,
    issue_date: identification.issue_date || null,
    expiry_date: identification.expiry_date || null,
    issued_by: identification.issued_by || null,
    issue_country: identification.issue_country || null,
    comments: identification.comments || null,
  };

  if (identification.id) {
    const { error } = await supabase
      .from("person_identifications")
      .update(row)
      .eq("id", identification.id);
    if (error) return { error: error.message };
    return { success: true, id: identification.id };
  }

  const { data, error } = await supabase
    .from("person_identifications")
    .insert(row)
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { success: true, id: data.id };
}

export async function deleteIdentification(identificationId: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase } = ctx;

  const { error } = await supabase
    .from("person_identifications")
    .delete()
    .eq("id", identificationId);
  if (error) return { error: error.message };
  return { success: true };
}

// ── Transactions CRUD ──

export async function saveTransaction(
  reportId: string,
  transaction: {
    id?: string;
    transaction_number: string;
    transaction_location: string;
    transaction_description?: string;
    date_transaction: string;
    transmode_code: string;
    transmode_comment?: string;
    amount_local: number;
    currency_code_local?: string;
    amount_foreign?: number;
    currency_code_foreign?: string;
    late_deposit?: boolean;
    goods_description?: string;
    comments?: string;
  }
) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  const row = {
    report_id: reportId,
    organisation_id: profile.organisation_id,
    transaction_number: transaction.transaction_number,
    transaction_location: transaction.transaction_location,
    transaction_description: transaction.transaction_description || null,
    date_transaction: transaction.date_transaction,
    transmode_code: transaction.transmode_code,
    transmode_comment: transaction.transmode_comment || null,
    amount_local: transaction.amount_local,
    currency_code_local: transaction.currency_code_local || "NZD",
    amount_foreign: transaction.amount_foreign ?? null,
    currency_code_foreign: transaction.currency_code_foreign || null,
    late_deposit: transaction.late_deposit ?? false,
    goods_description: transaction.goods_description || null,
    comments: transaction.comments || null,
  };

  if (transaction.id) {
    const { error } = await supabase
      .from("report_transactions")
      .update(row)
      .eq("id", transaction.id)
      .eq("organisation_id", profile.organisation_id);
    if (error) return { error: error.message };
    revalidatePath(`/reports/${reportId}`);
    return { success: true, id: transaction.id };
  }

  const { data, error } = await supabase
    .from("report_transactions")
    .insert(row)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath(`/reports/${reportId}`);
  return { success: true, id: data.id };
}

export async function deleteTransaction(
  reportId: string,
  transactionId: string
) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  await supabase
    .from("transaction_parties")
    .delete()
    .eq("transaction_id", transactionId);

  const { error } = await supabase
    .from("report_transactions")
    .delete()
    .eq("id", transactionId)
    .eq("organisation_id", profile.organisation_id);
  if (error) return { error: error.message };

  revalidatePath(`/reports/${reportId}`);
  return { success: true };
}

export async function saveTransactionParty(
  transactionId: string,
  party: {
    id?: string;
    direction: "from" | "to";
    party_type: "person" | "entity" | "account";
    person_id?: string;
    entity_id?: string;
    account_id?: string;
  }
) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase } = ctx;

  const row = {
    transaction_id: transactionId,
    direction: party.direction,
    party_type: party.party_type,
    person_id: party.person_id || null,
    entity_id: party.entity_id || null,
    account_id: party.account_id || null,
  };

  if (party.id) {
    const { error } = await supabase
      .from("transaction_parties")
      .update(row)
      .eq("id", party.id);
    if (error) return { error: error.message };
    return { success: true, id: party.id };
  }

  const { data, error } = await supabase
    .from("transaction_parties")
    .insert(row)
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { success: true, id: data.id };
}

export async function deleteTransactionParty(partyId: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase } = ctx;

  const { error } = await supabase
    .from("transaction_parties")
    .delete()
    .eq("id", partyId);
  if (error) return { error: error.message };
  return { success: true };
}

// ── Accounts CRUD ──

export async function saveAccount(
  reportId: string,
  account: {
    id?: string;
    institution_name: string;
    branch?: string;
    account_number: string;
    institution_code?: string;
    institution_code_type?: "swift" | "nz_bank_prefix";
    currency_code?: string;
    account_type?: string;
    funds_code?: string;
    is_my_client: boolean;
    person_id?: string;
    entity_id?: string;
    comments?: string;
  }
) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  const row = {
    report_id: reportId,
    organisation_id: profile.organisation_id,
    institution_name: account.institution_name,
    branch: account.branch || null,
    account_number: account.account_number,
    institution_code: account.institution_code || null,
    institution_code_type: (account.institution_code_type || null) as
      | "swift"
      | "nz_bank_prefix"
      | null,
    currency_code: account.currency_code || null,
    account_type: account.account_type || null,
    funds_code: account.funds_code || null,
    is_my_client: account.is_my_client,
    person_id: account.person_id || null,
    entity_id: account.entity_id || null,
    comments: account.comments || null,
  };

  if (account.id) {
    const { error } = await supabase
      .from("report_accounts")
      .update(row)
      .eq("id", account.id)
      .eq("organisation_id", profile.organisation_id);
    if (error) return { error: error.message };
    revalidatePath(`/reports/${reportId}`);
    return { success: true, id: account.id };
  }

  const { data, error } = await supabase
    .from("report_accounts")
    .insert(row)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath(`/reports/${reportId}`);
  return { success: true, id: data.id };
}

export async function deleteAccount(reportId: string, accountId: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  await supabase
    .from("transaction_parties")
    .delete()
    .eq("account_id", accountId);

  const { error } = await supabase
    .from("report_accounts")
    .delete()
    .eq("id", accountId)
    .eq("organisation_id", profile.organisation_id);
  if (error) return { error: error.message };

  revalidatePath(`/reports/${reportId}`);
  return { success: true };
}

// ── Entities CRUD ──

export async function saveEntity(
  reportId: string,
  entity: {
    id?: string;
    name: string;
    commercial_name?: string;
    is_my_client: boolean;
    role: "my_client" | "counterparty" | "conductor" | "signatory" | "director" | "beneficiary";
    business_type?: string;
    incorporation_date?: string;
    incorporation_country?: string;
    incorporation_legal_form?: "limited" | "partnership" | "sole_trader" | "trust" | "other";
    incorporation_number?: string;
    comments?: string;
  }
) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  const row = {
    report_id: reportId,
    organisation_id: profile.organisation_id,
    name: entity.name,
    commercial_name: entity.commercial_name || null,
    is_my_client: entity.is_my_client,
    role: entity.role,
    business_type: entity.business_type || null,
    incorporation_date: entity.incorporation_date || null,
    incorporation_country: entity.incorporation_country || null,
    incorporation_legal_form: (entity.incorporation_legal_form || null) as
      | "limited" | "partnership" | "sole_trader" | "trust" | "other"
      | null,
    incorporation_number: entity.incorporation_number || null,
    comments: entity.comments || null,
  };

  if (entity.id) {
    const { error } = await supabase
      .from("report_entities")
      .update(row)
      .eq("id", entity.id)
      .eq("organisation_id", profile.organisation_id);
    if (error) return { error: error.message };
    revalidatePath(`/reports/${reportId}`);
    return { success: true, id: entity.id };
  }

  const { data, error } = await supabase
    .from("report_entities")
    .insert(row)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath(`/reports/${reportId}`);
  return { success: true, id: data.id };
}

export async function deleteEntity(reportId: string, entityId: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  await supabase.from("addresses").delete().eq("entity_id", entityId);
  await supabase.from("phones").delete().eq("entity_id", entityId);

  const { error } = await supabase
    .from("report_entities")
    .delete()
    .eq("id", entityId)
    .eq("organisation_id", profile.organisation_id);
  if (error) return { error: error.message };

  revalidatePath(`/reports/${reportId}`);
  return { success: true };
}

// ── Indicators ──

export async function saveIndicators(
  reportId: string,
  indicatorCodes: string[]
) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase } = ctx;

  await supabase.from("report_indicators").delete().eq("report_id", reportId);

  if (indicatorCodes.length > 0) {
    const rows = indicatorCodes.map((code) => ({
      report_id: reportId,
      indicator_code: code,
    }));
    const { error } = await supabase.from("report_indicators").insert(rows);
    if (error) return { error: error.message };
  }

  revalidatePath(`/reports/${reportId}`);
  return { success: true };
}

// ── Save sector supervisor (replaces any existing DIA/FMA/RBNZ, keeps others) ──

const SUPERVISOR_CODES = new Set(["DIA", "FMA", "RBNZ"]);

export async function saveSupervisorCode(reportId: string, code: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase } = ctx;

  const { data: existing } = await supabase
    .from("report_indicators")
    .select("indicator_code")
    .eq("report_id", reportId);

  const nonSupervisor = (existing ?? [])
    .map((r) => r.indicator_code)
    .filter((c) => !SUPERVISOR_CODES.has(c));

  const allCodes = [...nonSupervisor, code];
  await supabase.from("report_indicators").delete().eq("report_id", reportId);
  if (allCodes.length > 0) {
    await supabase
      .from("report_indicators")
      .insert(allCodes.map((c) => ({ report_id: reportId, indicator_code: c })));
  }

  revalidatePath(`/reports/${reportId}`);
  return { success: true };
}

// ── Update report reason / action ──

export async function updateReportReason(
  reportId: string,
  reason: string,
  action?: string,
  fiuRefNumber?: string
) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  // reason, action and fiu_ref_number are stored in the xml_validation_errors
  // JSON column (no dedicated columns exist for them without a migration).
  const { error } = await supabase
    .from("reports")
    .update({
      xml_validation_errors: {
        reason,
        action: action || null,
        fiu_ref_number: fiuRefNumber || null,
      } as unknown as null,
    })
    .eq("id", reportId)
    .eq("organisation_id", profile.organisation_id);

  if (error) return { error: error.message };
  revalidatePath(`/reports/${reportId}`);
  return { success: true };
}

// ── Generate XML from saved report data ──

export async function generateReportXml(reportId: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  if (profile.role !== "owner" && profile.role !== "admin") {
    return { error: "Only admins can generate reports" };
  }

  const reportResult = await getReport(reportId);
  if ("error" in reportResult && reportResult.error)
    return { error: reportResult.error };
  if (!("data" in reportResult) || !reportResult.data)
    return { error: "Report not found" };
  const { report, persons, entities, transactions, indicators } =
    reportResult.data;

  const caseData = report.cases as {
    case_number: string;
    title: string;
    reporting_entity_id: string;
    reporting_entities: {
      rentity_id: string;
      rentity_branch: string | null;
      local_currency: string;
      compliance_officer_name: string;
      compliance_officer_email: string | null;
    };
  };

  const reasonData = report.xml_validation_errors as {
    reason?: string;
    action?: string;
    fiu_ref_number?: string;
  } | null;

  const reportData: ReportData = {
    report: {
      entity_reference: report.entity_reference,
      report_code: report.report_code,
      report_type: report.report_type,
      submission_code: report.submission_code,
      fiu_ref_number: reasonData?.fiu_ref_number ?? undefined,
    },
    reporting_entity: caseData.reporting_entities,
    case_record: { title: caseData.title },
    transactions: transactions.map((tx) => ({
      ...tx,
      parties: (tx.transaction_parties ?? []).map(
        (tp: {
          direction: "from" | "to";
          party_type: "person" | "entity" | "account";
          person_id: string | null;
          entity_id: string | null;
          account_id: string | null;
        }) => {
          const matchedPerson = tp.person_id
            ? persons.find((p) => p.id === tp.person_id) ?? null
            : null;
          const matchedEntity = tp.entity_id
            ? entities.find((e) => e.id === tp.entity_id) ?? null
            : null;
          return {
            direction: tp.direction,
            party_type: tp.party_type,
            person: matchedPerson
              ? {
                  ...matchedPerson,
                  identifications: (matchedPerson.person_identifications ?? []).map(
                    (id: {
                      type: string;
                      number: string;
                      issue_date: string | null;
                      expiry_date: string | null;
                      issued_by: string | null;
                      issue_country: string | null;
                      comments: string | null;
                    }) => ({
                      type: id.type,
                      number: id.number,
                      issue_date: id.issue_date,
                      expiry_date: id.expiry_date,
                      issued_by: id.issued_by,
                      issue_country: id.issue_country,
                      comments: id.comments,
                    })
                  ),
                }
              : null,
            entity: matchedEntity ?? null,
            account: null,
          };
        }
      ),
    })),
    persons: persons.map((p) => ({
      ...p,
      identifications: (p.person_identifications ?? []).map(
        (id: {
          type: string;
          number: string;
          issue_date: string | null;
          expiry_date: string | null;
          issued_by: string | null;
          issue_country: string | null;
          comments: string | null;
        }) => ({
          type: id.type,
          number: id.number,
          issue_date: id.issue_date,
          expiry_date: id.expiry_date,
          issued_by: id.issued_by,
          issue_country: id.issue_country,
          comments: id.comments,
        })
      ),
    })),
    entities: entities.map((e) => ({
      ...e,
      business_type: e.business_type,
    })),
    accounts: [],
    indicators,
    reason: reasonData?.reason,
  };

  const goamlReport = mapReportDataToGoAML(reportData);
  const xmlString = buildGoAMLXml(goamlReport);

  const xmlBlob = new Blob([xmlString], { type: "application/xml" });
  const xmlPath = `${profile.organisation_id}/${report.case_id}/report-v${report.version}.xml`;

  const { error: uploadError } = await supabase.storage
    .from("reports")
    .upload(xmlPath, xmlBlob, {
      contentType: "application/xml",
      upsert: true,
    });

  if (uploadError) {
    return { error: `Failed to upload XML: ${uploadError.message}` };
  }

  await supabase
    .from("reports")
    .update({ xml_storage_path: xmlPath })
    .eq("id", reportId)
    .eq("organisation_id", profile.organisation_id);

  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);

  return { success: true, xml: xmlString };
}

// ── Generate human-readable PDF from saved report data ──

export async function generateReportPdf(reportId: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  if (profile.role !== "owner" && profile.role !== "admin") {
    return { error: "Only admins can generate reports" };
  }

  const reportResult = await getReport(reportId);
  if ("error" in reportResult && reportResult.error) return { error: reportResult.error };
  if (!("data" in reportResult) || !reportResult.data) return { error: "Report not found" };
  const { report, persons, entities, transactions, indicators } = reportResult.data;

  const caseData = report.cases as {
    case_number: string;
    title: string;
    sla_deadline?: string | null;
    reporting_entities: {
      rentity_id: string;
      local_currency: string;
      compliance_officer_name: string;
    };
  };

  const reasonData = report.xml_validation_errors as {
    reason?: string;
    action?: string;
    fiu_ref_number?: string;
  } | null;

  const pdfData: PdfReportData = {
    entityReference: report.entity_reference,
    reportType: report.report_type,
    reportCode: report.report_code,
    submissionCode: report.submission_code,
    version: report.version,
    generatedAt: new Date().toISOString(),
    status: report.status,

    caseNumber: caseData.case_number,
    caseTitle: caseData.title,
    slaDeadline: caseData.sla_deadline,

    reportingEntityName: caseData.reporting_entities.compliance_officer_name,
    rentityId: caseData.reporting_entities.rentity_id,
    localCurrency: caseData.reporting_entities.local_currency,
    complianceOfficer: caseData.reporting_entities.compliance_officer_name,

    reason: reasonData?.reason,
    action: reasonData?.action,
    fiuRefNumber: reasonData?.fiu_ref_number,

    persons: (persons as Record<string, unknown>[]).map((p) => ({
      first_name: p.first_name as string,
      last_name: p.last_name as string,
      middle_name: p.middle_name as string | null,
      title: p.title as string | null,
      gender: p.gender as string | null,
      birthdate: p.birthdate as string | null,
      nationality: p.nationality as string | null,
      residence: p.residence as string | null,
      occupation: p.occupation as string | null,
      is_my_client: p.is_my_client as boolean,
      role: p.role as string | null,
    })),

    entities: (entities as Record<string, unknown>[]).map((e) => ({
      name: e.name as string,
      commercial_name: e.commercial_name as string | null,
      incorporation_legal_form: e.incorporation_legal_form as string | null,
      incorporation_number: e.incorporation_number as string | null,
      business_type: e.business_type as string | null,
      incorporation_country: e.incorporation_country as string | null,
      is_my_client: e.is_my_client as boolean,
      role: e.role as string | null,
    })),

    transactions: (transactions as Record<string, unknown>[]).map((tx) => ({
      transaction_number: tx.transaction_number as string,
      transaction_location: tx.transaction_location as string,
      date_transaction: tx.date_transaction as string,
      transmode_code: tx.transmode_code as string,
      amount_local: tx.amount_local as number,
      currency_code_local: caseData.reporting_entities.local_currency,
      amount_foreign: tx.amount_foreign as number | null,
      currency_code_foreign: tx.currency_code_foreign as string | null,
      transaction_description: tx.transaction_description as string | null,
      transaction_parties: tx.transaction_parties as { direction: string; party_type: string }[] | undefined,
    })),

    indicators: indicators.map((i) => ({ indicator_code: i.indicator_code })),
  };

  const pdfBuffer = await buildReportPdf(pdfData);

  const pdfPath = `${profile.organisation_id}/${report.case_id}/report-v${report.version}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("reports")
    .upload(pdfPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  // Upload to storage (best-effort — pdf_storage_path column may not exist yet)
  if (!uploadError) {
    // Storage upload succeeded; DB column update skipped until migration adds pdf_storage_path
  }

  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);

  // Return base64 so the client can trigger a browser download
  const base64 = pdfBuffer.toString("base64");
  return { success: true, pdfBase64: base64, filename: `${report.entity_reference}.pdf` };
}

// ── Existing actions (kept) ──

export async function generateReport(caseId: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  if (profile.role !== "owner" && profile.role !== "admin") {
    return { error: "Only admins can generate reports" };
  }

  const { data: caseRecord } = await supabase
    .from("cases")
    .select("*, reporting_entities(*)")
    .eq("id", caseId)
    .eq("organisation_id", profile.organisation_id)
    .single();
  if (!caseRecord) return { error: "Case not found" };

  const reportingEntity = caseRecord.reporting_entities as {
    rentity_id: string;
    rentity_branch: string | null;
    local_currency: string;
    compliance_officer_name: string;
    compliance_officer_email: string | null;
  };

  const { data: questionnaire } = await supabase
    .from("questionnaire_responses")
    .select("*")
    .eq("case_id", caseId)
    .eq("status", "complete")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!questionnaire) {
    return { error: "No completed questionnaire found for this case" };
  }

  const existingReport = await supabase
    .from("reports")
    .select("id, version")
    .eq("case_id", caseId)
    .eq("questionnaire_response_id", questionnaire.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const version = existingReport.data ? existingReport.data.version + 1 : 1;
  const submissionCode = existingReport.data ? "R" : "E";
  const entityRef = `${caseRecord.case_number}-v${version}`;

  const reportData: ReportData = {
    report: {
      entity_reference: entityRef,
      report_code: questionnaire.report_type,
      report_type: questionnaire.report_type,
      submission_code: submissionCode,
    },
    reporting_entity: reportingEntity,
    case_record: { title: caseRecord.title },
    transactions: [],
    persons: [],
    entities: [],
    accounts: [],
    indicators: [],
    reason:
      (questionnaire.responses as Record<string, unknown>)?.reason as
        | string
        | undefined,
  };

  const goamlReport = mapReportDataToGoAML(reportData);
  const xmlString = buildGoAMLXml(goamlReport);

  const xmlBlob = new Blob([xmlString], { type: "application/xml" });
  const xmlPath = `${profile.organisation_id}/${caseId}/report-v${version}.xml`;

  const { error: uploadError } = await supabase.storage
    .from("reports")
    .upload(xmlPath, xmlBlob, {
      contentType: "application/xml",
      upsert: true,
    });

  if (uploadError) {
    return { error: `Failed to upload XML: ${uploadError.message}` };
  }

  const { data: newReport, error: insertError } = await supabase
    .from("reports")
    .insert({
      case_id: caseId,
      organisation_id: profile.organisation_id,
      questionnaire_response_id: questionnaire.id,
      report_type: questionnaire.report_type,
      report_code: questionnaire.report_type,
      entity_reference: entityRef,
      submission_code: submissionCode,
      version,
      status: "draft",
      xml_storage_path: xmlPath,
      amends_report_id: existingReport.data?.id ?? null,
    })
    .select("id")
    .single();

  if (insertError) {
    return { error: `Failed to create report record: ${insertError.message}` };
  }

  revalidatePath("/reports");
  revalidatePath(`/suspicions/${caseId}`);

  // Notify: report is ready for review
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.rinsereport.com";
  const notifyUsers: string[] = [];
  if (caseRecord.assigned_to) notifyUsers.push(caseRecord.assigned_to);
  createNotificationsForOrg({
    organisationId: profile.organisation_id,
    excludeUserId: ctx.user.id,
    targetUserIds: notifyUsers.length > 0 ? undefined : undefined,
    type: "report_ready",
    title: `Report ready: ${caseRecord.title}`,
    body: "A new AML report has been generated and is ready for review.",
    resourceId: newReport.id,
    resourceType: "report",
    sendEmail: true,
    emailSubject: `Report ready for review: ${caseRecord.title}`,
    emailBody: `A new AML report has been generated for case <strong>${caseRecord.title}</strong> and is ready for your review.`,
    actionUrl: `${appUrl}/reports/${newReport.id}`,
  }).catch(() => {});

  return {
    success: true,
    report_id: newReport.id,
    xml_path: xmlPath,
    entity_reference: entityRef,
    version,
  };
}

export async function getReports(organisationId?: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error, data: [] };
  const { supabase, profile } = ctx;

  const orgId = organisationId ?? profile.organisation_id;

  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      cases(case_number, title, sla_deadline, reporting_entity_id),
      report_persons(id),
      report_entities(id),
      report_transactions(id, transaction_parties(id, direction)),
      report_indicators(indicator_code),
      report_accounts(id)
    `)
    .eq("organisation_id", orgId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, data: [] };
  return { data: data ?? [] };
}

export async function downloadReportXml(reportId: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  const { data: report } = await supabase
    .from("reports")
    .select("xml_storage_path")
    .eq("id", reportId)
    .eq("organisation_id", profile.organisation_id)
    .single();

  if (!report?.xml_storage_path) {
    return { error: "Report not found or no XML file" };
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("reports")
    .download(report.xml_storage_path);

  if (downloadError || !fileData) {
    return { error: "Failed to download XML file" };
  }

  const xmlContent = await fileData.text();
  return { data: xmlContent };
}

export async function confirmReportSubmission(
  reportId: string,
  goamlConfirmationId?: string
) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, user, profile } = ctx;

  if (profile.role !== "owner" && profile.role !== "admin") {
    return { error: "Only admins can confirm report submission" };
  }

  const { data: report, error: fetchError } = await supabase
    .from("reports")
    .select("id, case_id, xml_storage_path, status")
    .eq("id", reportId)
    .eq("organisation_id", profile.organisation_id)
    .single();

  if (fetchError || !report) return { error: "Report not found" };
  if (!report.xml_storage_path) return { error: "XML has not been generated yet. Generate the XML first." };

  const now = new Date().toISOString();

  const { error: reportError } = await supabase
    .from("reports")
    .update({
      status: "submitted",
      submitted_at: now,
      ...(goamlConfirmationId ? { goaml_confirmation_id: goamlConfirmationId } : {}),
    })
    .eq("id", reportId)
    .eq("organisation_id", profile.organisation_id);

  if (reportError) return { error: reportError.message };

  await supabase
    .from("cases")
    .update({
      status: "filed",
      filed_at: now,
      filed_by: user.id,
    })
    .eq("id", report.case_id)
    .eq("organisation_id", profile.organisation_id);

  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/dashboard");

  // Notify: report has been filed
  const appUrl2 = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.rinsereport.com";
  createNotificationsForOrg({
    organisationId: profile.organisation_id,
    excludeUserId: user.id,
    type: "report_filed",
    title: "Report filed with the FIU",
    body: "A report has been confirmed as submitted to the Financial Intelligence Unit.",
    resourceId: reportId,
    resourceType: "report",
    sendEmail: true,
    emailSubject: "Report filed with the FIU",
    emailBody: "A report has been confirmed as submitted to the Financial Intelligence Unit. You can view it in Rinse Report.",
    actionUrl: `${appUrl2}/reports/${reportId}`,
  }).catch(() => {});

  return { success: true };
}

export async function updateReportStatus(
  reportId: string,
  status: "draft" | "validated" | "submitted" | "accepted" | "rejected",
  confirmationId?: string
) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, user, profile } = ctx;

  if (profile.role !== "owner" && profile.role !== "admin") {
    return { error: "Only admins can update report status" };
  }

  const { error } = await supabase
    .from("reports")
    .update({
      status,
      ...(status === "submitted"
        ? {
            submitted_at: new Date().toISOString(),
            submitted_by: user.id,
          }
        : {}),
      ...(confirmationId
        ? { goaml_confirmation_id: confirmationId }
        : {}),
    })
    .eq("id", reportId)
    .eq("organisation_id", profile.organisation_id);

  if (error) return { error: error.message };

  revalidatePath("/reports");
  return { success: true };
}

// ── Amendment ──────────────────────────────────────────────────────────────

export async function amendReport(originalReportId: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  if (profile.role !== "owner" && profile.role !== "admin") {
    return { error: "Only admins can amend reports" };
  }

  // Fetch original report with all related data
  const { data: original, error: origError } = await supabase
    .from("reports")
    .select("*")
    .eq("id", originalReportId)
    .eq("organisation_id", profile.organisation_id)
    .single();

  if (origError || !original) return { error: "Original report not found" };

  if (original.status === "draft") {
    return { error: "Cannot amend a draft report — edit it directly instead" };
  }

  // Fetch all sub-data in parallel
  const [personsRes, entitiesRes, txRes, indicatorsRes, accountsRes] = await Promise.all([
    supabase
      .from("report_persons")
      .select("*, addresses(*), phones(*), person_identifications(*)")
      .eq("report_id", originalReportId)
      .eq("organisation_id", profile.organisation_id),
    supabase
      .from("report_entities")
      .select("*, addresses(*), phones(*)")
      .eq("report_id", originalReportId)
      .eq("organisation_id", profile.organisation_id),
    supabase
      .from("report_transactions")
      .select("*, transaction_parties(*)")
      .eq("report_id", originalReportId)
      .eq("organisation_id", profile.organisation_id),
    supabase
      .from("report_indicators")
      .select("*")
      .eq("report_id", originalReportId),
    supabase
      .from("report_accounts")
      .select("*")
      .eq("report_id", originalReportId)
      .eq("organisation_id", profile.organisation_id),
  ]);

  const newVersion = original.version + 1;

  // Create the new draft report
  const { data: newReport, error: insertError } = await supabase
    .from("reports")
    .insert({
      case_id: original.case_id,
      organisation_id: profile.organisation_id,
      questionnaire_response_id: original.questionnaire_response_id,
      report_type: original.report_type,
      report_code: original.report_code,
      entity_reference: original.entity_reference,
      submission_code: "R",
      version: newVersion,
      status: "draft",
      amends_report_id: originalReportId,
      xml_validation_errors: original.xml_validation_errors,
    })
    .select("id")
    .single();

  if (insertError || !newReport) {
    return { error: insertError?.message ?? "Failed to create amendment draft" };
  }

  const newReportId = newReport.id;

  type PersonRow = typeof personsRes.data extends (infer T)[] | null ? T : never;
  type EntityRow = typeof entitiesRes.data extends (infer T)[] | null ? T : never;
  type TxRow = typeof txRes.data extends (infer T)[] | null ? T : never;
  type AcctRow = typeof accountsRes.data extends (infer T)[] | null ? T : never;

  // Copy persons and track old → new id mapping
  const personIdMap = new Map<string, string>();
  for (const p of (personsRes.data ?? []) as PersonRow[]) {
    const { data: newPerson } = await supabase
      .from("report_persons")
      .insert({
        report_id: newReportId,
        organisation_id: profile.organisation_id,
        first_name: p.first_name,
        last_name: p.last_name,
        middle_name: p.middle_name,
        title: p.title,
        gender: p.gender,
        birthdate: p.birthdate,
        birth_place: p.birth_place,
        nationality: p.nationality,
        residence: p.residence,
        occupation: p.occupation,
        mothers_name: p.mothers_name,
        source_of_wealth: p.source_of_wealth,
        is_my_client: p.is_my_client,
        role: p.role,
        comments: p.comments,
      })
      .select("id")
      .single();
    if (newPerson) {
      personIdMap.set(p.id, newPerson.id);
      for (const addr of p.addresses ?? []) {
        await supabase.from("addresses").insert({
          person_id: newPerson.id,
          address_line: addr.address_line,
          address_type: addr.address_type,
          city: addr.city,
          comments: addr.comments,
          country_code: addr.country_code,
          postcode: addr.postcode,
          state: addr.state,
        });
      }
      for (const ph of p.phones ?? []) {
        await supabase.from("phones").insert({
          person_id: newPerson.id,
          country_prefix: ph.country_prefix,
          number: ph.number,
          phone_type: ph.phone_type,
          extension: ph.extension,
          comments: ph.comments,
        });
      }
      for (const ident of p.person_identifications ?? []) {
        await supabase.from("person_identifications").insert({
          person_id: newPerson.id,
          type: ident.type,
          number: ident.number,
          issue_country: ident.issue_country,
          issue_date: ident.issue_date,
          expiry_date: ident.expiry_date,
          issued_by: ident.issued_by,
          comments: ident.comments,
        });
      }
    }
  }

  // Copy entities and track old → new id mapping
  const entityIdMap = new Map<string, string>();
  for (const e of (entitiesRes.data ?? []) as EntityRow[]) {
    const { data: newEntity } = await supabase
      .from("report_entities")
      .insert({
        report_id: newReportId,
        organisation_id: profile.organisation_id,
        name: e.name,
        commercial_name: e.commercial_name,
        business_type: e.business_type,
        incorporation_country: e.incorporation_country,
        incorporation_date: e.incorporation_date,
        incorporation_legal_form: e.incorporation_legal_form,
        incorporation_number: e.incorporation_number,
        is_my_client: e.is_my_client,
        role: e.role,
        comments: e.comments,
      })
      .select("id")
      .single();
    if (newEntity) {
      entityIdMap.set(e.id, newEntity.id);
      for (const addr of e.addresses ?? []) {
        await supabase.from("addresses").insert({
          entity_id: newEntity.id,
          address_line: addr.address_line,
          address_type: addr.address_type,
          city: addr.city,
          comments: addr.comments,
          country_code: addr.country_code,
          postcode: addr.postcode,
          state: addr.state,
        });
      }
      for (const ph of e.phones ?? []) {
        await supabase.from("phones").insert({
          entity_id: newEntity.id,
          country_prefix: ph.country_prefix,
          number: ph.number,
          phone_type: ph.phone_type,
          extension: ph.extension,
          comments: ph.comments,
        });
      }
    }
  }

  // Copy accounts and track old → new id mapping
  const accountIdMap = new Map<string, string>();
  for (const acct of (accountsRes.data ?? []) as AcctRow[]) {
    const { data: newAcct } = await supabase
      .from("report_accounts")
      .insert({
        report_id: newReportId,
        organisation_id: profile.organisation_id,
        account_number: acct.account_number,
        account_type: acct.account_type,
        institution_name: acct.institution_name,
        institution_code: acct.institution_code,
        institution_code_type: acct.institution_code_type,
        branch: acct.branch,
        currency_code: acct.currency_code,
        balance: acct.balance,
        balance_date: acct.balance_date,
        opened_date: acct.opened_date,
        closed_date: acct.closed_date,
        status: acct.status,
        funds_code: acct.funds_code,
        comments: acct.comments,
        is_my_client: acct.is_my_client,
        person_id: acct.person_id ? personIdMap.get(acct.person_id) ?? null : null,
        entity_id: acct.entity_id ? entityIdMap.get(acct.entity_id) ?? null : null,
      })
      .select("id")
      .single();
    if (newAcct) {
      accountIdMap.set(acct.id, newAcct.id);
    }
  }

  // Copy transactions and their parties
  for (const tx of (txRes.data ?? []) as TxRow[]) {
    const { data: newTx } = await supabase
      .from("report_transactions")
      .insert({
        report_id: newReportId,
        organisation_id: profile.organisation_id,
        transaction_number: tx.transaction_number,
        transaction_location: tx.transaction_location,
        date_transaction: tx.date_transaction,
        transmode_code: tx.transmode_code,
        transmode_comment: tx.transmode_comment,
        amount_local: tx.amount_local,
        currency_code_local: tx.currency_code_local,
        amount_foreign: tx.amount_foreign,
        currency_code_foreign: tx.currency_code_foreign,
        transaction_description: tx.transaction_description,
        goods_description: tx.goods_description,
        late_deposit: tx.late_deposit,
        comments: tx.comments,
      })
      .select("id")
      .single();
    if (newTx) {
      for (const party of tx.transaction_parties ?? []) {
        await supabase.from("transaction_parties").insert({
          transaction_id: newTx.id,
          direction: party.direction,
          party_type: party.party_type,
          person_id: party.person_id ? personIdMap.get(party.person_id) ?? null : null,
          entity_id: party.entity_id ? entityIdMap.get(party.entity_id) ?? null : null,
          account_id: party.account_id ? accountIdMap.get(party.account_id) ?? null : null,
        });
      }
    }
  }

  // Copy indicators
  const indicators = indicatorsRes.data ?? [];
  if (indicators.length > 0) {
    await supabase.from("report_indicators").insert(
      indicators.map((ind) => ({
        report_id: newReportId,
        indicator_code: ind.indicator_code,
        description: ind.description,
      }))
    );
  }

  revalidatePath("/reports");
  revalidatePath(`/reports/${originalReportId}`);
  return { success: true, newReportId };
}

export async function getReportAmendmentChain(reportId: string) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return { error: ctx.error, data: [] as never[] };
  const { supabase, profile } = ctx;

  // Walk back to root
  let currentId: string = reportId;
  let rootId: string = reportId;
  for (let i = 0; i < 20; i++) {
    const parentRes = await supabase
      .from("reports")
      .select("amends_report_id")
      .eq("id", currentId)
      .eq("organisation_id", profile.organisation_id)
      .single();
    const parentId = parentRes.data?.amends_report_id;
    if (!parentId) { rootId = currentId; break; }
    currentId = parentId;
    rootId = currentId;
  }

  // Fetch the whole chain starting from root (walk forward up to 20 versions)
  type ChainRow = { id: string; entity_reference: string; version: number; status: string; submission_code: string; submitted_at: string | null; created_at: string };
  const chain: ChainRow[] = [];
  let walkId: string | null = rootId;
  for (let j = 0; j < 20 && walkId; j++) {
    const rowRes = await supabase
      .from("reports")
      .select("id, entity_reference, version, status, submission_code, submitted_at, created_at")
      .eq("id", walkId)
      .eq("organisation_id", profile.organisation_id)
      .single();
    if (!rowRes.data) break;
    chain.push(rowRes.data as ChainRow);
    const childQuery = supabase
      .from("reports")
      .select("id")
      .eq("amends_report_id", walkId)
      .eq("organisation_id", profile.organisation_id)
      .order("version", { ascending: true })
      .limit(1)
      .maybeSingle();
    const childRes: { data: { id: string } | null } = await childQuery;
    walkId = childRes.data?.id ?? null;
  }

  return { data: chain };
}
