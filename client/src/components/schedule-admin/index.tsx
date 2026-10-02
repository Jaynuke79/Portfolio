import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import KeysManager from "@/components/schedule-admin/keys-manager";
import OpenTimesPreview from "@/components/schedule-admin/open-times-preview";
import RulesEditor from "@/components/schedule-admin/rules-editor";
import TypesEditor from "@/components/schedule-admin/types-editor";
import WeeklyHoursEditor from "@/components/schedule-admin/weekly-hours-editor";
import { configNumberProblem } from "@/lib/booking-config";
import { goHome } from "@/lib/hash-route";
import { type MeetingType, ScheduleApiError, isSchedulingConfigured } from "@/lib/schedule-api";
import {
  type BookingConfig,
  type VersionedConfig,
  describeAdminError,
  getConfig,
  readAdminToken,
  saveConfig,
  storeAdminToken,
} from "@/lib/schedule-admin-api";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "availability", label: "Availability" },
  { id: "types", label: "Meeting types" },
  { id: "rules", label: "Booking rules" },
  { id: "keys", label: "Access keys" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function errorCode(err: unknown): string {
  return err instanceof ScheduleApiError ? err.code : "server_error";
}

export default function ScheduleAdmin() {
  const baseId = useId();
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [checking, setChecking] = useState(() => Boolean(readAdminToken()));
  const [saved, setSaved] = useState<VersionedConfig | null>(null);
  const [draft, setDraft] = useState<BookingConfig | null>(null);
  const [tab, setTab] = useState<TabId>("availability");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const dirty = Boolean(saved && draft && JSON.stringify(saved.config) !== JSON.stringify(draft));

  const signOut = useCallback((message: string | null = null) => {
    storeAdminToken(null);
    setToken("");
    setSaved(null);
    setDraft(null);
    setGateError(message);
  }, []);

  const unlock = useCallback(
    async (candidate: string) => {
      setChecking(true);
      setGateError(null);
      try {
        const loaded = await getConfig(candidate);
        storeAdminToken(candidate);
        setToken(candidate);
        setSaved(loaded);
        setDraft(loaded.config);
        setConflict(false);
        setSaveError(null);
      } catch (err) {
        signOut(describeAdminError(errorCode(err)));
      } finally {
        setChecking(false);
      }
    },
    [signOut]
  );

  useEffect(() => {
    const restored = readAdminToken();
    if (restored) void unlock(restored);
  }, [unlock]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const patchDraft = (patch: Partial<BookingConfig>) => {
    setJustSaved(false);
    setDraft(d => (d ? { ...d, ...patch } : d));
  };

  // Removing a type must not leave the new-key defaults pointing at it.
  const changeTypes = (types: MeetingType[]) => {
    if (!draft) return;
    const ids = types.map(t => t.id);
    const defaultIds = draft.keyDefaults.typeIds?.filter(id => ids.includes(id)) ?? null;
    patchDraft({ types, keyDefaults: { ...draft.keyDefaults, typeIds: defaultIds && defaultIds.length ? defaultIds : null } });
  };

  const save = async () => {
    if (!draft || !saved) return;
    const problem = configNumberProblem(draft);
    if (problem) return setSaveError(problem);
    setSaving(true);
    setSaveError(null);
    try {
      const result = await saveConfig(token, draft, saved.version);
      setSaved(result);
      setDraft(result.config);
      setJustSaved(true);
    } catch (err) {
      const code = errorCode(err);
      if (code === "forbidden") return signOut(describeAdminError(code));
      setConflict(code === "config_conflict");
      setSaveError(describeAdminError(code));
    } finally {
      setSaving(false);
    }
  };

  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = TABS[(index + delta + TABS.length) % TABS.length];
    setTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  if (!isSchedulingConfigured()) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <p className="text-muted-foreground">Scheduling is not available right now.</p>
      </div>
    );
  }

  if (!token || !saved || !draft) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 text-foreground">
        <Card className="w-full max-w-md rounded-lg border-border bg-card shadow-none">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-brand-soft">
                <ShieldCheck className="h-5 w-5 text-brand" aria-hidden="true" />
              </div>
              <h1 className="mb-1 text-2xl font-semibold tracking-tight">Scheduling admin</h1>
              <p className="text-sm text-muted-foreground">Enter your admin token to manage availability, meeting types and keys.</p>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                void unlock(tokenInput.trim());
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor={`${baseId}-token`} className="mb-2 block">Admin token</Label>
                <Input
                  id={`${baseId}-token`}
                  type="password"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  autoComplete="current-password"
                  aria-invalid={Boolean(gateError)}
                  aria-describedby={gateError ? `${baseId}-token-error` : undefined}
                  autoFocus
                  required
                  className="h-11"
                />
                {gateError && <p id={`${baseId}-token-error`} role="alert" className="mt-2 text-sm text-destructive">{gateError}</p>}
              </div>
              <Button type="submit" disabled={checking || !tokenInput.trim()} className="h-11 w-full">
                {checking ? "Checking…" : "Sign in"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={goHome}>
                <ArrowLeft />
                Back to portfolio
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const configTab = tab !== "keys";

  return (
    <div className="min-h-[100dvh] bg-background pb-28 text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-5">
          <h1 className="text-xl font-semibold tracking-tight">Scheduling admin</h1>
          <Button type="button" variant="ghost" size="sm" onClick={() => signOut()}>
            <LogOut />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-8 px-4 py-8">
        <div role="tablist" aria-label="Scheduling settings" className="flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={el => {
                tabRefs.current[t.id] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`${baseId}-panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={e => onTabKeyDown(e, i)}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                tab === t.id ? "border-brand font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`${baseId}-panel-${tab}`} aria-labelledby={`${baseId}-tab-${tab}`} tabIndex={0} className="focus-visible:outline-hidden">
          {tab === "availability" && (
            <div className="grid gap-8">
              <div>
                <h2 className="text-lg font-semibold">Weekly hours</h2>
                <p className="text-sm text-muted-foreground">
                  When you take meetings, in {draft.timeZone.replace(/_/g, " ")}. Anything already on your calendar is blocked automatically.
                </p>
              </div>
              <WeeklyHoursEditor weeklyHours={draft.weeklyHours} onChange={weeklyHours => patchDraft({ weeklyHours })} />
              <OpenTimesPreview token={token} savedConfig={saved.config} version={saved.version} unsaved={dirty} />
            </div>
          )}
          {tab === "types" && (
            <div className="grid gap-6">
              <div>
                <h2 className="text-lg font-semibold">Meeting types</h2>
                <p className="text-sm text-muted-foreground">What visitors can book. Each key can be limited to some of these.</p>
              </div>
              <TypesEditor types={draft.types} onChange={changeTypes} />
            </div>
          )}
          {tab === "rules" && <RulesEditor config={draft} onChange={patchDraft} />}
          {tab === "keys" && (
            <div className="grid gap-4">
              {dirty && (
                <p className="rounded-md bg-muted p-3 text-sm">You have unsaved settings. Keys use the last saved meeting types.</p>
              )}
              <KeysManager token={token} config={saved.config} />
            </div>
          )}
        </div>
      </main>

      {configTab && (dirty || saveError || justSaved) && (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p role="status" aria-live="polite" className={cn("text-sm", saveError ? "text-destructive" : "text-muted-foreground")}>
              {saveError ?? (dirty ? "You have unsaved changes." : "Saved. Visitors see the new settings now.")}
            </p>
            <div className="flex gap-2">
              {conflict ? (
                <Button type="button" onClick={() => void unlock(token)}>Reload latest</Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={!dirty || saving}
                    onClick={() => {
                      setDraft(saved.config);
                      setSaveError(null);
                    }}
                  >
                    Discard
                  </Button>
                  <Button type="button" disabled={!dirty || saving} onClick={() => void save()}>
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
