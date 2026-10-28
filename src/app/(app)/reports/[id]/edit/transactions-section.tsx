"use client";

import { useState } from "react";
import { Plus, X } from "@/components/ui/icons";
import { CurrencySelect } from "@/components/ui/currency-select";
import {
  saveTransaction,
  deleteTransaction,
  saveTransactionParty,
  deleteTransactionParty,
  saveAccount,
  saveEntity,
} from "@/lib/actions/reports";
import { FundsTypeSelect } from "@/components/ui/funds-type-select";
import { NZ_INSTITUTIONS, lookupInstitution } from "@/lib/nz-institutions";

type AccountRecord = {
  id: string;
  institution_name: string;
  branch: string | null;
  account_number: string;
  institution_code: string | null;
  institution_code_type: string | null;
  currency_code: string | null;
  account_type: string | null;
  is_my_client: boolean;
  person_id: string | null;
  entity_id: string | null;
  comments: string | null;
};

type TransactionPartyRecord = {
  id: string;
  direction: "from" | "to";
  party_type: string;
  person_id: string | null;
  entity_id: string | null;
  account_id: string | null;
};

type TransactionRecord = {
  id: string;
  transaction_number: string;
  transaction_location: string;
  transaction_description: string | null;
  date_transaction: string;
  transmode_code: string;
  transmode_comment: string | null;
  amount_local: number;
  currency_code_local: string;
  amount_foreign: number | null;
  currency_code_foreign: string | null;
  late_deposit: boolean;
  comments: string | null;
  transaction_parties: TransactionPartyRecord[];
};

type PersonRecord = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
};

type EntityRecord = {
  id: string;
  name: string;
  role?: string | null;
};

type TransactionForm = {
  id?: string;
  transaction_number: string;
  transaction_location: string;
  transaction_description: string;
  date_transaction: string;
  transmode_code: string;
  transmode_comment: string;
  amount_local: string;
  currency_code_local: string;
  amount_foreign: string;
  currency_code_foreign: string;
  late_deposit: boolean;
  comments: string;
};

type AccountForm = {
  institution_name: string;
  branch: string;
  account_number: string;
  institution_code: string;
  institution_code_type: string;
  currency_code: string;
  funds_code: string;
  is_my_client: boolean;
  person_id: string;
  entity_id: string;
};

const EMPTY_TX: TransactionForm = {
  transaction_number: "",
  transaction_location: "",
  transaction_description: "",
  date_transaction: "",
  transmode_code: "",
  transmode_comment: "",
  amount_local: "",
  currency_code_local: "NZD",
  amount_foreign: "",
  currency_code_foreign: "",
  late_deposit: false,
  comments: "",
};

const EMPTY_ACCOUNT: AccountForm = {
  institution_name: "",
  branch: "",
  account_number: "",
  institution_code: "",
  institution_code_type: "nz_bank_prefix",
  currency_code: "NZD",
  funds_code: "",
  is_my_client: false,
  person_id: "",
  entity_id: "",
};

