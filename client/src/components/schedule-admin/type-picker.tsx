import type { MeetingType } from "@/lib/schedule-api";

export interface TypeSelection {
  allTypes: boolean;
  typeIds: string[];
}

interface Props {
  selection: TypeSelection;
  onChange: (next: TypeSelection) => void;
  types: MeetingType[];
  allLabel?: string;
}

/**
 * "All types" or a subset. Leaving "all" starts from every current type ticked,
 * so the narrowing is explicit and the list is never silently empty.
 */
export default function TypePicker({ selection, onChange, types, allLabel = "All types, including ones added later" }: Props) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-medium">Meeting types</legend>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={selection.allTypes}
          onChange={e => onChange({ allTypes: e.target.checked, typeIds: e.target.checked ? [] : types.map(t => t.id) })}
          className="h-4 w-4 accent-[hsl(var(--brand))]"
        />
        {allLabel}
      </label>
      {!selection.allTypes && (
        <div className="flex flex-wrap gap-4 pl-6 text-sm">
          {types.map(type => (
            <label key={type.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selection.typeIds.includes(type.id)}
                onChange={e =>
                  onChange({
                    allTypes: false,
                    typeIds: e.target.checked
                      ? [...selection.typeIds, type.id]
                      : selection.typeIds.filter(id => id !== type.id),
                  })
                }
                className="h-4 w-4 accent-[hsl(var(--brand))]"
              />
              {type.name} ({type.durationMinutes} min)
            </label>
          ))}
        </div>
      )}
      {!selection.allTypes && selection.typeIds.length === 0 && (
        <p className="text-sm text-destructive">Pick at least one meeting type, or allow all.</p>
      )}
    </fieldset>
  );
}
