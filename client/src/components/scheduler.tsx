import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarCheck, Clock, KeyRound, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SchedulerCalendar from "@/components/scheduler-calendar";
import { goHome } from "@/lib/hash-route";
import { cn } from "@/lib/utils";
import {
  type BookingInfo,
  type ConfirmResult,
  type MeetingType,
  type Slot,
  KEY_ERRORS,
  ScheduleApiError,
  confirmBooking,
  describeScheduleError,
  fetchBookingInfo,
  fetchSlots,
  isSchedulingConfigured,
} from "@/lib/schedule-api";
import {
  addMonths,
  dateKeyInZone,
  formatSlotDateTime,
  groupSlotsByDate,
  monthFetchRange,
  visitorTimeZone,
} from "@/lib/slot-calendar";

type Step = "key" | "type" | "time" | "details" | "confirmed";

const KEY_STORAGE = "schedule-access-key";
const HONEYPOT_FIELD = "website";

function readStoredKey(): string {
  try {
    return sessionStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

function storeKey(value: string | null) {
  try {
    if (value) sessionStorage.setItem(KEY_STORAGE, value);
    else sessionStorage.removeItem(KEY_STORAGE);
  } catch {
    /* storage unavailable: the key just won't survive a reload */
  }
}

function errorCode(err: unknown): string {
  return err instanceof ScheduleApiError ? err.code : "server_error";
}

function Stepper({ labels, current }: { labels: string[]; current: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2 text-sm">
      {labels.map((label, i) => (
        <li
          key={label}
          aria-current={i === current ? "step" : undefined}
          className={cn("flex items-center gap-2", i === current ? "text-foreground" : "text-muted-foreground")}
        >
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs",
              i <= current ? "bg-brand text-primary-foreground" : "bg-muted"
            )}
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <span>{label}</span>
          {i < labels.length - 1 && <span className="mx-1 h-px w-6 bg-border" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}

function Shell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12 text-foreground">
      <Card className={cn("w-full rounded-lg border-border bg-card shadow-none", wide ? "max-w-3xl" : "max-w-md")}>
        <CardContent className="p-6 sm:p-8">{children}</CardContent>
      </Card>
    </div>
  );
}

export default function Scheduler() {
  const [accessKey, setAccessKey] = useState(readStoredKey);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [checkingKey, setCheckingKey] = useState(() => Boolean(readStoredKey()));
  const [info, setInfo] = useState<BookingInfo | null>(null);

  const [step, setStep] = useState<Step>("key");
  const [type, setType] = useState<MeetingType | null>(null);
  const [timeZone, setTimeZone] = useState(visitorTimeZone);
  const [view, setView] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsView, setSlotsView] = useState<typeof view | null>(null);
  const autoAdvanced = useRef(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [takenNotice, setTakenNotice] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ConfirmResult | null>(null);

  const rejectKey = useCallback((code: string) => {
    storeKey(null);
    setAccessKey("");
    setInfo(null);
    setStep("key");
    setKeyError(describeScheduleError(code));
  }, []);

  const unlock = useCallback(
    async (candidate: string) => {
      setCheckingKey(true);
      setKeyError(null);
      try {
        const booking = await fetchBookingInfo(candidate);
        storeKey(candidate);
        setAccessKey(candidate);
        setInfo(booking);
        if (booking.types.length === 1) {
          setType(booking.types[0]);
          setStep("time");
        } else {
          setStep("type");
        }
      } catch (err) {
        const code = errorCode(err);
        if (KEY_ERRORS.has(code)) rejectKey(code);
        else setKeyError(describeScheduleError(code));
      } finally {
        setCheckingKey(false);
      }
    },
    [rejectKey]
  );

  useEffect(() => {
    // Only the key restored from storage on first render is auto-checked.
    const restored = readStoredKey();
    if (restored) void unlock(restored);
  }, [unlock]);

  useEffect(() => {
    if (step !== "time" || !type || !accessKey) return;
    let cancelled = false;
    const { start, end } = monthFetchRange(view.year, view.month);
    setLoadingSlots(true);
    setSlotsError(null);
    fetchSlots(accessKey, type.id, start, end)
      .then(found => {
        if (cancelled) return;
        setSlots(found);
        setSlotsView(view);
      })
      .catch(err => {
        if (cancelled) return;
        const code = errorCode(err);
        if (KEY_ERRORS.has(code)) rejectKey(code);
        else setSlotsError(describeScheduleError(code));
        setSlots([]);
      })
      .finally(() => !cancelled && setLoadingSlots(false));
    return () => {
      cancelled = true;
    };
  }, [step, type, accessKey, view, reloadToken, rejectKey]);

  const slotsByDate = useMemo(() => {
    const prefix = `${view.year}-${String(view.month + 1).padStart(2, "0")}-`;
    const inMonth = new Map<string, Slot[]>();
    groupSlotsByDate(slots, timeZone).forEach((daySlots, dateKey) => {
      if (dateKey.startsWith(prefix)) inMonth.set(dateKey, daySlots);
    });
    return inMonth;
  }, [slots, timeZone, view]);

  const monthBounds = useMemo(() => {
    const todayKey = dateKeyInZone(Date.now(), timeZone);
    const lastKey = dateKeyInZone(Date.now() + (info?.horizonDays ?? 0) * 86400000, timeZone);
    const viewKey = `${view.year}-${String(view.month + 1).padStart(2, "0")}`;
    return { canGoBack: viewKey > todayKey.slice(0, 7), canGoForward: viewKey < lastKey.slice(0, 7) };
  }, [timeZone, info, view]);

  // A visitor arriving late in a month would otherwise land on an empty grid;
  // step forward once, and only on data fetched for the month on screen.
  useEffect(() => {
    if (autoAdvanced.current || slotsView !== view || loadingSlots || slotsError) return;
    if (slotsByDate.size === 0 && monthBounds.canGoForward) {
      autoAdvanced.current = true;
      setView(v => addMonths(v.year, v.month, 1));
    }
  }, [slotsView, view, loadingSlots, slotsError, slotsByDate, monthBounds]);

  const stepLabels = [...(info && info.types.length > 1 ? ["Type"] : []), "Time", "Details"];
  const stepIndex = stepLabels.indexOf(step === "type" ? "Type" : step === "time" ? "Time" : "Details");

  const changeMonth = (delta: number) => {
    setView(v => addMonths(v.year, v.month, delta));
    setSelectedDate(null);
  };

  const changeTimeZone = (zone: string) => {
    setTimeZone(zone);
    setSelectedDate(null);
  };

  const chooseSlot = (slot: Slot) => {
    setTakenNotice(null);
    setSelectedSlot(slot);
    setSubmitError(null);
    setStep("details");
  };

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void unlock(keyInput.trim());
  };

  const handleConfirm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSlot || !type) return;
    const honeypot = (e.currentTarget.elements.namedItem(HONEYPOT_FIELD) as HTMLInputElement | null)?.value ?? "";
    setSubmitting(true);
    setSubmitError(null);
    try {
      const confirmed = await confirmBooking({
        accessKey,
        typeId: type.id,
        slot: selectedSlot,
        name,
        email,
        notes,
        honeypot,
      });
      storeKey(null);
      setResult(confirmed);
      setStep("confirmed");
    } catch (err) {
      const code = errorCode(err);
      if (KEY_ERRORS.has(code)) {
        rejectKey(code);
      } else if (code === "slot_taken") {
        setTakenNotice(describeScheduleError(code));
        setSelectedSlot(null);
        setReloadToken(t => t + 1);
        setStep("time");
      } else {
        setSubmitError(describeScheduleError(code));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSchedulingConfigured()) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <p className="text-muted-foreground">Scheduling is not available right now.</p>
      </div>
    );
  }

  if (step === "key") {
    return (
      <Shell>
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-brand-soft">
            <KeyRound className="h-5 w-5 text-brand" aria-hidden="true" />
          </div>
          <h1 className="mb-1 text-2xl font-semibold tracking-tight">Schedule a meeting</h1>
          <p className="text-sm text-muted-foreground">Enter the access key you were given to see open times.</p>
        </div>
        <form onSubmit={handleKeySubmit} className="space-y-4">
          <div>
            <Label htmlFor="schedule-key" className="mb-2 block">Access key</Label>
            <Input
              id="schedule-key"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              className="h-11 font-mono uppercase tracking-wider"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-invalid={Boolean(keyError)}
              aria-describedby={keyError ? "schedule-key-error" : undefined}
              autoFocus
              required
            />
            {keyError && (
              <p id="schedule-key-error" role="alert" className="mt-2 text-sm text-destructive">{keyError}</p>
            )}
          </div>
          <Button type="submit" disabled={checkingKey || !keyInput.trim()} className="h-11 w-full active:scale-[0.98]">
            {checkingKey ? "Checking…" : "Continue"}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={goHome}>
            <ArrowLeft className="h-4 w-4" />
            Back to portfolio
          </Button>
        </form>
      </Shell>
    );
  }

  if (step === "confirmed" && result && type) {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-brand-soft">
            <CalendarCheck className="h-5 w-5 text-brand" aria-hidden="true" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight" tabIndex={-1} ref={el => el?.focus()}>
            You're booked
          </h1>
          <p className="text-sm text-muted-foreground">{type.name}</p>
          <p className="mt-1 font-medium">{formatSlotDateTime(result.start, timeZone)}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            A calendar invite is on its way to <span className="text-foreground">{email.trim()}</span>.
          </p>
          {result.meetLink && (
            <Button asChild variant="outline" className="mt-6">
              <a href={result.meetLink} target="_blank" rel="noopener noreferrer">
                <Video className="h-4 w-4" />
                Google Meet link
              </a>
            </Button>
          )}
          <Button variant="ghost" className="mt-4" onClick={goHome}>
            <ArrowLeft className="h-4 w-4" />
            Back to portfolio
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell wide={step === "time"}>
      {info && (
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{info.title}</h1>
          {info.description && <p className="mt-1 text-sm text-muted-foreground">{info.description}</p>}
        </header>
      )}
      <Stepper labels={stepLabels} current={stepIndex} />

      {step === "type" && info && (
        <ul className="grid gap-3">
          {info.types.map(t => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  setType(t);
                  setSelectedDate(null);
                  setStep("time");
                }}
                className="flex w-full items-center justify-between rounded-md border border-border p-4 text-left transition-colors hover:border-brand focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-medium">{t.name}</span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {t.durationMinutes} min
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {step === "time" && type && (
        <>
          {(takenNotice || slotsError) && (
            <p role="alert" className="mb-4 text-sm text-destructive">{takenNotice ?? slotsError}</p>
          )}
          <SchedulerCalendar
            year={view.year}
            month={view.month}
            canGoBack={monthBounds.canGoBack}
            canGoForward={monthBounds.canGoForward}
            onMonthChange={changeMonth}
            slotsByDate={slotsByDate}
            loading={loadingSlots}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSelectSlot={chooseSlot}
            timeZone={timeZone}
            onTimeZoneChange={changeTimeZone}
          />
          {info && info.types.length > 1 && (
            <Button variant="ghost" className="mt-6" onClick={() => setStep("type")}>
              <ArrowLeft className="h-4 w-4" />
              Change meeting type
            </Button>
          )}
        </>
      )}

      {step === "details" && selectedSlot && type && (
        <form onSubmit={handleConfirm} className="space-y-5">
          <div className="rounded-md bg-brand-soft p-4 text-sm">
            <p className="font-medium text-brand">{type.name}</p>
            <p className="mt-1">{formatSlotDateTime(selectedSlot.start, timeZone)}</p>
          </div>
          <div className="absolute left-[-9999px] h-px w-px overflow-hidden" aria-hidden="true">
            <label htmlFor={HONEYPOT_FIELD}>Leave this field empty</label>
            <input id={HONEYPOT_FIELD} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="schedule-name">Name</Label>
              <Input id="schedule-name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" maxLength={100} required className="h-11" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="schedule-email">Email</Label>
              <Input id="schedule-email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required className="h-11" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="schedule-notes">What would you like to discuss? (optional)</Label>
            <Textarea id="schedule-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={4} maxLength={1000} className="resize-y" />
          </div>
          {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => setStep("time")} className="h-11">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button type="submit" disabled={submitting} className="h-11 flex-1 active:scale-[0.98]">
              {submitting ? "Booking…" : "Confirm booking"}
            </Button>
          </div>
        </form>
      )}
    </Shell>
  );
}
