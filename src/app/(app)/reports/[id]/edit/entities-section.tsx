"use client";

import { useState } from "react";
import { Plus } from "@/components/ui/icons";
import { CountrySelect } from "@/components/ui/country-select";
import {
  saveEntity,
  deleteEntity,
  saveAddress,
  deleteAddress,
  savePhone,
  deletePhone,
} from "@/lib/actions/reports";

type EntityRecord = {
  id: string;
  name: string;
  commercial_name: string | null;
  is_my_client: boolean;
  role: string;
  business_type: string | null;
  incorporation_date: string | null;
  incorporation_country: string | null;
  incorporation_legal_form: string | null;
  incorporation_number: string | null;
  comments: string | null;
  addresses: AddressRecord[];
  phones: PhoneRecord[];
};

type AddressRecord = {
  id: string;
  address_type: string | null;
  address_line: string | null;
  city: string | null;
  postcode: string | null;
  country_code: string | null;
};

type PhoneRecord = {
  id: string;
  phone_type: string | null;
  country_prefix: string | null;
  number: string;
};

type EntityForm = {
  id?: string;
  name: string;
  commercial_name: string;
  is_my_client: boolean;
  role: string;
  business_type: string;
  incorporation_date: string;
  incorporation_country: string;
  incorporation_legal_form: string;
  incorporation_number: string;
  comments: string;
};

