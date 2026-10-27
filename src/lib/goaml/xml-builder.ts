import { create } from "xmlbuilder2";
import type {
  GoAMLReport,
  GoAMLTransaction,
  GoAMLTransactionSide,
  GoAMLAccount,
  GoAMLPerson,
  GoAMLEntity,
  GoAMLPhone,
  GoAMLAddress,
  GoAMLPersonIdentification,
  GoAMLActivity,
} from "./types";

export function buildGoAMLXml(report: GoAMLReport): string {
  const doc = create({ version: "1.0", encoding: "UTF-8" });
  const root = doc.ele("report");

  root.ele("rentity_id").txt(String(report.rentity_id));
  if (report.rentity_branch) {
    root.ele("rentity_branch").txt(report.rentity_branch);
  }
  root.ele("submission_code").txt(report.submission_code);
  root.ele("report_code").txt(report.report_code);
  root.ele("entity_reference").txt(report.entity_reference);
  if (report.fiu_ref_number) {
    root.ele("fiu_ref_number").txt(report.fiu_ref_number);
  }
  root.ele("report_date").txt(report.report_date);
  root.ele("currency_code_local").txt(report.currency_code_local);

  if (report.reporting_person) {
    const rp = root.ele("reporting_person");
    writeReportingPerson(rp, report.reporting_person);
  }

  if (report.location) {
    writeAddress(root.ele("location"), report.location);
  }

  if (report.reason) {
    root.ele("reason").txt(report.reason);
  }
  if (report.action) {
    root.ele("action").txt(report.action);
  }

  if (report.transactions.length > 0) {
    for (const tx of report.transactions) {
      writeTransaction(root.ele("transaction"), tx);
    }
    if (report.activity) {
      writeActivity(root.ele("activity"), report.activity);
    }
  } else if (report.activity) {
    writeActivity(root.ele("activity"), report.activity);
  }

  const indicators = root.ele("report_indicators");
  for (const code of report.report_indicators) {
    indicators.ele("indicator").txt(code);
  }

  return doc.end({ prettyPrint: true });
}

function writeReportingPerson(
  node: ReturnType<ReturnType<typeof create>["ele"]>,
  person: GoAMLReport["reporting_person"] & {}
) {
  if (person.gender) node.ele("gender").txt(person.gender);
  if (person.title) node.ele("title").txt(person.title);
  node.ele("first_name").txt(person.first_name);
  if (person.middle_name) node.ele("middle_name").txt(person.middle_name);
  node.ele("last_name").txt(person.last_name);
  if (person.birthdate) node.ele("birthdate").txt(person.birthdate);
  if (person.nationality1) node.ele("nationality1").txt(person.nationality1);
  if (person.residence) node.ele("residence").txt(person.residence);
  if (person.phones?.length) {
    const phonesNode = node.ele("phones");
    for (const phone of person.phones) {
      writePhone(phonesNode.ele("phone"), phone);
    }
  }
  if (person.addresses?.length) {
    const addrsNode = node.ele("addresses");
    for (const addr of person.addresses) {
      writeAddress(addrsNode.ele("address"), addr);
    }
  }
  if (person.email) node.ele("email").txt(person.email);
  if (person.occupation) node.ele("occupation").txt(person.occupation);
}

