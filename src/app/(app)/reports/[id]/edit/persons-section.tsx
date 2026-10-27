"use client";

import { useState } from "react";
import { Plus, CheckCircle, AlertTriangle } from "@/components/ui/icons";
import {
  savePerson,
  deletePerson,
  saveAddress,
  deleteAddress,
  savePhone,
  deletePhone,
  saveIdentification,
  deleteIdentification,
} from "@/lib/actions/reports";
import { CountrySelect } from "@/components/ui/country-select";

type PersonRecord = Record<string, unknown> & {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  title: string | null;
  gender: "M" | "F" | "U" | null;
  birthdate: string | null;
  birth_place: string | null;
  nationality: string | null;
  residence: string | null;
  occupation: string | null;
  mothers_name: string | null;
  source_of_wealth: string | null;
  is_my_client: boolean;
  role: string;
  comments: string | null;
  addresses: AddressRecord[];
  phones: PhoneRecord[];
  person_identifications: IdRecord[];
};

type AddressRecord = {
  id: string;
  address_type: string | null;
  address_line: string | null;
  city: string | null;
  postcode: string | null;
  country_code: string | null;
  state: string | null;
};

type PhoneRecord = {
  id: string;
  phone_type: string | null;
  country_prefix: string | null;
  number: string;
  extension: string | null;
};

type IdRecord = {
  id: string;
  type: string;
  number: string;
  issue_date: string | null;
  expiry_date: string | null;
  issued_by: string | null;
  issue_country: string | null;
};

type PersonForm = {
  id?: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  title: string;
  gender: string;
  birthdate: string;
  birth_place: string;
  nationality: string;
  residence: string;
  occupation: string;
  mothers_name: string;
  source_of_wealth: string;
  is_my_client: boolean;
  role: string;
  comments: string;
};

const EMPTY_PERSON: PersonForm = {
  first_name: "",
  last_name: "",
  middle_name: "",
  title: "",
  gender: "",
  birthdate: "",
  birth_place: "",
  nationality: "",
  residence: "",
  occupation: "",
  mothers_name: "",
  source_of_wealth: "",
  is_my_client: true,
  role: "my_client",
  comments: "",
};

const ROLE_OPTIONS = [
  { value: "my_client", label: "My Client" },
  { value: "counterparty", label: "Counterparty" },
  { value: "conductor", label: "Conductor" },
  { value: "signatory", label: "Signatory" },
  { value: "director", label: "Director" },
  { value: "beneficiary", label: "Beneficiary" },
];