const EMPTY_ENTITY: EntityForm = {
  name: "",
  commercial_name: "",
  is_my_client: false,
  role: "counterparty",
  business_type: "",
  incorporation_date: "",
  incorporation_country: "",
  incorporation_legal_form: "",
  incorporation_number: "",
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

const LEGAL_FORM_OPTIONS = [
  { value: "", label: "Select legal form..." },
  { value: "limited", label: "Limited Company" },
  { value: "partnership", label: "Partnership" },
  { value: "sole_trader", label: "Sole Trader" },
  { value: "trust", label: "Trust" },
  { value: "other", label: "Other" },
];

export function EntitiesSection({
  reportId,
  entities,
  onUpdate,
}: {
  reportId: string;
  entities: Record<string, unknown>[];
  onUpdate: () => void;
}) {
  const typedEntities = entities as unknown as EntityRecord[];
  const [editingEntity, setEditingEntity] = useState<EntityForm | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startNew() {
    setEditingEntity({ ...EMPTY_ENTITY });
    setExpandedId(null);
  }

  function startEdit(e: EntityRecord) {
    setEditingEntity({
      id: e.id,
      name: e.name,
      commercial_name: e.commercial_name ?? "",
      is_my_client: e.is_my_client,
      role: e.role,
      business_type: e.business_type ?? "",
      incorporation_date: e.incorporation_date ?? "",
      incorporation_country: e.incorporation_country ?? "",
      incorporation_legal_form: e.incorporation_legal_form ?? "",
      incorporation_number: e.incorporation_number ?? "",
      comments: e.comments ?? "",
    });
    setExpandedId(null);
  }

  async function handleSave() {
    if (!editingEntity) return;
    if (!editingEntity.name) {
      setError("Entity name is required");
      return;
    }

    setSaving(true);
    setError(null);
    const res = await saveEntity(reportId, {
      ...editingEntity,
      incorporation_legal_form: (editingEntity.incorporation_legal_form || undefined) as
        | "limited" | "partnership" | "sole_trader" | "trust" | "other"
        | undefined,
      role: editingEntity.role as EntityForm["role"],
    } as Parameters<typeof saveEntity>[1]);
    setSaving(false);

    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    const savedId = "id" in res ? res.id : editingEntity.id;
    setEditingEntity(null);
    if (savedId) setExpandedId(savedId);
    onUpdate();
  }

  async function handleDelete(entityId: string) {
    setSaving(true);
    await deleteEntity(reportId, entityId);
    setSaving(false);
    setExpandedId(null);
    onUpdate();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold">Entities</h3>
          <p className="text-[12px] text-text-tertiary mt-0.5">
            Add companies, trusts, or other organisations involved in this report.
          </p>
        </div>
        {!editingEntity && (
          <button
            onClick={startNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover transition-colors"
          >
            <Plus size={14} />
            Add Entity
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-bg border border-red-border px-3 py-2 text-[13px] text-red mb-3">
          {error}
        </div>
      )}

      {/* Entity form */}
      {editingEntity && (() => {
        const nameWarning = /\b(Ltd|Pty|Corp|Co\.|Inc)\b/i.test(editingEntity.name)
          ? `"${editingEntity.name}" contains an abbreviation — goAML prefers the full legal name (e.g. "Limited" not "Ltd").`
          : null;
        return (
        <div className="border border-border rounded-lg p-4 mb-4 bg-surface-alt/30">
          <h4 className="text-[13px] font-semibold mb-3">
            {editingEntity.id ? "Edit Entity" : "New Entity"}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Entity Name *"
              value={editingEntity.name}
              onChange={(v) => setEditingEntity({ ...editingEntity, name: v })}
              placeholder="Registered legal name"
            />
            <Field
              label="Commercial / Trading Name (optional)"
              value={editingEntity.commercial_name}
              onChange={(v) => setEditingEntity({ ...editingEntity, commercial_name: v })}
              placeholder="e.g. Trading As name"
            />
            <SelectField
              label="Role"
              value={editingEntity.role}
              onChange={(v) => {
                setEditingEntity({
                  ...editingEntity,
                  role: v,
                  is_my_client: v === "my_client",
                });
              }}
              options={ROLE_OPTIONS}
            />
            <Field
              label="Business Type (optional)"
              value={editingEntity.business_type}
              onChange={(v) => setEditingEntity({ ...editingEntity, business_type: v })}
              placeholder="e.g. Investment Company"
            />
            <SelectField
              label="Legal Form (optional)"
              value={editingEntity.incorporation_legal_form}
              onChange={(v) => setEditingEntity({ ...editingEntity, incorporation_legal_form: v })}
              options={LEGAL_FORM_OPTIONS}
            />
            <Field
              label="Incorporation Number (optional)"
              value={editingEntity.incorporation_number}
              onChange={(v) => setEditingEntity({ ...editingEntity, incorporation_number: v })}
              placeholder="e.g. 1234567"
            />
            <Field
              label="Incorporation Date (optional)"
              value={editingEntity.incorporation_date}
              onChange={(v) => setEditingEntity({ ...editingEntity, incorporation_date: v })}
              type="date"
            />
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">Incorporation Country (optional)</label>
              <CountrySelect
                value={editingEntity.incorporation_country}
                onChange={(v) => setEditingEntity({ ...editingEntity, incorporation_country: v })}
                placeholder="Search country..."
              />
            </div>
          </div>
          <div className="mt-3">
            <Field
              label="Comments (optional)"
              value={editingEntity.comments}
              onChange={(v) => setEditingEntity({ ...editingEntity, comments: v })}
              multiline
              placeholder="Any additional notes..."
            />
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
            {nameWarning && (
              <div className="rounded-lg bg-amber-bg border border-amber-border px-3 py-2 text-[12px] text-text-secondary col-span-full">
                <span className="font-semibold text-amber">Note: </span>{nameWarning}
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-[13px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Entity"}
            </button>
            <button
              onClick={() => {
                setEditingEntity(null);
                setError(null);
              }}
              className="px-4 py-2 text-[13px] font-medium border border-border rounded-full hover:bg-surface-alt transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
        );
      })()}

      {/* Entity list */}
      {typedEntities.length === 0 && !editingEntity && (
        <div className="text-center py-8 text-text-tertiary">
          <p className="text-[13px]">No entities added.</p>
          <p className="text-[12px] mt-1">
            Add companies or trusts involved in this report.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {typedEntities.map((e) => (
          <EntityCard
            key={e.id}
            entity={e}
            expanded={expandedId === e.id}
            onToggle={() => setExpandedId(expandedId === e.id ? null : e.id)}
            onEdit={() => startEdit(e)}
            onDelete={() => handleDelete(e.id)}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
}

function EntityCard({
  entity,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onUpdate,
}: {
  entity: EntityRecord;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}) {
  const role = ROLE_OPTIONS.find((r) => r.value === entity.role);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-alt/50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] font-medium truncate">{entity.name}</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-alt border border-border text-text-secondary font-medium shrink-0">
              {role?.label ?? entity.role}
            </span>
            {entity.is_my_client && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium shrink-0">
                My Client
              </span>
            )}
            {entity.is_my_client && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-bg border border-amber-border text-amber font-medium shrink-0">
                Address recommended
              </span>
            )}
          </div>
          <div className="text-[12px] text-text-tertiary mt-0.5 flex gap-3">
            {entity.commercial_name && <span>{entity.commercial_name}</span>}
            {entity.business_type && <span>{entity.business_type}</span>}
            {entity.incorporation_country && (
              <span>Incorporated: {entity.incorporation_country}</span>
            )}
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
              Remove entity
            </button>
          </div>

          <EntitySubRecords
            title="Addresses"
            items={entity.addresses}
            entityId={entity.id}
            type="address"
            defaultOpen={entity.addresses.length === 0}
            onUpdate={onUpdate}
          />
          <EntitySubRecords
            title="Phone Numbers"
            items={entity.phones}
            entityId={entity.id}
            type="phone"
            onUpdate={onUpdate}
          />
        </div>
      )}
    </div>
  );
}

function EntitySubRecords({
  title,
  items,
  entityId,
  type,
  defaultOpen = false,
  onUpdate,
}: {
  title: string;
  items: AddressRecord[] | PhoneRecord[];
  entityId: string;
  type: "address" | "phone";
  defaultOpen?: boolean;
  onUpdate: () => void;
}) {
  const [adding, setAdding] = useState(defaultOpen);
  const [saving, setSaving] = useState(false);

  const [addrType, setAddrType] = useState("business");
  const [addrLine, setAddrLine] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrPostcode, setAddrPostcode] = useState("");
  const [addrCountry, setAddrCountry] = useState("");

  const [phoneType, setPhoneType] = useState("landline");
  const [phonePrefix, setPhonePrefix] = useState("+64");
  const [phoneNumber, setPhoneNumber] = useState("");

  function reset() {
    setAddrType("business");
    setAddrLine(""); setAddrCity(""); setAddrPostcode(""); setAddrCountry("");
    setPhoneType("landline"); setPhonePrefix("+64"); setPhoneNumber("");
    setAdding(false);
  }

  async function handleSaveAddress() {
    setSaving(true);
    await saveAddress("", {
      address_type: addrType as "residential" | "business" | "registered" | "mailing",
      address_line: addrLine,
      city: addrCity,
      postcode: addrPostcode,
      country_code: addrCountry,
    }, entityId);
    setSaving(false);
    reset();
    onUpdate();
  }

  async function handleSavePhone() {
    if (!phoneNumber) return;
    setSaving(true);
    await savePhone("", {
      phone_type: phoneType as "mobile" | "landline" | "fax",
      country_prefix: phonePrefix,
      number: phoneNumber,
    }, entityId);
    setSaving(false);
    reset();
    onUpdate();
  }

  async function handleDelete(itemId: string) {
    if (type === "address") await deleteAddress(itemId);
    else await deletePhone(itemId);
    onUpdate();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
          {title}
        </h5>
        {!adding && (
          <button onClick={() => setAdding(true)} className="text-[11.5px] font-medium text-accent hover:underline">
            + Add
          </button>
        )}
      </div>

      {items.length === 0 && !adding && (
        <p className="text-[12px] text-text-tertiary">None added</p>
      )}

      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between py-1.5 text-[12.5px]">
          <span className="text-text">
            {type === "address" && formatAddress(item as AddressRecord)}
            {type === "phone" && formatPhone(item as PhoneRecord)}
          </span>
          <button onClick={() => handleDelete(item.id)} className="text-[11px] text-red hover:underline shrink-0 ml-2">
            Remove
          </button>
        </div>
      ))}

      {adding && type === "address" && (
        <div className="border border-border rounded-lg p-3 mt-2 space-y-2 bg-surface">
          <div className="grid grid-cols-2 gap-2">
            <SelectField label="Type" value={addrType} onChange={setAddrType} options={[
              { value: "business", label: "Business" },
              { value: "registered", label: "Registered" },
              { value: "mailing", label: "Mailing" },
            ]} small />
            <div>
              <label className="block text-[11px] font-medium text-text-secondary mb-1">Country</label>
              <CountrySelect value={addrCountry} onChange={setAddrCountry} placeholder="Search country..." />
            </div>
          </div>
          <Field label="Address" value={addrLine} onChange={setAddrLine} placeholder="Street address" small />
          <div className="grid grid-cols-2 gap-2">
            <Field label="City" value={addrCity} onChange={setAddrCity} small />
            <Field label="Postcode" value={addrPostcode} onChange={setAddrPostcode} small />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSaveAddress} disabled={saving} className="px-3 py-1.5 text-[12px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={reset} className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-full hover:bg-surface-alt">
              Cancel
            </button>
          </div>
        </div>
      )}

      {adding && type === "phone" && (
        <div className="border border-border rounded-lg p-3 mt-2 space-y-2 bg-surface">
          <div className="grid grid-cols-3 gap-2">
            <SelectField label="Type" value={phoneType} onChange={setPhoneType} options={[
              { value: "mobile", label: "Mobile" },
              { value: "landline", label: "Landline" },
              { value: "fax", label: "Fax" },
            ]} small />
            <Field label="Prefix" value={phonePrefix} onChange={setPhonePrefix} placeholder="+64" small />
            <Field label="Number" value={phoneNumber} onChange={setPhoneNumber} placeholder="93001234" small />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSavePhone} disabled={saving || !phoneNumber} className="px-3 py-1.5 text-[12px] font-semibold bg-accent text-white rounded-full hover:bg-accent-hover disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={reset} className="px-3 py-1.5 text-[12px] font-medium border border-border rounded-full hover:bg-surface-alt">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatAddress(a: AddressRecord) {
  return [a.address_line, a.city, a.postcode, a.country_code].filter(Boolean).join(", ");
}

function formatPhone(p: PhoneRecord) {
  const label = p.phone_type === "mobile" ? "Mobile" : p.phone_type === "landline" ? "Landline" : p.phone_type === "fax" ? "Fax" : "";
  return `${label}: ${p.country_prefix ?? ""} ${p.number}`;
}

function Field({
  label, value, onChange, placeholder, type = "text", multiline = false, small = false,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; multiline?: boolean; small?: boolean;
}) {
  const cls = `w-full bg-surface border border-border rounded-lg px-3 py-2 ${small ? "text-[12px]" : "text-[13px]"} placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent`;
  return (
    <div>
      <label className={`block ${small ? "text-[11px]" : "text-[12px]"} font-medium text-text-secondary mb-1`}>{label}</label>
      {multiline ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${cls} resize-none`} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}

function SelectField({
  label, value, onChange, options, small = false,
}: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; small?: boolean;
}) {
  return (
    <div>
      <label className={`block ${small ? "text-[11px]" : "text-[12px]"} font-medium text-text-secondary mb-1`}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-surface border border-border rounded-lg px-3 py-2 ${small ? "text-[12px]" : "text-[13px]"} focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent`}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
