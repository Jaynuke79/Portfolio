import type { AccessKey, KeyDefaults, KeyTerms } from "@/lib/schedule-admin-api";

/** Monday-first, keyed by the backend's day numbers (0 = Sunday). */
export const WEEKDAYS: { day: string; name: string }[] = [
  { day: "1", name: "Monday" },
  { day: "2", name: "Tuesday" },
  { day: "3", name: "Wednesday" },
  { day: "4", name: "Thursday" },
  { day: "5", name: "Friday" },
  { day: "6", name: "Saturday" },
  { day: "0", name: "Sunday" },
];

export const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120];

/**
 * An id for a new meeting type. Ids are permanent once saved because keys
 * reference them, so they come from the name at creation and never follow
 * later renames, and a deleted type's id is never handed out again.
 */
export function newTypeId(name: string, existingIds: string[], retiredIds: string[] = []): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "meeting";
  let id = base;
  const taken = (candidate: string) => existingIds.includes(candidate) || retiredIds.includes(candidate);
  for (let n = 2; taken(id); n++) id = `${base}-${n}`;
  return id;
}

export interface KeyTermsForm {
  label: string;
  unlimitedUses: boolean;
  uses: string;
  /** "keep" sends no expiry fields, so an edit leaves the key's expiry untouched. */
  expiryMode: "keep" | "days" | "date";
  days: string;
  date: string;
  allTypes: boolean;
  typeIds: string[];
}

export function formFromDefaults(defaults: KeyDefaults): KeyTermsForm {
  return {
    label: "",
    unlimitedUses: defaults.maxUses === null,
    uses: String(defaults.maxUses ?? 1),
    expiryMode: "days",
    days: String(defaults.expiresInDays),
    date: "",
    allTypes: defaults.typeIds === null,
    typeIds: defaults.typeIds ?? [],
  };
}

/**
 * Ids of meeting types deleted since the key was saved are dropped: the picker
 * can't show them to untick, and the backend rejects them.
 */
export function formFromKey(key: AccessKey, timeZone: string, types: { id: string }[]): KeyTermsForm {
  return {
    label: key.label,
    unlimitedUses: key.maxUses === null,
    uses: String(key.maxUses ?? Math.max(1, key.uses)),
    expiryMode: "keep",
    days: "14",
    date: new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(key.expiresAt)),
    allTypes: key.typeIds === null,
    typeIds: (key.typeIds ?? []).filter(id => types.some(type => type.id === id)),
  };
}

/** Request fields for a key form, or a message for the first invalid field. */
export function termsFromForm(form: KeyTermsForm): { terms: KeyTerms } | { error: string } {
  const terms: KeyTerms = { label: form.label.trim() };

  if (form.unlimitedUses) {
    terms.unlimitedUses = true;
  } else {
    const uses = Number(form.uses);
    if (!Number.isInteger(uses) || uses < 1) return { error: "Uses must be a whole number of at least 1." };
    terms.maxUses = uses;
  }

  if (form.expiryMode === "days") {
    const days = Number(form.days);
    if (!(days > 0 && days <= 365)) return { error: "Expiry must be between 1 and 365 days." };
    terms.expiresInDays = days;
  } else if (form.expiryMode === "date") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) return { error: "Pick an expiry date." };
    terms.expiresOn = form.date;
  }

  if (form.allTypes) {
    terms.allTypes = true;
  } else {
    if (form.typeIds.length === 0) return { error: "Pick at least one meeting type, or allow all." };
    terms.typeIds = form.typeIds;
  }

  return { terms };
}

export function describeKeyTypes(typeIds: string[] | null, types: { id: string; name: string }[]): string {
  if (typeIds === null) return "All types";
  return typeIds.map(id => types.find(t => t.id === id)?.name ?? `${id} (removed)`).join(", ");
}

/**
 * Catches emptied number fields before they reach the wire: JSON turns NaN into
 * null, and a null default for uses means unlimited.
 */
export function configNumberProblem(config: {
  bufferMinutes: number;
  minLeadHours: number;
  horizonDays: number;
  keyDefaults: KeyDefaults;
}): string | null {
  const fields: [number | null, string][] = [
    [config.bufferMinutes, "Buffer"],
    [config.minLeadHours, "Minimum notice"],
    [config.horizonDays, "Booking window"],
    [config.keyDefaults.expiresInDays, "New key expiry"],
    [config.keyDefaults.maxUses, "New key uses"],
  ];
  const empty = fields.find(([value]) => value !== null && !Number.isFinite(value));
  return empty ? `${empty[1]} needs a number.` : null;
}