export function PersonsSection({
  reportId,
  persons,
  questionnaireSubject,
  onUpdate,
}: {
  reportId: string;
  persons: Record<string, unknown>[];
  questionnaireSubject?: unknown;
  onUpdate: () => void;
}) {
  const typedPersons = persons as unknown as PersonRecord[];
  const [editingPerson, setEditingPerson] = useState<PersonForm | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(
    () => (persons as unknown as PersonRecord[]).find((p) => p.is_my_client)?.id ?? null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startNew() {
    setEditingPerson({ ...EMPTY_PERSON });
    setExpandedId(null);
  }

  function prefillFromSubject() {
    if (!questionnaireSubject) return;
    const q = questionnaireSubject as Record<string, string>;
    const firstNames = (q.first_names ?? "").trim().split(/\s+/);
    setEditingPerson({
      ...EMPTY_PERSON,
      first_name: firstNames[0] ?? "",
      middle_name: firstNames.slice(1).join(" "),
      last_name: q.last_name ?? "",
      birthdate: q.date_of_birth ?? "",
      nationality: q.nationality ?? "",
      occupation: q.occupation ?? "",
    });
    setExpandedId(null);
  }

  function startEdit(p: PersonRecord) {
    setEditingPerson({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      middle_name: p.middle_name ?? "",
      title: p.title ?? "",
      gender: p.gender ?? "",
      birthdate: p.birthdate ?? "",
      birth_place: p.birth_place ?? "",
      nationality: p.nationality ?? "",
      residence: p.residence ?? "",
      occupation: p.occupation ?? "",
      mothers_name: p.mothers_name ?? "",
      source_of_wealth: p.source_of_wealth ?? "",
      is_my_client: p.is_my_client,
      role: p.role,
      comments: p.comments ?? "",
    });
    setExpandedId(null);
  }

  async function handleSave() {
    if (!editingPerson) return;
    if (!editingPerson.first_name || !editingPerson.last_name) {
      setError("First name and last name are required");
      return;
    }

    setSaving(true);
    setError(null);
    const res = await savePerson(reportId, {
      ...editingPerson,
      gender: (editingPerson.gender || undefined) as "M" | "F" | "U" | undefined,
      role: editingPerson.role as PersonForm["role"],
    } as Parameters<typeof savePerson>[1]);
    setSaving(false);

    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    setEditingPerson(null);
    onUpdate();
  }

  async function handleDelete(personId: string) {
    setSaving(true);
    await deletePerson(reportId, personId);
    setSaving(false);
    setExpandedId(null);
    onUpdate();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold">Persons</h3>
          <p className="text-[12px] text-text-tertiary mt-0.5">
            Add the people involved in this report - your client and any
            counterparties.
          </p>
        </div>
        {!editingPerson && (
          <div className="flex items-center gap-2">
            {!!(questionnaireSubject &&
              ((questionnaireSubject as Record<string, unknown>).first_names ||
                (questionnaireSubject as Record<string, unknown>).last_name)) && (
              <button
                onClick={prefillFromSubject}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium border border-border rounded-full hover:bg-surface-alt transition-colors"
              >
                Prefill from subject
              </button>
            )}
            <button
              onClick={startNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover transition-colors"
            >
              <Plus size={14} />
              Add Person
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-bg border border-red-border px-3 py-2 text-[13px] text-red mb-3">
          {error}
        </div>
      )}

      {/* Person form */}
      {editingPerson && (
        <div className="border border-border rounded-lg p-4 mb-4 bg-surface-alt/30">
          <h4 className="text-[13px] font-semibold mb-3">
            {editingPerson.id ? "Edit Person" : "New Person"}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="First Name *"
              value={editingPerson.first_name}
              onChange={(v) =>
                setEditingPerson({ ...editingPerson, first_name: v })
              }
              placeholder="Given names"
            />
            <Field
              label="Last Name *"
              value={editingPerson.last_name}
              onChange={(v) =>
                setEditingPerson({ ...editingPerson, last_name: v })
              }
              placeholder="Family name"
            />
            <Field
              label="Middle Name (optional)"
              value={editingPerson.middle_name}
              onChange={(v) =>
                setEditingPerson({ ...editingPerson, middle_name: v })
              }
            />
            <SelectField
              label="Role"
              value={editingPerson.role}
              onChange={(v) => {
                const isClient = v === "my_client";
                setEditingPerson({
                  ...editingPerson,
                  role: v,
                  is_my_client: isClient,
                });
              }}
              options={ROLE_OPTIONS}
            />
            <SelectField
              label="Gender (optional)"
              value={editingPerson.gender}
              onChange={(v) =>
                setEditingPerson({ ...editingPerson, gender: v })
              }
              options={[
                { value: "", label: "Select..." },
                { value: "M", label: "Male" },
                { value: "F", label: "Female" },
                { value: "-", label: "Unknown / Other" },
              ]}
            />
            <Field
              label="Date of Birth (optional)"
              value={editingPerson.birthdate}
              onChange={(v) =>
                setEditingPerson({ ...editingPerson, birthdate: v })
              }
              type="date"
            />
            <Field
              label="Nationality (optional)"
              value={editingPerson.nationality}
              onChange={(v) =>
                setEditingPerson({ ...editingPerson, nationality: v })
              }
              placeholder="e.g. New Zealand"
            />
            <Field
              label="Country of Residence (optional)"
              value={editingPerson.residence}
              onChange={(v) =>
                setEditingPerson({ ...editingPerson, residence: v })
              }
              placeholder="e.g. New Zealand"
            />
            <Field
              label="Occupation (optional)"
              value={editingPerson.occupation}
              onChange={(v) =>
                setEditingPerson({ ...editingPerson, occupation: v })
              }
              placeholder="e.g. Company Director"
            />
            <Field
              label="Birth Place (optional)"
              value={editingPerson.birth_place}
              onChange={(v) =>
                setEditingPerson({ ...editingPerson, birth_place: v })
              }
            />
            <Field
              label="Source of Wealth (optional)"
              value={editingPerson.source_of_wealth}
              onChange={(v) =>
                setEditingPerson({ ...editingPerson, source_of_wealth: v })
              }
              placeholder="e.g. Employment income"
            />
            <Field
              label="Mother's Name (optional)"
              value={editingPerson.mothers_name}
              onChange={(v) =>
                setEditingPerson({ ...editingPerson, mothers_name: v })
              }
            />
          </div>
          <div className="mt-3">
            <Field
              label="Comments (optional)"
              value={editingPerson.comments}
              onChange={(v) =>
                setEditingPerson({ ...editingPerson, comments: v })
              }
              multiline
              placeholder="Any additional notes about this person..."
            />
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-[13px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Person"}
            </button>
            <button
              onClick={() => {
                setEditingPerson(null);
                setError(null);
              }}
              className="px-4 py-2 text-[13px] font-medium border border-border rounded-full hover:bg-surface-alt transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Person list */}
      {typedPersons.length === 0 && !editingPerson && (
        <div className="text-center py-10 text-text-tertiary">
          <p className="text-[13px]">No persons added yet.</p>
          <p className="text-[12px] mt-1">
            Add at least one person (your client) to include in the report.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {typedPersons.map((p) => (
          <PersonCard
            key={p.id}
            person={p}
            expanded={expandedId === p.id}
            onToggle={() =>
              setExpandedId(expandedId === p.id ? null : p.id)
            }
            onEdit={() => startEdit(p)}
            onDelete={() => handleDelete(p.id)}
            reportId={reportId}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
}

function PersonCard({
  person,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  reportId,
  onUpdate,
}: {
  person: PersonRecord;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  reportId: string;
  onUpdate: () => void;
}) {
  const role = ROLE_OPTIONS.find((r) => r.value === person.role);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-alt/50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-medium">
              {person.first_name} {person.last_name}
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-alt border border-border text-text-secondary font-medium">
              {role?.label ?? person.role}
            </span>
            {person.is_my_client && person.role !== "my_client" && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
                My Client
              </span>
            )}
          </div>
          <div className="text-[12px] text-text-tertiary mt-0.5 flex gap-3">
            {person.nationality && <span>{person.nationality}</span>}
            {person.birthdate && <span>DOB: {person.birthdate}</span>}
            {person.occupation && <span>{person.occupation}</span>}
          </div>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className={`text-text-tertiary shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
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

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="text-[12px] font-medium text-accent hover:underline"
            >
              Edit details
            </button>
            <span className="text-text-tertiary">·</span>
            <button
              onClick={onDelete}
              className="text-[12px] font-medium text-red hover:underline"
            >
              Remove person
            </button>
          </div>

          {/* Sub-records */}
          <SubRecords
            title="Addresses"
            items={person.addresses}
            personId={person.id}
            type="address"
            onUpdate={onUpdate}
          />
          <SubRecords
            title="Phone Numbers"
            items={person.phones}
            personId={person.id}
            type="phone"
            onUpdate={onUpdate}
          />
          <SubRecords
            title="Identification Documents"
            items={person.person_identifications}
            personId={person.id}
            type="identification"
            onUpdate={onUpdate}
          />
        </div>
      )}
    </div>
  );
}

function SubRecords({
  title,
  items,
  personId,
  type,
  onUpdate,
}: {
  title: string;
  items: AddressRecord[] | PhoneRecord[] | IdRecord[];
  personId: string;
  type: "address" | "phone" | "identification";
  onUpdate: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [idError, setIdError] = useState<string | null>(null);

  // Address form state
  const [addrType, setAddrType] = useState("residential");
  const [addrLine, setAddrLine] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrPostcode, setAddrPostcode] = useState("");
  const [addrCountry, setAddrCountry] = useState("");

  // Phone form state
  const [phoneType, setPhoneType] = useState("mobile");
  const [phonePrefix, setPhonePrefix] = useState("+64");
  const [phoneNumber, setPhoneNumber] = useState("");

  // ID form state
  const [idType, setIdType] = useState("passport");
  const [idNumber, setIdNumber] = useState("");
  const [idIssueDate, setIdIssueDate] = useState("");
  const [idExpiryDate, setIdExpiryDate] = useState("");
  const [idIssuedBy, setIdIssuedBy] = useState("");
  const [idCountry, setIdCountry] = useState("");

  function resetForm() {
    setAddrType("residential");
    setAddrLine("");
    setAddrCity("");
    setAddrPostcode("");
    setAddrCountry("");
    setPhoneType("mobile");
    setPhonePrefix("+64");
    setPhoneNumber("");
    setIdType("passport");
    setIdNumber("");
    setIdIssueDate("");
    setIdExpiryDate("");
    setIdIssuedBy("");
    setIdCountry("");
    setIdError(null);
    setAdding(false);
  }

  async function handleSaveAddress() {
    setSaving(true);
    await saveAddress(personId, {
      address_type: addrType as "residential" | "business" | "registered" | "mailing",
      address_line: addrLine,
      city: addrCity,
      postcode: addrPostcode,
      country_code: addrCountry,
    });
    setSaving(false);
    resetForm();
    onUpdate();
  }

  async function handleSavePhone() {
    if (!phoneNumber) return;
    setSaving(true);
    await savePhone(personId, {
      phone_type: phoneType as "mobile" | "landline" | "fax",
      country_prefix: phonePrefix,
      number: phoneNumber,
    });
    setSaving(false);
    resetForm();
    onUpdate();
  }

  async function handleSaveId() {
    if (!idNumber) return;
    if (idType === "drivers_licence" && idCountry.toUpperCase() === "NZ") {
      if (!/^[A-Za-z]{2}\d{6}$/.test(idNumber)) {
        setIdError("NZ Driver Licence must be 2 letters followed by 6 digits (e.g. LF123456)");
        return;
      }
    }
    setIdError(null);
    setSaving(true);
    await saveIdentification(personId, {
      type: idType as "drivers_licence" | "passport" | "national_id" | "birth_certificate" | "other",
      number: idNumber,
      issue_date: idIssueDate || undefined,
      expiry_date: idExpiryDate || undefined,
      issued_by: idIssuedBy || undefined,
      issue_country: idCountry || undefined,
    });
    setSaving(false);
    resetForm();
    onUpdate();
  }

  async function handleDeleteItem(itemId: string) {
    if (type === "address") await deleteAddress(itemId);
    else if (type === "phone") await deletePhone(itemId);
    else await deleteIdentification(itemId);
    onUpdate();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
          {title}
        </h5>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-[11.5px] font-medium text-accent hover:underline"
          >
            + Add
          </button>
        )}
      </div>

      {/* Existing items */}
      {items.length === 0 && !adding && (
        <p className="text-[12px] text-text-tertiary">None added</p>
      )}
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between py-1.5 text-[12.5px]"
        >
          <span className="text-text">
            {type === "address" && formatAddress(item as AddressRecord)}
            {type === "phone" && formatPhone(item as PhoneRecord)}
            {type === "identification" && formatId(item as IdRecord)}
          </span>
          <button
            onClick={() => handleDeleteItem(item.id)}
            className="text-[11px] text-red hover:underline shrink-0 ml-2"
          >
            Remove
          </button>
        </div>
      ))}

      {/* Add form */}
      {adding && type === "address" && (
        <div className="border border-border rounded-lg p-3 mt-2 space-y-2 bg-surface">
          <div className="grid grid-cols-2 gap-2">
            <SelectField
              label="Type"
              value={addrType}
              onChange={setAddrType}
              options={[
                { value: "residential", label: "Residential" },
                { value: "business", label: "Business" },
                { value: "registered", label: "Registered" },
                { value: "mailing", label: "Mailing" },
              ]}
              small
            />
            <Field
              label="Country"
              value={addrCountry}
              onChange={setAddrCountry}
              placeholder="e.g. NZ"
              small
            />
          </div>
          <Field
            label="Address"
            value={addrLine}
            onChange={setAddrLine}
            placeholder="Street address"
            small
          />
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="City"
              value={addrCity}
              onChange={setAddrCity}
              small
            />
            <Field
              label="Postcode"
              value={addrPostcode}
              onChange={setAddrPostcode}
              small
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSaveAddress}
              disabled={saving}
              className="px-3 py-1.5 text-[12px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={resetForm}
              className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-full hover:bg-surface-alt"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {adding && type === "phone" && (
        <div className="border border-border rounded-lg p-3 mt-2 space-y-2 bg-surface">
          <div className="grid grid-cols-3 gap-2">
            <SelectField
              label="Type"
              value={phoneType}
              onChange={setPhoneType}
              options={[
                { value: "mobile", label: "Mobile" },
                { value: "landline", label: "Landline" },
                { value: "fax", label: "Fax" },
              ]}
              small
            />
            <Field
              label="Prefix"
              value={phonePrefix}
              onChange={setPhonePrefix}
              placeholder="+64"
              small
            />
            <Field
              label="Number"
              value={phoneNumber}
              onChange={setPhoneNumber}
              placeholder="211234567"
              small
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSavePhone}
              disabled={saving || !phoneNumber}
              className="px-3 py-1.5 text-[12px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={resetForm}
              className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-full hover:bg-surface-alt"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {adding && type === "identification" && (
        <div className="border border-border rounded-lg p-3 mt-2 space-y-2 bg-surface">
          <div className="grid grid-cols-2 gap-2">
            <SelectField
              label="ID Type"
              value={idType}
              onChange={setIdType}
              options={[
                { value: "passport", label: "Passport" },
                { value: "drivers_licence", label: "NZ Drivers Licence" },
                { value: "national_id", label: "National ID / Identity Card" },
                { value: "birth_certificate", label: "Birth Certificate" },
                { value: "other", label: "Other" },
              ]}
              small
            />
            <Field
              label="Number *"
              value={idNumber}
              onChange={setIdNumber}
              placeholder="Document number"
              small
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="Issue Date"
              value={idIssueDate}
              onChange={setIdIssueDate}
              type="date"
              small
            />
            <Field
              label="Expiry Date"
              value={idExpiryDate}
              onChange={setIdExpiryDate}
              type="date"
              small
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="Issued By"
              value={idIssuedBy}
              onChange={setIdIssuedBy}
              placeholder="e.g. DIA"
              small
            />
            <Field
              label="Issue Country"
              value={idCountry}
              onChange={setIdCountry}
              placeholder="e.g. NZ"
              small
            />
          </div>
          {idError && (
            <p className="text-[11.5px] text-red">{idError}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSaveId}
              disabled={saving || !idNumber}
              className="px-3 py-1.5 text-[12px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={resetForm}
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

// ── Formatting helpers ──

function formatAddress(a: AddressRecord) {
  return [a.address_line, a.city, a.postcode, a.country_code]
    .filter(Boolean)
    .join(", ");
}

function formatPhone(p: PhoneRecord) {
  const typeLabel =
    p.phone_type === "mobile"
      ? "Mobile"
      : p.phone_type === "landline"
        ? "Landline"
        : p.phone_type === "fax"
          ? "Fax"
          : "";
  return `${typeLabel}: ${p.country_prefix ?? ""} ${p.number}`;
}

function formatId(id: IdRecord) {
  const typeLabel =
    id.type === "passport"
      ? "Passport"
      : id.type === "drivers_licence"
        ? "NZ Drivers Licence"
        : id.type === "national_id"
          ? "National ID"
          : id.type === "birth_certificate"
            ? "Birth Certificate"
            : id.type;
  return `${typeLabel}: ${id.number}${id.issue_country ? ` (${id.issue_country})` : ""}`;
}

// ── Reusable form fields ──

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline = false,
  small = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  small?: boolean;
}) {
  const inputClass = `w-full bg-surface border border-border rounded-lg px-3 py-2 ${
    small ? "text-[12px]" : "text-[13px]"
  } placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent`;

  return (
    <div>
      <label
        className={`block ${small ? "text-[11px]" : "text-[12px]"} font-medium text-text-secondary mb-1`}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputClass} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  small = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  small?: boolean;
}) {
  return (
    <div>
      <label
        className={`block ${small ? "text-[11px]" : "text-[12px]"} font-medium text-text-secondary mb-1`}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-surface border border-border rounded-lg px-3 py-2 ${
          small ? "text-[12px]" : "text-[13px]"
        } focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
