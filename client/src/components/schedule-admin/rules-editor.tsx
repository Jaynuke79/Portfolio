import { useId, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import TypePicker from "@/components/schedule-admin/type-picker";
import type { BookingConfig, KeyDefaults, NotificationSettings } from "@/lib/schedule-admin-api";
import { timeZoneOptions } from "@/lib/slot-calendar";

function NumberField({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  inputClassName = "h-10",
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  inputClassName?: string;
}) {
  const id = useId();
  return (
    <div className="grid content-start gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={Number.isNaN(value) ? "" : value}
        onChange={e => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
        aria-describedby={`${id}-hint`}
        className={inputClassName}
      />
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

interface Props {
  config: BookingConfig;
  onChange: (patch: Partial<BookingConfig>) => void;
}

export default function RulesEditor({ config, onChange }: Props) {
  const id = useId();
  const zones = useMemo(() => timeZoneOptions(config.timeZone), [config.timeZone]);
  const defaults = config.keyDefaults;
  const setDefaults = (patch: Partial<KeyDefaults>) => onChange({ keyDefaults: { ...defaults, ...patch } });
  const notifications = config.notifications;
  const setNotifications = (patch: Partial<NotificationSettings>) =>
    onChange({ notifications: { ...notifications, ...patch } });

  return (
    <div className="grid gap-10">
      <section className="grid gap-5">
        <h3 className="text-base font-semibold">Booking page</h3>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-title`}>Title</Label>
          <Input id={`${id}-title`} value={config.title} maxLength={100} onChange={e => onChange({ title: e.target.value })} className="h-10" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-description`}>Description</Label>
          <Textarea id={`${id}-description`} value={config.description} maxLength={500} rows={3} onChange={e => onChange({ description: e.target.value })} />
        </div>
      </section>

      <section className="grid gap-5">
        <h3 className="text-base font-semibold">Scheduling rules</h3>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-zone`}>Your time zone</Label>
          <select
            id={`${id}-zone`}
            value={config.timeZone}
            onChange={e => onChange({ timeZone: e.target.value })}
            aria-describedby={`${id}-zone-hint`}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            {zones.map(zone => (
              <option key={zone} value={zone}>{zone.replace(/_/g, " ")}</option>
            ))}
          </select>
          <p id={`${id}-zone-hint`} className="text-xs text-muted-foreground">Weekly hours are read in this zone.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <NumberField label="Buffer (minutes)" hint="Kept free before and after every busy block." value={config.bufferMinutes} min={0} max={240} onChange={bufferMinutes => onChange({ bufferMinutes })} />
          <NumberField label="Minimum notice (hours)" hint="How soon a meeting can be booked." value={config.minLeadHours} min={0} max={720} onChange={minLeadHours => onChange({ minLeadHours })} />
          <NumberField label="Booking window (days)" hint="How far ahead visitors can book." value={config.horizonDays} min={1} max={365} onChange={horizonDays => onChange({ horizonDays })} />
        </div>
      </section>

      <section className="grid gap-5">
        <div>
          <h3 className="text-base font-semibold">Confirmation emails</h3>
          <p className="text-sm text-muted-foreground">Sent when a booking is confirmed, in addition to the calendar invite.</p>
        </div>
        <div className="grid gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={notifications.emailGuest}
              onChange={e => setNotifications({ emailGuest: e.target.checked })}
              className="h-4 w-4 accent-[hsl(var(--brand))]"
            />
            Email the guest a confirmation (in their time zone, replies come to you)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={notifications.emailOwner}
              onChange={e => setNotifications({ emailOwner: e.target.checked })}
              className="h-4 w-4 accent-[hsl(var(--brand))]"
            />
            Email me about each new booking (replies go to the guest)
          </label>
        </div>
        <div className="grid content-start gap-2 sm:max-w-sm">
          <Label htmlFor={`${id}-owner-email`}>Send my copy to</Label>
          <Input
            id={`${id}-owner-email`}
            type="email"
            value={notifications.ownerEmail}
            disabled={!notifications.emailOwner}
            placeholder="The Google account running the backend"
            onChange={e => setNotifications({ ownerEmail: e.target.value })}
            aria-describedby={`${id}-owner-email-hint`}
            className="h-10"
          />
          <p id={`${id}-owner-email-hint`} className="text-xs text-muted-foreground">
            Leave blank to use the account that deployed the scheduling backend.
          </p>
        </div>
      </section>

      <section className="grid gap-5">
        <div>
          <h3 className="text-base font-semibold">New key defaults</h3>
          <p className="text-sm text-muted-foreground">Pre-filled when you issue a key here, and used by the CLI for any option you leave out.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            label="Expires after (days)"
            hint="Between 1 and 365."
            value={defaults.expiresInDays}
            min={1}
            max={365}
            onChange={expiresInDays => setDefaults({ expiresInDays })}
            inputClassName="h-10 w-24"
          />
          <div className="grid content-start gap-2">
            <Label htmlFor={`${id}-uses`}>Uses</Label>
            <div className="flex items-center gap-3">
              <Input
                id={`${id}-uses`}
                type="number"
                min={1}
                disabled={defaults.maxUses === null}
                value={defaults.maxUses === null || Number.isNaN(defaults.maxUses) ? "" : defaults.maxUses}
                onChange={e => setDefaults({ maxUses: e.target.value === "" ? NaN : Number(e.target.value) })}
                aria-describedby={`${id}-uses-hint`}
                className="h-10 w-24"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={defaults.maxUses === null}
                  onChange={e => setDefaults({ maxUses: e.target.checked ? null : 1 })}
                  className="h-4 w-4 accent-[hsl(var(--brand))]"
                />
                Unlimited
              </label>
            </div>
            <p id={`${id}-uses-hint`} className="text-xs text-muted-foreground">Bookings allowed per key.</p>
          </div>
        </div>
        <TypePicker
          selection={{ allTypes: defaults.typeIds === null, typeIds: defaults.typeIds ?? [] }}
          onChange={({ allTypes, typeIds }) => setDefaults({ typeIds: allTypes ? null : typeIds })}
          types={config.types}
          allLabel="All types"
        />
      </section>
    </div>
  );
}
