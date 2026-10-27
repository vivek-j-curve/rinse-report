import PDFDocument from "pdfkit";

// ── Colour palette (matches app theme tokens) ──────────────────────────────
const C = {
  black: "#0f0f0f",
  text: "#1a1a1a",
  muted: "#6b7280",
  border: "#e5e7eb",
  accent: "#2563eb",
  red: "#dc2626",
  green: "#16a34a",
  amber: "#d97706",
  bg: "#f9fafb",
};

// ── Fonts: pdfkit ships with Helvetica family ──────────────────────────────
const FONT = {
  regular: "Helvetica",
  bold: "Helvetica-Bold",
  oblique: "Helvetica-Oblique",
};

export interface PdfReportData {
  entityReference: string;
  reportType: string;
  reportCode: string;
  submissionCode: string;
  version: number;
  generatedAt: string;
  status: string;

  caseNumber: string;
  caseTitle: string;
  slaDeadline?: string | null;

  reportingEntityName: string;
  rentityId: string;
  localCurrency: string;
  complianceOfficer: string;

  reason?: string;
  action?: string;
  fiuRefNumber?: string;

  persons: {
    first_name: string;
    last_name: string;
    middle_name?: string | null;
    title?: string | null;
    gender?: string | null;
    birthdate?: string | null;
    nationality?: string | null;
    residence?: string | null;
    occupation?: string | null;
    is_my_client: boolean;
    role?: string | null;
  }[];

  entities: {
    name: string;
    commercial_name?: string | null;
    incorporation_legal_form?: string | null;
    incorporation_number?: string | null;
    business_type?: string | null;
    incorporation_country?: string | null;
    is_my_client: boolean;
    role?: string | null;
  }[];

  transactions: {
    transaction_number: string;
    transaction_location: string;
    date_transaction: string;
    transmode_code: string;
    amount_local: number;
    currency_code_local?: string;
    amount_foreign?: number | null;
    currency_code_foreign?: string | null;
    transaction_description?: string | null;
    transaction_parties?: {
      direction: string;
      party_type: string;
    }[];
  }[];

  indicators: { indicator_code: string }[];
}

function pdfPromise(draw: (doc: InstanceType<typeof PDFDocument>) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margins: { top: 50, left: 50, bottom: 50, right: 70 }, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    draw(doc);
    doc.end();
  });
}

function hr(doc: InstanceType<typeof PDFDocument>, y?: number) {
  const yPos = y ?? doc.y;
  doc
    .moveTo(50, yPos)
    .lineTo(doc.page.width - 70, yPos)
    .strokeColor(C.border)
    .lineWidth(0.5)
    .stroke();
}

function sectionTitle(doc: InstanceType<typeof PDFDocument>, text: string) {
  doc.moveDown(0.6);
  doc
    .fontSize(9)
    .font(FONT.bold)
    .fillColor(C.muted)
    .text(text.toUpperCase(), 50, doc.y, { characterSpacing: 0.8 });
  hr(doc, doc.y + 3);
  doc.moveDown(0.4);
}

