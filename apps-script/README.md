# Scheduling backend (Google Apps Script)

Serves live availability and creates Google Calendar events with a Meet link for
the booking page at `https://j2a3e.com/#schedule`. Runs as the calendar owner, so no
OAuth client or stored tokens are needed. Every visitor request must carry an access
key the owner issued; without one, nothing about the calendar is readable.

| File | Role |
| --- | --- |
| `Slots.js` | Pure slot math (owner time zone, buffers, lead time). Unit-tested under vitest. |
| `Config.js` | Built-in default settings and `validateBookingConfig`, which every save from the admin page passes. Unit-tested under vitest. |
| `Mail.js` | Builds the guest and owner confirmation emails (escaped HTML + plain text). Unit-tested under vitest. |
| `Keys.js` | Pure access-key helpers (format, normalize, status, per-key terms and allowed types). Unit-tested under vitest. |
| `Code.js` | `doPost` router: visitor actions `access`/`slots`/`confirm`, admin actions `getConfig`/`saveConfig`/`previewSlots`/`issueKey`/`updateKey`/`listKeys`/`revokeKey`. Tested against fake Google services in `code.test.ts`. |
| `appsscript.json` | Manifest: V8, Calendar advanced service, web-app access. |

## Deploy

1. Create a project at [script.google.com](https://script.google.com) while signed in to
   the Google account whose calendar should be booked.
2. Project Settings → check **Show "appsscript.json" manifest file**, then replace its
   contents with `appsscript.json`. Add script files named `Slots`, `Keys`, `Config`,
   `Mail` and `Code` and paste in the matching `.js` files.
3. Project Settings → Script Properties → add `ADMIN_TOKEN` with the output of
   `openssl rand -hex 32`. Keep a copy in your password manager.
4. Select `checkSetup` in the editor's function dropdown and click **Run**. Approve the
   permission prompt (Calendar, sending email as you, and your email address), then confirm the log shows `Time-zone math: OK`, a busy
   count, key defaults that aren't `INVALID`, and the address confirmation emails go to.
5. Deploy → New deployment → **Web app**, execute as **Me**, access **Anyone**.
   Approve the Calendar permission prompt and copy the `/exec` URL.
6. In the GitHub repo, Settings → Secrets and variables → Actions → **Variables**, set
   `SCHEDULE_API_URL` to that URL. For local dev, put
   `VITE_SCHEDULE_API_URL=<url>` in `client/.env.local`.

Code changes need **Deploy → Manage deployments → Edit → New version** so the `/exec`
URL keeps serving the latest code. Settings and key changes take effect immediately.

When an update adds a permission (for example `script.send_mail` for confirmation emails),
run `checkSetup` once in the editor to approve it **before** publishing the new version —
the web app can't show a consent prompt to visitors, so unapproved scopes fail at runtime.

## Admin page

Open `https://j2a3e.com/#schedule/admin` and sign in with `ADMIN_TOKEN`. Until the first
save, the built-in defaults in `Config.js` apply.

- **Availability** — weekly hours per day (several windows allowed), plus a live preview of
  the open times visitors will see over the next 14 days, read from your calendar.
- **Meeting types** — add, rename, re-time or remove types. A type's id is fixed at creation
  because keys reference it.
- **Booking rules** — page title and description, your time zone, buffer, minimum notice,
  booking window, confirmation emails (guest and/or you, and where your copy goes), and
  defaults for new keys.
- **Access keys** — issue (the key is shown once), edit expiry/uses/types, and revoke.

Saves are validated on the server and versioned: if settings changed in another tab since
you loaded them, the save is refused with an option to reload.

After 10 wrong admin tokens in 10 minutes, further wrong guesses are refused outright; the
real token always works.

Calendar ids (`calendarId`, `busyCalendarIds`) are not editable from the web; change them
by editing the `BOOKING_CONFIG` script property.

## Managing keys from the terminal

Everything on the Access keys tab is also available from the CLI:

```bash
export SCHEDULE_API_URL=<exec url> SCHEDULE_ADMIN_TOKEN=<admin token>
npm run booking-keys -- types                                   # meeting type ids + key defaults
npm run booking-keys -- issue --label "Recruiter at Acme" --types 30min --expires 2026-10-31
npm run booking-keys -- list
npm run booking-keys -- update <id> --days 7 --uses 2 --types all
npm run booking-keys -- revoke <id>
```

| Option | Meaning |
| --- | --- |
| `--label "..."` | Private note. Stored on the event's private extended properties, never in the guest's invite. |
| `--uses N` / `--uses unlimited` | Bookings allowed with the key. |
| `--days N` | Expires N days from now (max 365). |
| `--expires YYYY-MM-DD` | Expires at the end of that date in the config's `timeZone`. |
| `--types a,b` / `--types all` | Meeting type ids the key unlocks. `all` also covers types added to the config later. |

Options left off `issue` come from the new-key defaults on the Booking rules tab
(built-in fallback: 1 use, 14 days, all types). Options left off `update` keep the key's
current value, so `update <id> --label "..."` touches only the label. Extending an expired
or used-up key with `update` makes it work again.

`issue` prints the key once — only its SHA-256 hash is stored. Send the visitor
`https://j2a3e.com/#schedule` and the key. A visitor only sees the meeting types their key
unlocks, and the backend refuses slots or bookings for any other type.

## Guarantees

- Slots are computed in `timeZone` from the config; the visitor's zone only changes how
  times are displayed.
- Confirm re-reads the key record and free/busy under a script lock, so a single-use key
  books once and concurrent visitors cannot double-book (`slot_taken`).
- If any calendar in `busyCalendarIds` can't be read, no slots are offered.
- Confirmation emails are sent after the booking is committed. A failed send is logged and
  reported to the page, never turned into a failed booking. The guest's copy shows the time
  in the zone they were viewing; the private key label appears only in your copy. Gmail
  accounts can send to about 100 recipients a day through Apps Script.
- After 30 invalid keys in 10 minutes, further invalid guesses are refused outright (valid
  keys always work, so junk traffic can't lock visitors out); confirms to 3 per guest email
  per 6 hours and 20 per hour overall.
