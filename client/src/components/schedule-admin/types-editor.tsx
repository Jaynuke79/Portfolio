import { useId, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DURATION_OPTIONS, newTypeId } from "@/lib/booking-config";
import type { MeetingType } from "@/lib/schedule-api";

const SELECT_CLASS =
  "h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring";

function DurationSelect({ id, value, onChange, label }: { id?: string; value: number; onChange: (v: number) => void; label?: string }) {
  const options = DURATION_OPTIONS.includes(value) ? DURATION_OPTIONS : [...DURATION_OPTIONS, value].sort((a, b) => a - b);
  return (
    <select id={id} aria-label={label} value={value} onChange={e => onChange(Number(e.target.value))} className={SELECT_CLASS}>
      {options.map(minutes => (
        <option key={minutes} value={minutes}>{minutes} min</option>
      ))}
    </select>
  );
}

interface Props {
  types: MeetingType[];
  /** Ids a new type must not take: retired ones, and saved ones removed from this draft that keys may still name. */
  reservedTypeIds?: string[];
  defaultTypeIds: string[] | null;
  onChange: (next: MeetingType[]) => void;
}

export default function TypesEditor({ types, reservedTypeIds = [], defaultTypeIds, onChange }: Props) {
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState(30);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const newNameId = useId();
  const newDurationId = useId();
  const warningId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());

  const widensDefaults = (id: string) =>
    defaultTypeIds !== null && !defaultTypeIds.some(d => d !== id && types.some(t => t.id === d));

  const cancelRemove = (id: string) => {
    setConfirmRemoveId(null);
    removeButtons.current.get(id)?.focus();
  };

  const confirmRemove = (id: string) => {
    setConfirmRemoveId(null);
    onChange(types.filter(t => t.id !== id));
    listRef.current?.focus();
  };

  const update = (id: string, patch: Partial<MeetingType>) =>
    onChange(types.map(t => (t.id === id ? { ...t, ...patch } : t)));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    onChange([...types, { id: newTypeId(name, types.map(t => t.id), reservedTypeIds), name, durationMinutes: newDuration }]);
    setNewName("");
  };

  return (
    <div className="grid gap-6">
      <ul ref={listRef} tabIndex={-1} aria-label="Meeting types" className="divide-y divide-border rounded-md border border-border focus-visible:outline-hidden">
        {types.map(type => {
          const onlyOne = types.length === 1;
          const label = type.name || type.id;
          return (
            <li key={type.id} className="flex flex-wrap items-center gap-3 p-4">
              <Input
                value={type.name}
                maxLength={60}
                aria-label={`Name for ${type.id}`}
                onChange={e => update(type.id, { name: e.target.value })}
                className="h-10 min-w-0 flex-1"
              />
              <DurationSelect
                label={`Duration for ${type.name || type.id}`}
                value={type.durationMinutes}
                onChange={durationMinutes => update(type.id, { durationMinutes })}
              />
              <code className="text-xs text-muted-foreground" title="Permanent id used by access keys">{type.id}</code>
              <Button
                ref={el => {
                  if (el) removeButtons.current.set(type.id, el);
                  else removeButtons.current.delete(type.id);
                }}
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${label}`}
                aria-disabled={onlyOne}
                title={onlyOne ? "Keep at least one meeting type" : undefined}
                className={onlyOne ? "opacity-40" : undefined}
                onClick={() => !onlyOne && setConfirmRemoveId(type.id)}
              >
                <Trash2 />
              </Button>
              {confirmRemoveId === type.id && (
                <div
                  className="grid w-full gap-3 rounded-md bg-muted p-3"
                  onKeyDown={e => {
                    if (e.key !== "Escape") return;
                    e.preventDefault();
                    cancelRemove(type.id);
                  }}
                >
                  <p id={warningId} className="text-sm">
                    Remove {label}? Access keys limited to this type won't be able to book it.
                    {widensDefaults(type.id) && " It's the only type in your new-key defaults, so new keys will allow all types."}
                    {" "}Nothing changes until you save.
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" variant="destructive" size="sm" autoFocus aria-describedby={warningId} onClick={() => confirmRemove(type.id)}>
                      Remove type
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => cancelRemove(type.id)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <form onSubmit={add} className="flex flex-wrap items-end gap-3">
        <div className="grid flex-1 gap-2">
          <Label htmlFor={newNameId}>New meeting type</Label>
          <Input id={newNameId} value={newName} maxLength={60} onChange={e => setNewName(e.target.value)} placeholder="e.g. Resume review" className="h-10" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={newDurationId}>Duration</Label>
          <DurationSelect id={newDurationId} value={newDuration} onChange={setNewDuration} />
        </div>
        <Button type="submit" variant="outline" disabled={!newName.trim()}>
          <Plus />
          Add type
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Removing a type hides it from every key; keys limited to only removed types stop working until you edit them.
      </p>
    </div>
  );
}
