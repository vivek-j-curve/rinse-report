import type { GoAMLReport } from "./types";

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export function validateGoAMLReport(report: GoAMLReport): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!report.rentity_id || report.rentity_id < 1) {
    errors.push({
      field: "rentity_id",
      message: "Reporting entity ID is required and must be positive",
      severity: "error",
    });
  }

  if (!report.submission_code || !["E", "M"].includes(report.submission_code)) {
    errors.push({
      field: "submission_code",
      message: "Submission code must be 'E' (Electronic) or 'M' (Manual)",
      severity: "error",
    });
  }

  const validReportCodes = ["STR", "SAR", "LCT", "IFT", "AIF", "BCR"];
  if (!report.report_code || !validReportCodes.includes(report.report_code)) {
    errors.push({
      field: "report_code",
      message: `Report code must be one of: ${validReportCodes.join(", ")}`,
      severity: "error",
    });
  }

  if (!report.entity_reference || report.entity_reference.length === 0) {
    errors.push({
      field: "entity_reference",
      message: "Entity reference is required",
      severity: "error",
    });
  }
  if (report.entity_reference && report.entity_reference.length > 255) {
    errors.push({
      field: "entity_reference",
      message: "Entity reference must be 255 characters or less",
      severity: "error",
    });
  }

  if (!report.report_date || !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(report.report_date)) {
    errors.push({
      field: "report_date",
      message: "Report date is required in YYYY-MM-DDTHH:MM:SS format",
      severity: "error",
    });
  }

  if (!report.currency_code_local || report.currency_code_local.length !== 3) {
    errors.push({
      field: "currency_code_local",
      message: "Local currency code is required (3-letter ISO code)",
      severity: "error",
    });
  }

  if (report.report_indicators.length === 0) {
    errors.push({
      field: "report_indicators",
      message: "At least one report indicator is required",
      severity: "error",
    });
  }

  const needsTransactions =
    report.report_code === "STR" ||
    report.report_code === "LCT" ||
    report.report_code === "IFT";

  if (needsTransactions && report.transactions.length === 0 && !report.activity) {
    errors.push({
      field: "transactions",
      message: `${report.report_code} reports require at least one transaction`,
      severity: "error",
    });
  }

  if (
    report.report_code === "SAR" &&
    report.transactions.length === 0 &&
    !report.activity
  ) {
    errors.push({
      field: "activity",
      message: "SAR reports require either transactions or an activity section with report parties",
      severity: "error",
    });
  }

  for (let i = 0; i < report.transactions.length; i++) {
    const tx = report.transactions[i];
    const prefix = `transactions[${i}]`;

    if (!tx.transactionnumber) {
      errors.push({
        field: `${prefix}.transactionnumber`,
        message: "Transaction number is required",
        severity: "error",
      });
    }
    if (tx.transactionnumber && tx.transactionnumber.length > 100) {
      errors.push({
        field: `${prefix}.transactionnumber`,
        message: "Transaction number must be 100 characters or less",
        severity: "error",
      });
    }

    if (!tx.transaction_location) {
      errors.push({
        field: `${prefix}.transaction_location`,
        message: "Transaction location is required",
        severity: "error",
      });
    }

    if (
      !tx.date_transaction ||
      !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(tx.date_transaction)
    ) {
      errors.push({
        field: `${prefix}.date_transaction`,
        message: "Transaction date is required in YYYY-MM-DDTHH:MM:SS format",
        severity: "error",
      });
    }

    if (!tx.transmode_code) {
      errors.push({
        field: `${prefix}.transmode_code`,
        message: "Transaction mode code is required",
        severity: "error",
      });
    }

    if (tx.amount_local === undefined || tx.amount_local === null) {
      errors.push({
        field: `${prefix}.amount_local`,
        message: "Local amount is required",
        severity: "error",
      });
    }

    if (!tx.t_from && !tx.t_from_my_client) {
      errors.push({
        field: `${prefix}.from`,
        message: "Transaction requires a 'from' party",
        severity: "warning",
      });
    }

    if (!tx.t_to && !tx.t_to_my_client) {
      errors.push({
        field: `${prefix}.to`,
        message: "Transaction requires a 'to' party",
        severity: "warning",
      });
    }
  }

  if (report.reason && report.reason.length > 8000) {
    errors.push({
      field: "reason",
      message: "Reason text must be 8000 characters or less",
      severity: "error",
    });
  }

  return errors;
}
