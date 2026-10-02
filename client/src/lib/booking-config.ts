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
 * later renames.
 */
export function newTypeId(name: string, existingIds: string[]): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "meeting";
  let id = base;
  for (let n = 2; existingIds.includes(id); n++) id = `${base}-${n}`;
  return id;
}

export interface KeyTermsForm {
  label: string;
  unlimitedUses: boolean;
  uses: string;
  expiryMode: "days" | "date";
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

export function formFromKey(key: AccessKey, timeZone: string): KeyTermsForm {
  return {
    label: key.label,
    unlimitedUses: key.maxUses === null,
    uses: String(key.maxUses ?? Math.max(1, key.uses)),
    expiryMode: "date",
    days: "14",
    date: new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(key.expiresAt)),
    allTypes: key.typeIds === null,
    typeIds: key.typeIds ?? [],
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
  } else {
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