function kv(
  doc: InstanceType<typeof PDFDocument>,
  label: string,
  value: string | null | undefined,
  opts?: { indent?: number }
) {
  if (!value) return;
  const x = 50 + (opts?.indent ?? 0);
  const labelW = 130;
  const startY = doc.y;
  doc
    .fontSize(8.5)
    .font(FONT.bold)
    .fillColor(C.muted)
    .text(label, x, startY, { width: labelW, lineBreak: false });
  doc
    .fontSize(8.5)
    .font(FONT.regular)
    .fillColor(C.text)
    .text(value, x + labelW, startY, { width: doc.page.width - 70 - x - labelW });
  doc.moveDown(0.15);
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-NZ", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return s;
  }
}

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function buildReportPdf(data: PdfReportData): Promise<Buffer> {
  return pdfPromise((doc) => {
    const pageW = doc.page.width;
    const contentW = pageW - 120; // 50 left + 70 right margin

    // ── Header bar ──────────────────────────────────────────────────────────
    doc
      .rect(0, 0, pageW, 80)
      .fill(C.accent);

    doc
      .fontSize(18)
      .font(FONT.bold)
      .fillColor("#ffffff")
      .text("goAML Report Summary", 50, 22, { width: contentW - 160 });

    // Report type badge (top-right)
    const badge = data.reportType;
    const badgeW = 52;
    doc
      .roundedRect(pageW - 50 - badgeW, 22, badgeW, 22, 4)
      .fillOpacity(0.25)
      .fill("#ffffff")
      .fillOpacity(1);
    doc
      .fontSize(10)
      .font(FONT.bold)
      .fillColor("#ffffff")
      .text(badge, pageW - 50 - badgeW, 29, { width: badgeW, align: "center" });

    doc
      .fontSize(9)
      .font(FONT.regular)
      .fillColor("rgba(255,255,255,0.85)")
      .text(`${data.entityReference}  ·  v${data.version}  ·  Generated ${formatDate(data.generatedAt)}`, 50, 52, { width: contentW });

    doc.y = 100;

    // ── Report details ───────────────────────────────────────────────────────
    sectionTitle(doc, "Report Details");

    kv(doc, "Reference", data.entityReference);
    kv(doc, "Report Type", `${data.reportType} (${data.reportCode})`);
    kv(doc, "Submission Mode", data.submissionCode === "E" ? "Electronic" : "Manual");
    kv(doc, "Status", data.status.charAt(0).toUpperCase() + data.status.slice(1));
    if (data.fiuRefNumber) kv(doc, "FIU Reference", data.fiuRefNumber);
    kv(doc, "Case Number", data.caseNumber);
    kv(doc, "Case Title", data.caseTitle);
    if (data.slaDeadline) kv(doc, "SLA Deadline", formatDate(data.slaDeadline));

    // ── Reporting entity ─────────────────────────────────────────────────────
    sectionTitle(doc, "Reporting Entity");
    kv(doc, "Entity ID", data.rentityId);
    kv(doc, "Local Currency", data.localCurrency);
    kv(doc, "Compliance Officer", data.complianceOfficer);

    // ── Reason for suspicion ─────────────────────────────────────────────────
    if (data.reason) {
      sectionTitle(doc, "Reason for Suspicion");
      doc
        .fontSize(8.5)
        .font(FONT.regular)
        .fillColor(C.text)
        .text(data.reason, 50, doc.y, { width: contentW, lineGap: 2 });
      doc.moveDown(0.3);
    }

    if (data.action) {
      sectionTitle(doc, "Action Taken");
      doc
        .fontSize(8.5)
        .font(FONT.regular)
        .fillColor(C.text)
        .text(data.action, 50, doc.y, { width: contentW, lineGap: 2 });
      doc.moveDown(0.3);
    }

    // ── Persons ──────────────────────────────────────────────────────────────
    if (data.persons.length > 0) {
      sectionTitle(doc, `Persons (${data.persons.length})`);
      for (const [i, p] of data.persons.entries()) {
        const name = [p.title, p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ");
        doc
          .fontSize(9)
          .font(FONT.bold)
          .fillColor(C.text)
          .text(`${i + 1}. ${name}`, 50, doc.y, { width: contentW });
        doc.moveDown(0.1);
        kv(doc, "Role", p.role ? p.role.replace(/_/g, " ") : null, { indent: 12 });
        kv(doc, "Client", p.is_my_client ? "Yes — my client" : "No — counterparty", { indent: 12 });
        kv(doc, "Gender", p.gender === "M" ? "Male" : p.gender === "F" ? "Female" : p.gender, { indent: 12 });
        kv(doc, "Date of Birth", formatDate(p.birthdate), { indent: 12 });
        kv(doc, "Nationality", p.nationality, { indent: 12 });
        kv(doc, "Residence", p.residence, { indent: 12 });
        kv(doc, "Occupation", p.occupation, { indent: 12 });
        doc.moveDown(0.4);
      }
    }

    // ── Entities ─────────────────────────────────────────────────────────────
    if (data.entities.length > 0) {
      sectionTitle(doc, `Entities (${data.entities.length})`);
      for (const [i, e] of data.entities.entries()) {
        doc
          .fontSize(9)
          .font(FONT.bold)
          .fillColor(C.text)
          .text(`${i + 1}. ${e.name}`, 50, doc.y, { width: contentW });
        doc.moveDown(0.1);
        if (e.commercial_name) kv(doc, "Trading As", e.commercial_name, { indent: 12 });
        kv(doc, "Role", e.role ? e.role.replace(/_/g, " ") : null, { indent: 12 });
        kv(doc, "Client", e.is_my_client ? "Yes — my client" : "No — counterparty", { indent: 12 });
        kv(doc, "Legal Form", e.incorporation_legal_form, { indent: 12 });
        kv(doc, "Registration No.", e.incorporation_number, { indent: 12 });
        kv(doc, "Incorporation Country", e.incorporation_country, { indent: 12 });
        kv(doc, "Business Type", e.business_type, { indent: 12 });
        doc.moveDown(0.4);
      }
    }

    // ── Transactions ─────────────────────────────────────────────────────────
    if (data.transactions.length > 0) {
      sectionTitle(doc, `Transactions (${data.transactions.length})`);
      for (const [i, tx] of data.transactions.entries()) {
        doc
          .fontSize(9)
          .font(FONT.bold)
          .fillColor(C.text)
          .text(`${i + 1}. ${tx.transaction_number}`, 50, doc.y, { width: contentW });
        doc.moveDown(0.1);
        kv(doc, "Date", formatDate(tx.date_transaction), { indent: 12 });
        kv(doc, "Amount", formatMoney(tx.amount_local, tx.currency_code_local ?? data.localCurrency), { indent: 12 });
        if (tx.amount_foreign && tx.currency_code_foreign) {
          kv(doc, "Foreign Amount", formatMoney(tx.amount_foreign, tx.currency_code_foreign), { indent: 12 });
        }
        kv(doc, "Location", tx.transaction_location, { indent: 12 });
        kv(doc, "Mode", tx.transmode_code, { indent: 12 });
        if (tx.transaction_description) kv(doc, "Description", tx.transaction_description, { indent: 12 });
        const parties = tx.transaction_parties ?? [];
        const fromCount = parties.filter((p) => p.direction === "from").length;
        const toCount = parties.filter((p) => p.direction === "to").length;
        if (fromCount || toCount) {
          kv(doc, "Parties", `${fromCount} sender(s), ${toCount} recipient(s)`, { indent: 12 });
        }
        doc.moveDown(0.4);
      }
    }

    // ── Indicators ───────────────────────────────────────────────────────────
    if (data.indicators.length > 0) {
      sectionTitle(doc, `Suspicion Indicators (${data.indicators.length})`);
      const codes = data.indicators.map((i) => i.indicator_code).join("  ·  ");
      doc
        .fontSize(8.5)
        .font(FONT.regular)
        .fillColor(C.text)
        .text(codes, 50, doc.y, { width: contentW, lineGap: 2 });
      doc.moveDown(0.4);
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 40;
    doc
      .fontSize(7.5)
      .font(FONT.regular)
      .fillColor(C.muted)
      .text(
        `Generated ${data.generatedAt}  ·  ${data.entityReference}  ·  CONFIDENTIAL — AML/CFT FILING`,
        50,
        footerY,
        { width: contentW, align: "center" }
      );
  });
}
