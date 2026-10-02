import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TypePicker from "@/components/schedule-admin/type-picker";
import type { KeyTermsForm } from "@/lib/booking-config";
import type { MeetingType } from "@/lib/schedule-api";

interface Props {
  form: KeyTermsForm;
  onChange: (next: KeyTermsForm) => void;
  types: MeetingType[];
  showLabel?: boolean;
}

export default function KeyTermsFields({ form, onChange, types, showLabel = true }: Props) {
  const id = useId();
  const set = (patch: Partial<KeyTermsForm>) => onChange({ ...form, ...patch });

  return (
    <div className="grid gap-5">
      {showLabel && (
        <div className="grid gap-2">
          <Label htmlFor={`${id}-label`}>Private label</Label>
          <Input id={`${id}-label`} value={form.label} maxLength={100} onChange={e => set({ label: e.target.value })} placeholder="e.g. Recruiter at Acme" className="h-10" />
        </div>
      )}

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Uses</legend>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name={`${id}-uses`} checked={!form.unlimitedUses} onChange={() => set({ unlimitedUses: false })} className="accent-[hsl(var(--brand))]" />
            Limited to
          </label>
          <Input
            type="number"
            min={1}
            value={form.uses}
            aria-label="Number of bookings allowed"
            disabled={form.unlimitedUses}
            onChange={e => set({ uses: e.target.value })}
            className="h-10 w-24"
          />
          <label className="flex items-center gap-2">
            <input type="radio" name={`${id}-uses`} checked={form.unlimitedUses} onChange={() => set({ unlimitedUses: true })} className="accent-[hsl(var(--brand))]" />
            Unlimited
          </label>
        </div>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Expires</legend>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name={`${id}-expiry`} checked={form.expiryMode === "days"} onChange={() => set({ expiryMode: "days" })} className="accent-[hsl(var(--brand))]" />
            In
          </label>
          <Input
            type="number"
            min={1}
            max={365}
            value={form.days}
            aria-label="Days until the key expires"
            disabled={form.expiryMode !== "days"}
            onChange={e => set({ days: e.target.value })}
            className="h-10 w-24"
          />
          <span className="text-muted-foreground">days</span>
          <label className="flex items-center gap-2">
            <input type="radio" name={`${id}-expiry`} checked={form.expiryMode === "date"} onChange={() => set({ expiryMode: "date" })} className="accent-[hsl(var(--brand))]" />
            At the end of
          </label>
          <Input
            type="date"
            value={form.date}
            aria-label="Expiry date"
            disabled={form.expiryMode !== "date"}
            onChange={e => set({ date: e.target.value })}
            className="h-10 w-44"
          />
        </div>
      </fieldset>

      <TypePicker
        selection={{ allTypes: form.allTypes, typeIds: form.typeIds }}
        onChange={selection => set(selection)}
        types={types}
      />
    </div>
  );
}