// XSD conduction_type codes (channel - action)
const TRANSMODE_OPTIONS = [
  { value: "-",  label: "Unknown" },
  // ATM
  { value: "C",  label: "ATM - Deposit" },
  { value: "J",  label: "ATM - Withdrawal" },
  { value: "B",  label: "ATM - Currency exchange" },
  { value: "A",  label: "ATM - Unknown" },
  // EFTPOS
  { value: "AC", label: "EFTPOS - Purchase" },
  { value: "EP", label: "EFTPOS - Deposit" },
  { value: "AG", label: "EFTPOS - Withdrawal" },
  { value: "AA", label: "EFTPOS - Other" },
  // Electronic
  { value: "AL", label: "Electronic - Deposit" },
  { value: "AX", label: "Electronic - Transfer (to other party)" },
  { value: "AY", label: "Electronic - Transfer (to self, other account)" },
  { value: "BA", label: "Electronic - Wire transfer" },
  { value: "BB", label: "Electronic - Withdrawal" },
  { value: "AI", label: "Electronic - Credit card purchase" },
  { value: "AJ", label: "Electronic - Currency exchange" },
  { value: "AQ", label: "Electronic - Other" },
  { value: "AH", label: "Electronic - Unknown" },
  // In-branch / Office
  { value: "BG", label: "In-branch - Deposit" },
  { value: "BV", label: "In-branch - Wire transfer" },
  { value: "BW", label: "In-branch - Withdrawal" },
  { value: "BS", label: "In-branch - Transfer (to other party)" },
  { value: "BT", label: "In-branch - Transfer (to self, other account)" },
  { value: "BE", label: "In-branch - Currency exchange" },
  { value: "BD", label: "In-branch - Credit card purchase" },
  { value: "BL", label: "In-branch - Other" },
  { value: "BC", label: "In-branch - Unknown" },
  // Internet Banking
  { value: "IB", label: "Internet Banking" },
  // Phone Banking
  { value: "DR", label: "Phone Banking - Wire transfer" },
  { value: "DB", label: "Phone Banking - Deposit" },
  { value: "DS", label: "Phone Banking - Withdrawal" },
  { value: "DN", label: "Phone Banking - Transfer (to other party)" },
  { value: "DG", label: "Phone Banking - Other" },
  { value: "CX", label: "Phone Banking - Unknown" },
  // Other
  { value: "CV", label: "Other - Wire transfer" },
  { value: "CF", label: "Other - Deposit" },
  { value: "CW", label: "Other - Withdrawal" },
  { value: "CK", label: "Other - Other" },
  { value: "CB", label: "Other - Unknown" },
];

const INST_CODE_TYPES = [
  { value: "swift", label: "SWIFT / BIC" },
  { value: "nz_bank_prefix", label: "NZ Bank Prefix" },
];