function writeTransaction(
  node: ReturnType<ReturnType<typeof create>["ele"]>,
  tx: GoAMLTransaction
) {
  node.ele("transactionnumber").txt(tx.transactionnumber);
  if (tx.internal_ref_number) {
    node.ele("internal_ref_number").txt(tx.internal_ref_number);
  }
  node.ele("transaction_location").txt(tx.transaction_location);
  if (tx.transaction_description) {
    node.ele("transaction_description").txt(tx.transaction_description);
  }
  node.ele("date_transaction").txt(tx.date_transaction);
  if (tx.teller) node.ele("teller").txt(tx.teller);
  if (tx.authorized) node.ele("authorized").txt(tx.authorized);
  if (tx.late_deposit !== undefined) {
    node.ele("late_deposit").txt(tx.late_deposit ? "true" : "false");
    if (tx.date_posting) node.ele("date_posting").txt(tx.date_posting);
  }
  node.ele("transmode_code").txt(tx.transmode_code);
  if (tx.transmode_comment) {
    node.ele("transmode_comment").txt(tx.transmode_comment);
  }
  node.ele("amount_local").txt(String(tx.amount_local));

  if (tx.t_from_my_client) {
    writeTransactionSide(node.ele("t_from_my_client"), tx.t_from_my_client, "from");
  } else if (tx.t_from) {
    writeTransactionSide(node.ele("t_from"), tx.t_from, "from");
  }

  if (tx.t_to_my_client) {
    writeTransactionSide(node.ele("t_to_my_client"), tx.t_to_my_client, "to");
  } else if (tx.t_to) {
    writeTransactionSide(node.ele("t_to"), tx.t_to, "to");
  }

  if (tx.comments) node.ele("comments").txt(tx.comments);
}

function writeTransactionSide(
  node: ReturnType<ReturnType<typeof create>["ele"]>,
  side: GoAMLTransactionSide,
  direction: "from" | "to"
) {
  const prefix = direction === "from" ? "from" : "to";

  if (side.funds_code) {
    node.ele(`${prefix}_funds_code`).txt(side.funds_code);
  }
  if (side.funds_comment) {
    node.ele(`${prefix}_funds_comment`).txt(side.funds_comment);
  }
  if (side.foreign_currency) {
    const fc = node.ele(`${prefix}_foreign_currency`);
    fc.ele("foreign_currency_code").txt(side.foreign_currency.foreign_currency_code);
    fc.ele("foreign_amount").txt(String(side.foreign_currency.foreign_amount));
    if (side.foreign_currency.foreign_exchange_rate !== undefined) {
      fc.ele("foreign_exchange_rate").txt(
        String(side.foreign_currency.foreign_exchange_rate)
      );
    }
  }

  const countryField = direction === "from" ? "from_country" : "to_country";
  const countryValue = side.from_country ?? side.to_country;

  if (side.account) {
    const accountTag = side.is_my_client
      ? `${prefix}_account`
      : `${prefix}_account`;
    writeAccount(node.ele(accountTag), side.account, side.is_my_client);
  } else if (side.person) {
    const personTag = side.is_my_client
      ? `${prefix}_person`
      : `${prefix}_person`;
    writePerson(node.ele(personTag), side.person, side.is_my_client);
  } else if (side.entity) {
    const entityTag = side.is_my_client
      ? `${prefix}_entity`
      : `${prefix}_entity`;
    writeEntity(node.ele(entityTag), side.entity, side.is_my_client);
  }

  if (countryValue) {
    node.ele(countryField).txt(countryValue);
  }
}

function writeAccount(
  node: ReturnType<ReturnType<typeof create>["ele"]>,
  account: GoAMLAccount,
  isMyClient: boolean
) {
  node.ele("institution_name").txt(account.institution_name);
  if (account.swift) {
    node.ele("swift").txt(account.swift);
  } else if (account.institution_code) {
    node.ele("institution_code").txt(account.institution_code);
  }
  if (account.institution_country) {
    node.ele("institution_country").txt(account.institution_country);
  }
  if (account.non_bank_institution !== undefined) {
    node
      .ele("non_bank_institution")
      .txt(account.non_bank_institution ? "true" : "false");
  }
  node.ele("branch").txt(account.branch);
  node.ele("account").txt(account.account);
  if (account.currency_code) {
    node.ele("currency_code").txt(account.currency_code);
  }
  if (account.account_name) {
    node.ele("account_name").txt(account.account_name);
  }
  if (account.iban) node.ele("iban").txt(account.iban);
  if (account.client_number) {
    node.ele("client_number").txt(account.client_number);
  }
  if (account.personal_account_type) {
    node
      .ele("personal_account_type")
      .txt(account.personal_account_type);
  }
  if (account.t_entity) {
    writeEntity(node.ele("t_entity"), account.t_entity, isMyClient);
  }
  if (account.signatories?.length) {
    for (const sig of account.signatories) {
      const sigNode = node.ele("signatory");
      if (sig.is_primary) {
        sigNode.ele("is_primary").txt("1");
      }
      writePerson(sigNode.ele("t_person"), sig.t_person, isMyClient);
    }
  }
  if (account.opened) node.ele("opened").txt(account.opened);
  if (account.closed) node.ele("closed").txt(account.closed);
  if (account.balance !== undefined) {
    node.ele("balance").txt(String(account.balance));
    if (account.date_balance) {
      node.ele("date_balance").txt(account.date_balance);
    }
  }
  if (account.status_code) {
    node.ele("status_code").txt(account.status_code);
  }
  if (account.comments) node.ele("comments").txt(account.comments);
}

