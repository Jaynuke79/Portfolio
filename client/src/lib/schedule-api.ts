export interface MeetingType {
  id: string;
  name: string;
  durationMinutes: number;
}

export interface BookingInfo {
  title: string;
  description: string;
  types: MeetingType[];
  horizonDays: number;
}

export interface Slot {
  start: string;
  end: string;
}

export interface ConfirmResult {
  start: string;
  end?: string;
  meetLink: string | null;
  emailed?: { guest: boolean; owner: boolean };
}

export interface ConfirmInput {
  accessKey: string;
  typeId: string;
  slot: Slot;
  name: string;
  email: string;
  notes: string;
  honeypot: string;
  guestTimeZone: string;
}

export class ScheduleApiError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

const API_URL: string | undefined = import.meta.env.VITE_SCHEDULE_API_URL;

export const KEY_ERRORS = new Set(["invalid_key", "key_expired", "key_used_up", "key_no_types"]);

const ERROR_MESSAGES: Record<string, string> = {
  invalid_key: "That key wasn't recognized. Check it and try again.",
  key_expired: "That key has expired. Ask for a new one.",
  key_used_up: "That key has already been used. Ask for a new one.",
  key_no_types: "That key isn't set up for any meetings right now. Ask for a new one.",
  unknown_type: "That meeting type isn't available with this key.",
  rate_limited: "Too many attempts. Please wait a few minutes and try again.",
  slot_taken: "That time was just taken. Please pick another.",
  calendar_unavailable: "Availability can't be loaded right now. Please try again later.",
  invalid_name: "Please enter your name.",
  invalid_email: "Please enter a valid email address.",
  invalid_notes: "Notes must be 1000 characters or fewer.",
};

export function describeScheduleError(code: string): string {
  return ERROR_MESSAGES[code] ?? "Something went wrong. Please try again.";
}

export function isSchedulingConfigured(): boolean {
  return Boolean(API_URL);
}

/**
 * Every call is a POST with a text/plain body: Apps Script cannot answer CORS
 * preflights, and a "simple" request never triggers one. It also keeps the
 * access key out of URLs.
 */
export async function callScheduleApi<T>(body: Record<string, unknown>): Promise<T> {
  if (!API_URL) throw new ScheduleApiError("not_configured");
  let data: { ok: boolean; error?: string } & T;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    });
    data = await res.json();
  } catch {
    throw new ScheduleApiError("network_error");
  }
  if (!data.ok) throw new ScheduleApiError(data.error ?? "server_error");
  return data;
}

export function fetchBookingInfo(accessKey: string): Promise<BookingInfo> {
  return callScheduleApi({ action: "access", key: accessKey });
}

export async function fetchSlots(accessKey: string, typeId: string, start: string, end: string): Promise<Slot[]> {
  const { slots } = await callScheduleApi<{ slots: Slot[] }>({ action: "slots", key: accessKey, type: typeId, start, end });
  return slots;
}

/**
 * The instant booked is always `start`, the one the backend's slot grid
 * produced. `guestTimeZone` only chooses how the guest's confirmation email
 * reads that instant; the backend validates it and never derives a time from it.
 */
export function buildConfirmBody({ accessKey, typeId, slot, name, email, notes, honeypot, guestTimeZone }: ConfirmInput) {
  return {
    action: "confirm",
    key: accessKey,
    type: typeId,
    start: slot.start,
    name: name.trim(),
    email: email.trim(),
    notes: notes.trim(),
    website: honeypot,
    guestTimeZone,
  };
}

export function confirmBooking(input: ConfirmInput): Promise<ConfirmResult> {
  return callScheduleApi(buildConfirmBody(input));
}