export function TransactionsSection({
  reportId,
  transactions,
  persons,
  entities,
  accounts,
  onUpdate,
}: {
  reportId: string;
  transactions: Record<string, unknown>[];
  persons: Record<string, unknown>[];
  entities?: Record<string, unknown>[];
  accounts: Record<string, unknown>[];
  onUpdate: () => void;
}) {
  const typedTx = transactions as unknown as TransactionRecord[];
  const typedPersons = persons as unknown as PersonRecord[];
  const typedEntities = (entities ?? []) as unknown as EntityRecord[];
  const typedAccounts = accounts as unknown as AccountRecord[];
  const [editing, setEditing] = useState<TransactionForm | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startNew() {
    const nextNum = `TXN-${String(typedTx.length + 1).padStart(3, "0")}`;
    setEditing({ ...EMPTY_TX, transaction_number: nextNum });
    setExpandedId(null);
  }

  function startEdit(tx: TransactionRecord) {
    setEditing({
      id: tx.id,
      transaction_number: tx.transaction_number,
      transaction_location: tx.transaction_location,
      transaction_description: tx.transaction_description ?? "",
      date_transaction: tx.date_transaction,
      transmode_code: tx.transmode_code,
      transmode_comment: tx.transmode_comment ?? "",
      amount_local: String(tx.amount_local),
      currency_code_local: tx.currency_code_local,
      amount_foreign: tx.amount_foreign ? String(tx.amount_foreign) : "",
      currency_code_foreign: tx.currency_code_foreign ?? "",
      late_deposit: tx.late_deposit,
      comments: tx.comments ?? "",
    });
    setExpandedId(null);
  }

  async function handleSave() {
    if (!editing) return;
    if (
      !editing.transaction_number ||
      !editing.transaction_location ||
      !editing.date_transaction ||
      !editing.transmode_code ||
      !editing.amount_local
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);
    setError(null);
    const res = await saveTransaction(reportId, {
      id: editing.id,
      transaction_number: editing.transaction_number,
      transaction_location: editing.transaction_location,
      transaction_description: editing.transaction_description || undefined,
      date_transaction: editing.date_transaction,
      transmode_code: editing.transmode_code,
      transmode_comment: editing.transmode_comment || undefined,
      amount_local: parseFloat(editing.amount_local),
      currency_code_local: editing.currency_code_local,
      amount_foreign: editing.amount_foreign
        ? parseFloat(editing.amount_foreign)
        : undefined,
      currency_code_foreign: editing.currency_code_foreign || undefined,
      late_deposit: editing.late_deposit,
      comments: editing.comments || undefined,
    });
    setSaving(false);

    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    const savedId = "id" in res ? (res as { id: string }).id : editing.id;
    setEditing(null);
    if (savedId) setExpandedId(savedId);
    onUpdate();
  }

  async function handleDelete(txId: string) {
    setSaving(true);
    await deleteTransaction(reportId, txId);
    setSaving(false);
    setExpandedId(null);
    onUpdate();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold">Transactions</h3>
          <p className="text-[12px] text-text-tertiary mt-0.5">
            Record each suspicious transaction with parties and counterparty details.
          </p>
        </div>
        {!editing && (
          <button
            onClick={startNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover transition-colors"
          >
            <Plus size={14} />
            Add Transaction
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-bg border border-red-border px-3 py-2 text-[13px] text-red mb-3">
          {error}
        </div>
      )}

      {/* Transaction form */}
      {editing && (
        <div className="border border-border rounded-lg p-4 mb-4 bg-surface-alt/30">
          <h4 className="text-[13px] font-semibold mb-3">
            {editing.id ? "Edit Transaction" : "New Transaction"}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">
                Transaction Number *
              </label>
              <input
                type="text"
                value={editing.transaction_number}
                onChange={(e) =>
                  setEditing({ ...editing, transaction_number: e.target.value })
                }
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">
                Date *
              </label>
              <input
                type="date"
                value={editing.date_transaction}
                onChange={(e) =>
                  setEditing({ ...editing, date_transaction: e.target.value })
                }
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">
                Location *
              </label>
              <input
                type="text"
                value={editing.transaction_location}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    transaction_location: e.target.value,
                  })
                }
                placeholder="e.g. Auckland CBD Branch"
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">
                Mode *
              </label>
              <select
                value={editing.transmode_code}
                onChange={(e) =>
                  setEditing({ ...editing, transmode_code: e.target.value })
                }
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              >
                <option value="">Select transaction mode...</option>
                {TRANSMODE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">
                Amount (Local) *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={editing.amount_local}
                  onChange={(e) =>
                    setEditing({ ...editing, amount_local: e.target.value })
                  }
                  placeholder="0.00"
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-[13px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>
              <div className="mt-1.5">
                <CurrencySelect
                  value={editing.currency_code_local}
                  onChange={(v) => setEditing({ ...editing, currency_code_local: v })}
                  placeholder="Select local currency..."
                />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">
                Amount (Foreign) (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={editing.amount_foreign}
                  onChange={(e) =>
                    setEditing({ ...editing, amount_foreign: e.target.value })
                  }
                  placeholder="0.00"
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-[13px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>
              <div className="mt-1.5">
                <CurrencySelect
                  value={editing.currency_code_foreign}
                  onChange={(v) => setEditing({ ...editing, currency_code_foreign: v })}
                  placeholder="Foreign currency (if applicable)..."
                />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-[12px] font-medium text-text-secondary mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={editing.transaction_description}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  transaction_description: e.target.value,
                })
              }
              placeholder="Describe the transaction..."
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
            />
          </div>
          <div className="mt-3">
            <label className="block text-[12px] font-medium text-text-secondary mb-1">
              Comments
            </label>
            <textarea
              rows={2}
              value={editing.comments}
              onChange={(e) =>
                setEditing({ ...editing, comments: e.target.value })
              }
              placeholder="Additional notes..."
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
            />
          </div>
          <div className="mt-3">
            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={editing.late_deposit}
                onChange={(e) =>
                  setEditing({ ...editing, late_deposit: e.target.checked })
                }
                className="rounded border-border"
              />
              Late deposit
            </label>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-[13px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Transaction"}
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setError(null);
              }}
              className="px-4 py-2 text-[13px] font-medium border border-border rounded-full hover:bg-surface-alt transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Transaction list */}
      {typedTx.length === 0 && !editing && (
        <div className="text-center py-10 text-text-tertiary border-2 border-dashed border-border rounded-lg">
          <p className="text-[13px] font-medium">No transactions added yet</p>
          <p className="text-[12px] mt-1">
            Each transaction needs a sender and a recipient.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {typedTx.map((tx) => {
          const isExpanded = expandedId === tx.id;

          return (
            <div
              key={tx.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              {(() => {
                const hasFrom = tx.transaction_parties.some((p) => p.direction === "from");
                const hasTo = tx.transaction_parties.some((p) => p.direction === "to");
                const missingParties = !hasFrom || !hasTo;
                return (
              <button
                onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-alt/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[12px] text-text-secondary">
                      {tx.transaction_number}
                    </span>
                    <span className="text-[13px] font-medium">
                      {tx.amount_local.toLocaleString("en-NZ", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      {tx.currency_code_local}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-alt border border-border text-text-secondary">
                      {TRANSMODE_OPTIONS.find(
                        (o) => o.value === tx.transmode_code
                      )?.label ?? tx.transmode_code}
                    </span>
                    {missingParties && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-bg border border-amber-border text-amber font-medium">
                        {!hasFrom && !hasTo ? "Sender & recipient missing" : !hasFrom ? "Sender missing" : "Recipient missing"}
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-text-tertiary mt-0.5">
                    {tx.date_transaction} · {tx.transaction_location}
                    {!missingParties && tx.transaction_parties.length > 0 && (
                      <span className="ml-2 text-text-tertiary">
                        · {tx.transaction_parties.length} {tx.transaction_parties.length === 1 ? "party" : "parties"}
                      </span>
                    )}
                  </div>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  className={`text-text-tertiary shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                >
                  <path
                    d="M4 6l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              );
              })()}

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-3 space-y-4">
                  {tx.transaction_description && (
                    <p className="text-[12.5px] text-text-secondary">
                      {tx.transaction_description}
                    </p>
                  )}

                  {/* Parties section */}
                  <div>
                    <p className="text-[12px] font-semibold text-text-secondary mb-3">
                      Sender & Recipient
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <PartySlot
                        label="From (Sender)"
                        direction="from"
                        txId={tx.id}
                        reportId={reportId}
                        party={tx.transaction_parties.find((p) => p.direction === "from") ?? null}
                        persons={typedPersons}
                        entities={typedEntities}
                        accounts={typedAccounts}
                        onUpdate={onUpdate}
                      />
                      <PartySlot
                        label="To (Recipient)"
                        direction="to"
                        txId={tx.id}
                        reportId={reportId}
                        party={tx.transaction_parties.find((p) => p.direction === "to") ?? null}
                        persons={typedPersons}
                        entities={typedEntities}
                        accounts={typedAccounts}
                        onUpdate={onUpdate}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-border">
                    <button
                      onClick={() => startEdit(tx)}
                      className="text-[12px] font-medium text-accent hover:underline"
                    >
                      Edit details
                    </button>
                    <span className="text-text-tertiary">·</span>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-[12px] font-medium text-red hover:underline"
                    >
                      Remove transaction
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type PartyMode = "idle" | "pick-person" | "pick-entity" | "add-entity" | "add-account";

type EntityForm = {
  name: string;
  role: "counterparty" | "conductor" | "signatory" | "director" | "beneficiary";
  is_my_client: boolean;
};

const EMPTY_ENTITY_FORM: EntityForm = {
  name: "",
  role: "counterparty",
  is_my_client: false,
};

const ENTITY_ROLES: { value: EntityForm["role"]; label: string }[] = [
  { value: "counterparty", label: "Counterparty" },
  { value: "conductor", label: "Conductor" },
  { value: "signatory", label: "Signatory" },
  { value: "director", label: "Director" },
  { value: "beneficiary", label: "Beneficiary" },
];

function PartySlot({
  label,
  direction,
  txId,
  reportId,
  party,
  persons,
  entities,
  accounts,
  onUpdate,
}: {
  label: string;
  direction: "from" | "to";
  txId: string;
  reportId: string;
  party: TransactionPartyRecord | null;
  persons: PersonRecord[];
  entities: EntityRecord[];
  accounts: AccountRecord[];
  onUpdate: () => void;
}) {
  const [mode, setMode] = useState<PartyMode>("idle");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [accountForm, setAccountForm] = useState<AccountForm>({ ...EMPTY_ACCOUNT });
  const [entityForm, setEntityForm] = useState<EntityForm>({ ...EMPTY_ENTITY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkedPerson = party?.person_id
    ? persons.find((p) => p.id === party.person_id)
    : null;
  const linkedEntity = party?.entity_id
    ? entities.find((e) => e.id === party.entity_id)
    : null;
  const linkedAccount = party?.account_id
    ? accounts.find((a) => a.id === party.account_id)
    : null;

  async function handleRemoveParty() {
    if (!party) return;
    setSaving(true);
    await deleteTransactionParty(party.id);
    setSaving(false);
    onUpdate();
  }

  async function handleLinkPerson() {
    if (!selectedPersonId) return;
    setSaving(true);
    setError(null);
    const res = await saveTransactionParty(txId, {
      id: party?.id,
      direction,
      party_type: "person",
      person_id: selectedPersonId,
    });
    setSaving(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    setMode("idle");
    setSelectedPersonId("");
    onUpdate();
  }

  async function handleLinkEntity() {
    if (!selectedEntityId) return;
    setSaving(true);
    setError(null);
    const res = await saveTransactionParty(txId, {
      id: party?.id,
      direction,
      party_type: "entity",
      entity_id: selectedEntityId,
    });
    setSaving(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    setMode("idle");
    setSelectedEntityId("");
    onUpdate();
  }

  async function handleSaveNewEntity() {
    if (!entityForm.name.trim()) {
      setError("Entity name is required");
      return;
    }
    setSaving(true);
    setError(null);
    const entityRes = await saveEntity(reportId, {
      name: entityForm.name.trim(),
      role: entityForm.role,
      is_my_client: entityForm.is_my_client,
    });
    if ("error" in entityRes && entityRes.error) {
      setSaving(false);
      setError(entityRes.error);
      return;
    }
    const partyRes = await saveTransactionParty(txId, {
      id: party?.id,
      direction,
      party_type: "entity",
      entity_id: entityRes.id,
    });
    setSaving(false);
    if ("error" in partyRes && partyRes.error) {
      setError(partyRes.error);
      return;
    }
    setMode("idle");
    setEntityForm({ ...EMPTY_ENTITY_FORM });
    onUpdate();
  }

  async function handleSaveAccount() {
    if (!accountForm.institution_name || !accountForm.account_number) {
      setError("Institution name and account number are required");
      return;
    }
    setSaving(true);
    setError(null);

    const accountRes = await saveAccount(reportId, {
      institution_name: accountForm.institution_name,
      branch: accountForm.branch || undefined,
      account_number: accountForm.account_number,
      institution_code: accountForm.institution_code || undefined,
      institution_code_type: (accountForm.institution_code_type || undefined) as
        | "swift" | "nz_bank_prefix"
        | undefined,
      currency_code: accountForm.currency_code || undefined,
      funds_code: accountForm.funds_code || undefined,
      is_my_client: accountForm.is_my_client,
      person_id: accountForm.person_id || undefined,
      entity_id: accountForm.entity_id || undefined,
    });

    if ("error" in accountRes && accountRes.error) {
      setSaving(false);
      setError(accountRes.error);
      return;
    }

    const partyRes = await saveTransactionParty(txId, {
      id: party?.id,
      direction,
      party_type: "account",
      account_id: accountRes.id,
    });

    setSaving(false);
    if ("error" in partyRes && partyRes.error) {
      setError(partyRes.error);
      return;
    }
    setMode("idle");
    setAccountForm({ ...EMPTY_ACCOUNT });
    onUpdate();
  }

  return (
    <div className="space-y-2">
      <h5 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
        {label}
      </h5>

      {/* Linked party display */}
      {party && (linkedPerson || linkedEntity || linkedAccount) && mode === "idle" && (
        <div className="rounded-lg border border-border bg-surface p-2.5 text-[12.5px]">
          {linkedPerson && (
            <div className="font-medium">
              {linkedPerson.first_name} {linkedPerson.last_name}
              <span className="ml-1.5 text-[11px] text-text-tertiary capitalize">
                ({linkedPerson.role.replace(/_/g, " ")})
              </span>
            </div>
          )}
          {linkedEntity && (
            <div>
              <div className="font-medium">{linkedEntity.name}</div>
              {linkedEntity.role && (
                <div className="text-text-tertiary text-[11px] capitalize">{linkedEntity.role.replace(/_/g, " ")}</div>
              )}
            </div>
          )}
          {linkedAccount && (
            <div>
              <div className="font-medium">{linkedAccount.institution_name}</div>
              {linkedAccount.branch && (
                <div className="text-text-secondary">{linkedAccount.branch}</div>
              )}
              <div className="text-text-secondary font-mono">
                {linkedAccount.account_number}
                {linkedAccount.currency_code && ` · ${linkedAccount.currency_code}`}
              </div>
              {linkedAccount.institution_code && (
                <div className="text-text-tertiary text-[11px]">
                  {linkedAccount.institution_code_type?.toUpperCase()}: {linkedAccount.institution_code}
                </div>
              )}
              {linkedAccount.person_id && (() => {
                const p = persons.find((x) => x.id === linkedAccount.person_id);
                return p ? (
                  <div className="text-text-tertiary text-[11px] mt-0.5">
                    Person: {p.first_name} {p.last_name}
                  </div>
                ) : null;
              })()}
              {linkedAccount.entity_id && (() => {
                const e = entities.find((x) => x.id === linkedAccount.entity_id);
                return e ? (
                  <div className="text-text-tertiary text-[11px]">
                    Entity: {e.name}
                  </div>
                ) : null;
              })()}
              {linkedAccount.is_my_client && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
                  My Client
                </span>
              )}
            </div>
          )}
          <button
            onClick={handleRemoveParty}
            disabled={saving}
            className="mt-1.5 text-[11px] text-red hover:underline disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      )}

      {/* No party yet - show action card */}
      {(!party || (!linkedPerson && !linkedEntity && !linkedAccount)) && mode === "idle" && (
        <div className="rounded-lg border-2 border-dashed border-amber-border bg-amber-bg/40 p-3">
          <p className="text-[12px] font-semibold text-amber mb-2">
            {direction === "from" ? "Who sent the funds?" : "Who received the funds?"}
          </p>
          <p className="text-[11.5px] text-text-secondary mb-3">
            {direction === "from"
              ? "Link the sender — a person, entity, or external account."
              : "Link the recipient — a person, entity, or external account."}
          </p>
          <div className="flex flex-col gap-1.5">
            {persons.length > 0 && (
              <button
                onClick={() => setMode("pick-person")}
                className="w-full text-left px-3 py-2 text-[12.5px] font-medium rounded-lg bg-surface border border-border hover:bg-surface-alt transition-colors"
              >
                Link a person in this report
              </button>
            )}
            {entities.length > 0 && (
              <button
                onClick={() => setMode("pick-entity")}
                className="w-full text-left px-3 py-2 text-[12.5px] font-medium rounded-lg bg-surface border border-border hover:bg-surface-alt transition-colors"
              >
                Link an entity in this report
              </button>
            )}
            <button
              onClick={() => setMode("add-entity")}
              className="w-full text-left px-3 py-2 text-[12.5px] font-medium rounded-lg bg-surface border border-border hover:bg-surface-alt transition-colors"
            >
              Add a new entity
            </button>
            <button
              onClick={() => setMode("add-account")}
              className="w-full text-left px-3 py-2 text-[12.5px] font-medium rounded-lg bg-surface border border-border hover:bg-surface-alt transition-colors"
            >
              Add a bank account
            </button>
          </div>
        </div>
      )}

      {/* Replace links when party exists */}
      {party && (linkedPerson || linkedEntity || linkedAccount) && mode === "idle" && (
        <div className="flex flex-wrap gap-2">
          {persons.length > 0 && (
            <button
              onClick={() => setMode("pick-person")}
              className="text-[11.5px] font-medium text-text-secondary hover:text-accent hover:underline"
            >
              Change to person
            </button>
          )}
          {entities.length > 0 && (
            <button
              onClick={() => setMode("pick-entity")}
              className="text-[11.5px] font-medium text-text-secondary hover:text-accent hover:underline"
            >
              Change to entity
            </button>
          )}
          <button
            onClick={() => setMode("add-entity")}
            className="text-[11.5px] font-medium text-text-secondary hover:text-accent hover:underline"
          >
            Add new entity
          </button>
          <button
            onClick={() => setMode("add-account")}
            className="text-[11.5px] font-medium text-text-secondary hover:text-accent hover:underline"
          >
            Change to account
          </button>
        </div>
      )}

      {error && (
        <p className="text-[11.5px] text-red">{error}</p>
      )}

      {/* Pick person mode */}
      {mode === "pick-person" && (
        <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
          <select
            value={selectedPersonId}
            onChange={(e) => setSelectedPersonId(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="">Select a person...</option>
            {persons.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name} ({p.role.replace(/_/g, " ")})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleLinkPerson}
              disabled={saving || !selectedPersonId}
              className="px-3 py-1.5 text-[12px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover disabled:opacity-60"
            >
              {saving ? "Saving..." : "Link"}
            </button>
            <button
              onClick={() => { setMode("idle"); setError(null); }}
              className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-full hover:bg-surface-alt"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add new entity mode */}
      {mode === "add-entity" && (
        <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-0.5">
              Entity / Company Name *
            </label>
            <input
              type="text"
              value={entityForm.name}
              onChange={(e) => setEntityForm({ ...entityForm, name: e.target.value })}
              placeholder="e.g. Chen Holdings Ltd"
              className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[12px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-0.5">
              Role
            </label>
            <select
              value={entityForm.role}
              onChange={(e) => setEntityForm({ ...entityForm, role: e.target.value as EntityForm["role"] })}
              className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {ENTITY_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-[12px]">
            <input
              type="checkbox"
              checked={entityForm.is_my_client}
              onChange={(e) => setEntityForm({ ...entityForm, is_my_client: e.target.checked })}
              className="rounded border-border"
            />
            This is my client
          </label>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSaveNewEntity}
              disabled={saving}
              className="px-3 py-1.5 text-[12px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Entity"}
            </button>
            <button
              onClick={() => { setMode("idle"); setEntityForm({ ...EMPTY_ENTITY_FORM }); setError(null); }}
              className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-full hover:bg-surface-alt"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pick entity mode */}
      {mode === "pick-entity" && (
        <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
          <select
            value={selectedEntityId}
            onChange={(e) => setSelectedEntityId(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="">Select an entity...</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}{e.role ? ` (${e.role.replace(/_/g, " ")})` : ""}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleLinkEntity}
              disabled={saving || !selectedEntityId}
              className="px-3 py-1.5 text-[12px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover disabled:opacity-60"
            >
              {saving ? "Saving..." : "Link"}
            </button>
            <button
              onClick={() => { setMode("idle"); setError(null); }}
              className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-full hover:bg-surface-alt"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add account mode */}
      {mode === "add-account" && (
        <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-0.5">
                Bank / Institution *
              </label>
              <select
                value={accountForm.institution_name}
                onChange={(e) => {
                  const name = e.target.value;
                  const inst = lookupInstitution(name);
                  setAccountForm({
                    ...accountForm,
                    institution_name: name,
                    institution_code_type: inst?.codeType ?? accountForm.institution_code_type,
                    institution_code: inst?.code ?? (inst ? "" : accountForm.institution_code),
                  });
                }}
                className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="">Select institution...</option>
                {NZ_INSTITUTIONS.map((inst) => (
                  <option key={inst.name} value={inst.name}>{inst.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-0.5">
                Account Number *
              </label>
              <input
                type="text"
                value={accountForm.account_number}
                onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })}
                placeholder="e.g. 01-0142-0000000-00"
                className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[12px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 font-mono"
              />
              {accountForm.account_number.includes(" ") && (
                <p className="text-[11px] text-amber mt-0.5">
                  Account number contains spaces — the goAML XSD does not allow spaces.
                </p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-0.5">
                Branch
              </label>
              <input
                type="text"
                value={accountForm.branch}
                onChange={(e) => setAccountForm({ ...accountForm, branch: e.target.value })}
                placeholder="e.g. Auckland CBD"
                className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[12px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            {(() => {
              const autoFilled = !!(accountForm.institution_name && lookupInstitution(accountForm.institution_name)?.code);
              return (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-text-secondary mb-0.5">
                      Code Type
                      {autoFilled && <span className="ml-1 text-text-tertiary font-normal">(auto-filled)</span>}
                    </label>
                    <select
                      value={accountForm.institution_code_type}
                      onChange={(e) => setAccountForm({ ...accountForm, institution_code_type: e.target.value })}
                      className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                      {INST_CODE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-text-secondary mb-0.5">
                      Code
                      {autoFilled && <span className="ml-1 text-text-tertiary font-normal">(auto-filled)</span>}
                    </label>
                    <input
                      type="text"
                      value={accountForm.institution_code}
                      onChange={(e) => setAccountForm({ ...accountForm, institution_code: e.target.value })}
                      placeholder="e.g. ANZBNZ22"
                      className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[12px] placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 font-mono"
                    />
                  </div>
                </div>
              );
            })()}
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-0.5">
                Currency
              </label>
              <CurrencySelect
                value={accountForm.currency_code}
                onChange={(v) => setAccountForm({ ...accountForm, currency_code: v })}
                placeholder="Select currency..."
                small
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-0.5">
                Funds Type (optional)
              </label>
              <FundsTypeSelect
                value={accountForm.funds_code}
                onChange={(v) => setAccountForm({ ...accountForm, funds_code: v })}
                placeholder="Select funds type..."
                small
              />
            </div>
            <label className="flex items-center gap-2 text-[12px]">
              <input
                type="checkbox"
                checked={accountForm.is_my_client}
                onChange={(e) => setAccountForm({ ...accountForm, is_my_client: e.target.checked })}
                className="rounded border-border"
              />
              This is my client's account
            </label>
            {persons.length > 0 && (
              <div>
                <label className="block text-[11px] font-medium text-text-secondary mb-0.5">
                  Link Person (optional)
                </label>
                <select
                  value={accountForm.person_id}
                  onChange={(e) => setAccountForm({ ...accountForm, person_id: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  <option value="">None</option>
                  {persons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.role.replace(/_/g, " ")})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {entities.length > 0 && (
              <div>
                <label className="block text-[11px] font-medium text-text-secondary mb-0.5">
                  Link Entity (optional)
                </label>
                <select
                  value={accountForm.entity_id}
                  onChange={(e) => setAccountForm({ ...accountForm, entity_id: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  <option value="">None</option>
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}{e.role ? ` (${e.role.replace(/_/g, " ")})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSaveAccount}
              disabled={saving}
              className="px-3 py-1.5 text-[12px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Account"}
            </button>
            <button
              onClick={() => { setMode("idle"); setAccountForm({ ...EMPTY_ACCOUNT }); setError(null); }}
              className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-full hover:bg-surface-alt"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