function writePerson(
  node: ReturnType<ReturnType<typeof create>["ele"]>,
  person: GoAMLPerson,
  isMyClient: boolean
) {
  if (isMyClient) {
    node.ele("gender").txt(person.gender ?? "-");
  } else if (person.gender) {
    node.ele("gender").txt(person.gender);
  }
  if (person.title) node.ele("title").txt(person.title);
  node.ele("first_name").txt(person.first_name);
  if (person.middle_name) node.ele("middle_name").txt(person.middle_name);
  if (person.prefix) node.ele("prefix").txt(person.prefix);
  node.ele("last_name").txt(person.last_name);
  if (isMyClient) {
    node.ele("birthdate").txt(person.birthdate ?? "1900-01-01T00:00:00");
  } else if (person.birthdate) {
    node.ele("birthdate").txt(person.birthdate);
  }
  if (person.birth_place) node.ele("birth_place").txt(person.birth_place);
  if (person.mothers_name) node.ele("mothers_name").txt(person.mothers_name);
  if (person.ssn) node.ele("ssn").txt(person.ssn);
  if (person.passport_number) {
    node.ele("passport_number").txt(person.passport_number);
    if (person.passport_country) {
      node.ele("passport_country").txt(person.passport_country);
    }
  }
  if (person.id_number) node.ele("id_number").txt(person.id_number);
  if (person.nationality1) node.ele("nationality1").txt(person.nationality1);
  if (person.nationality2) node.ele("nationality2").txt(person.nationality2);
  if (person.nationality3) node.ele("nationality3").txt(person.nationality3);
  if (person.residence) node.ele("residence").txt(person.residence);
  if (person.phones?.length) {
    const phonesNode = node.ele("phones");
    for (const phone of person.phones) {
      writePhone(phonesNode.ele("phone"), phone);
    }
  }
  if (person.addresses?.length) {
    const addrsNode = node.ele("addresses");
    for (const addr of person.addresses) {
      writeAddress(addrsNode.ele("address"), addr);
    }
  }
  if (person.email) node.ele("email").txt(person.email);
  if (person.occupation) node.ele("occupation").txt(person.occupation);
  if (person.employer_name) {
    node.ele("employer_name").txt(person.employer_name);
  }
  if (person.identifications?.length) {
    for (const id of person.identifications) {
      writePersonIdentification(node.ele("identification"), id);
    }
  }
  if (person.source_of_wealth) {
    node.ele("source_of_wealth").txt(person.source_of_wealth);
  }
  if (person.comments) node.ele("comments").txt(person.comments);
}

