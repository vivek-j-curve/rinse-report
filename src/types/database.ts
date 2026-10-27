import type { Database } from "./supabase";
export type { Database };

export type UserRole = "owner" | "admin" | "analyst" | "viewer";
export type ReportType = "STR" | "SAR" | "LCT" | "IFT";
export type SuspicionStatus =
  | "draft"
  | "raised"
  | "investigating"
  | "to_file"
  | "filed"
  | "resolved";
export type CasePriority = "low" | "medium" | "high" | "critical";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled";
export type ReportStatus =
  | "draft"
  | "validated"
  | "submitted"
  | "accepted"
  | "rejected";
export type QuestionnaireStatus = "draft" | "complete" | "submitted";
export type IndustryType =
  | "law_firm"
  | "accountant"
  | "real_estate"
  | "tcsp"
  | "money_remitter"
  | "currency_exchanger"
  | "non_bank_deposit_taker"
  | "lender"
  | "payment_service_provider"
  | "wealth_provider"
  | "casino"
  | "other";

export type Tables = Database["public"]["Tables"];
export type Organisation = Tables["organisations"]["Row"];
export type ReportingEntity = Tables["reporting_entities"]["Row"];
export type Profile = Tables["profiles"]["Row"];
export type Case = Tables["cases"]["Row"];
export type Suspicion = Tables["suspicions"]["Row"];
export type Report = Tables["reports"]["Row"];
export type QuestionnaireResponse = Tables["questionnaire_responses"]["Row"];
export type ReportTemplate = Tables["report_templates"]["Row"];
export type Attachment = Tables["attachments"]["Row"];
export type AuditLogEntry = Tables["audit_log"]["Row"];
export type Notification = Tables["notifications"]["Row"];
