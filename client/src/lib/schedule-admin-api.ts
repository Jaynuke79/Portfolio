import { type MeetingType, type Slot, callScheduleApi, describeScheduleError } from "@/lib/schedule-api";

export type TimeWindow = [string, string];
export type WeeklyHours = Record<string, TimeWindow[]>;

export interface KeyDefaults {
  expiresInDays: number;
  maxUses: number | null;
  typeIds: string[] | null;
}

export interface NotificationSettings {
  emailGuest: boolean;
  emailOwner: boolean;
  ownerEmail: string;
}

export interface BookingConfig {
  title: string;
  description: string;
  timeZone: string;
  calendarId: string;
  busyCalendarIds: string[];
  bufferMinutes: number;
  minLeadHours: number;
  horizonDays: number;
  keyDefaults: KeyDefaults;
  notifications: NotificationSettings;
  weeklyHours: WeeklyHours;
  types: MeetingType[];
}

export interface AccessKey {
  id: string;
  label: string;
  maxUses: number | null;
  uses: number;
  createdAt: string;
  expiresAt: string;
  lastUsedAt?: string;
  typeIds: string[] | null;
  status: "ok" | "expired" | "used_up";
}

export interface KeyTerms {
  label?: string;
  maxUses?: number;
  unlimitedUses?: boolean;
  expiresInDays?: number;
  expiresOn?: string;
  typeIds?: string[];
  allTypes?: boolean;
}

export interface VersionedConfig {
  config: BookingConfig;
  version: string | null;
}

const TOKEN_STORAGE = "schedule-admin-token";

export function readAdminToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function storeAdminToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_STORAGE, token);
    else sessionStorage.removeItem(TOKEN_STORAGE);
  } catch {
    /* storage unavailable: the token just won't survive a reload */
  }
}

function admin<T>(token: string, body: Record<string, unknown>): Promise<T> {
  return callScheduleApi<T>({ ...body, adminToken: token });
}

export const getConfig = (token: string) => admin<VersionedConfig>(token, { action: "getConfig" });

export const saveConfig = (token: string, config: BookingConfig, version: string | null) =>
  admin<VersionedConfig>(token, { action: "saveConfig", config, version });

export const previewSlots = (token: string, type: string) =>
  admin<{ type: string; timeZone: string; slots: Slot[] }>(token, { action: "previewSlots", type });

export const listKeys = (token: string) => admin<{ keys: AccessKey[] }>(token, { action: "listKeys" });

export const issueKey = (token: string, terms: KeyTerms) =>
  admin<AccessKey & { key: string }>(token, { action: "issueKey", ...terms });

export const updateKey = (token: string, id: string, terms: KeyTerms) =>
  admin<AccessKey>(token, { action: "updateKey", id, ...terms });

export const revokeKey = (token: string, id: string) => admin<{ revoked: string }>(token, { action: "revokeKey", id });

const FIELD_LABELS: Record<string, string> = {
  title: "Page title",
  description: "Page description",
  timeZone: "Time zone",
  bufferMinutes: "Buffer",
  minLeadHours: "Minimum notice",
  horizonDays: "Booking window",
  types: "Meeting types",
  weeklyHours: "Weekly hours",
  keyDefaults: "New key defaults",
  notifications: "Confirmation emails",
};

const ADMIN_ERRORS: Record<string, string> = {
  forbidden: "That admin token isn't valid.",
  config_conflict: "These settings were changed in another tab. Reload to get the latest before saving.",
  invalid_window: "every window needs a start before its end, in HH:MM.",
  overlapping_windows: "two windows on the same day overlap.",
  invalid_type_id: "a type id is invalid.",
  duplicate_type_id: "two meeting types share an id.",
  invalid_type_name: "every meeting type needs a name (60 characters max).",
  invalid_type_duration: "durations must be 5–480 minutes, in steps of 5.",
  invalid_expiry: "expiry must be between 1 and 365 days, and in the future.",
  invalid_uses: "uses must be a whole number of at least 1.",
  invalid_types: "pick at least one meeting type, or allow all.",
  unknown_type: "it refers to a meeting type that doesn't exist.",
  invalid_key_id: "that key no longer exists.",
  invalid_config: "the value is out of range.",
  invalid_email: "enter a valid email address, or leave it blank.",
};

/** Messages for admin failures, including the `error:field` codes from saveConfig. */
export function describeAdminError(code: string): string {
  const [error, field] = code.split(":");
  if (field) return `${FIELD_LABELS[field] ?? field}: ${ADMIN_ERRORS[error] ?? "the value is invalid."}`;
  if (error in ADMIN_ERRORS && !["forbidden", "config_conflict"].includes(error)) {
    const message = ADMIN_ERRORS[error];
    return message.charAt(0).toUpperCase() + message.slice(1);
  }
  return ADMIN_ERRORS[error] ?? describeScheduleError(error);
}