function writeEntity(
  node: ReturnType<ReturnType<typeof create>["ele"]>,
  entity: GoAMLEntity,
  _isMyClient: boolean
) {
  node.ele("name").txt(entity.name);
  if (entity.commercial_name) {
    node.ele("commercial_name").txt(entity.commercial_name);
  }
  if (entity.incorporation_legal_form) {
    node
      .ele("incorporation_legal_form")
      .txt(entity.incorporation_legal_form);
  }
  if (entity.incorporation_number) {
    node.ele("incorporation_number").txt(entity.incorporation_number);
  }
  if (entity.business) node.ele("business").txt(entity.business);
  if (entity.phones?.length) {
    const phonesNode = node.ele("phones");
    for (const phone of entity.phones) {
      writePhone(phonesNode.ele("phone"), phone);
    }
  }
  if (entity.addresses?.length) {
    const addrsNode = node.ele("addresses");
    for (const addr of entity.addresses) {
      writeAddress(addrsNode.ele("address"), addr);
    }
  }
  if (entity.email) node.ele("email").txt(entity.email);
  if (entity.incorporation_state) {
    node.ele("incorporation_state").txt(entity.incorporation_state);
  }
  if (entity.incorporation_country_code) {
    node
      .ele("incorporation_country_code")
      .txt(entity.incorporation_country_code);
  }
  if (entity.director_ids?.length) {
    for (const director of entity.director_ids) {
      const dirNode = node.ele("director_id");
      writePerson(dirNode, director, false);
    }
  }
  if (entity.incorporation_date) {
    node.ele("incorporation_date").txt(entity.incorporation_date);
  }
  if (entity.tax_number) node.ele("tax_number").txt(entity.tax_number);
  if (entity.tax_reg_number) {
    node.ele("tax_reg_number").txt(entity.tax_reg_number);
  }
  if (entity.comments) node.ele("comments").txt(entity.comments);
}

function writePersonIdentification(
  node: ReturnType<ReturnType<typeof create>["ele"]>,
  id: GoAMLPersonIdentification
) {
  node.ele("type").txt(id.type);
  node.ele("number").txt(id.number);
  if (id.issue_date) node.ele("issue_date").txt(id.issue_date);
  if (id.expiry_date) node.ele("expiry_date").txt(id.expiry_date);
  if (id.issued_by) node.ele("issued_by").txt(id.issued_by);
  node.ele("issue_country").txt(id.issue_country);
  if (id.comments) node.ele("comments").txt(id.comments);
}

function writePhone(
  node: ReturnType<ReturnType<typeof create>["ele"]>,
  phone: GoAMLPhone
) {
  node.ele("tph_contact_type").txt(phone.tph_contact_type);
  node.ele("tph_communication_type").txt(phone.tph_communication_type);
  if (phone.tph_country_prefix) {
    node.ele("tph_country_prefix").txt(phone.tph_country_prefix);
  }
  node.ele("tph_number").txt(phone.tph_number);
  if (phone.tph_extension) {
    node.ele("tph_extension").txt(phone.tph_extension);
  }
  if (phone.comments) node.ele("comments").txt(phone.comments);
}

function writeAddress(
  node: ReturnType<ReturnType<typeof create>["ele"]>,
  addr: GoAMLAddress
) {
  node.ele("address_type").txt(addr.address_type);
  node.ele("address").txt(addr.address);
  if (addr.town) node.ele("town").txt(addr.town);
  node.ele("city").txt(addr.city);
  if (addr.zip) node.ele("zip").txt(addr.zip);
  node.ele("country_code").txt(addr.country_code);
  if (addr.state) node.ele("state").txt(addr.state);
  if (addr.comments) node.ele("comments").txt(addr.comments);
}

function writeActivity(
  node: ReturnType<ReturnType<typeof create>["ele"]>,
  activity: GoAMLActivity
) {
  const partiesNode = node.ele("report_parties");
  for (const party of activity.report_parties) {
    const partyNode = partiesNode.ele("report_party");
    if (party.person_my_client) {
      writePerson(partyNode.ele("person_my_client"), party.person_my_client, true);
    } else if (party.person) {
      writePerson(partyNode.ele("person"), party.person, false);
    } else if (party.account_my_client) {
      writeAccount(partyNode.ele("account_my_client"), party.account_my_client, true);
    } else if (party.account) {
      writeAccount(partyNode.ele("account"), party.account, false);
    } else if (party.entity_my_client) {
      writeEntity(partyNode.ele("entity_my_client"), party.entity_my_client, true);
    } else if (party.entity) {
      writeEntity(partyNode.ele("entity"), party.entity, false);
    }
  }
}
