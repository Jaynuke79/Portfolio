/*
  Confirmation emails for a new booking, built as plain data so the content and
  escaping are testable without MailApp. Guest-supplied text (name, notes) is
  escaped before it touches HTML: the owner's copy would otherwise render
  whatever markup a visitor typed.
*/

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function singleLine(text) {
  return String(text).replace(/[\r\n]+/g, ' ').trim();
}

/** "Tuesday, October 6, 2026, 9:00 AM – 9:30 AM MDT", read in `timeZone`. */
function formatMeetingWhen(startIso, endIso, timeZone) {
  const date = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(new Date(startIso));
  const time = opts => new Intl.DateTimeFormat('en-US', Object.assign({ hour: 'numeric', minute: '2-digit', timeZone }, opts));
  const start = time({}).format(new Date(startIso));
  const end = time({ timeZoneName: 'short' }).format(new Date(endIso));
  return `${date}, ${start} – ${end}`;
}

/**
 * The guest's and the owner's emails for one booking, each with replies routed
 * to the other person. A disabled or unaddressable recipient is left out.
 */
function buildConfirmationEmails({ config, type, guest, start, end, meetLink, guestTimeZone, ownerEmail, keyLabel }) {
  const settings = notificationSettings(config);
  const guestZone = guestTimeZone && isValidTimeZone(guestTimeZone) ? guestTimeZone : config.timeZone;
  const ownerWhen = formatMeetingWhen(start, end, config.timeZone);
  const guestWhen = formatMeetingWhen(start, end, guestZone);
  const name = singleLine(guest.name);
  const messages = [];

  if (settings.emailGuest) {
    const rows = [['Meeting', type.name], ['When', guestWhen]];
    if (meetLink) rows.push(['Google Meet', meetLink, true]);
    if (guest.notes) rows.push(['Your notes', guest.notes]);
    messages.push(
      Object.assign(
        {
          recipient: 'guest',
          to: guest.email,
          replyTo: ownerEmail || undefined,
          subject: `Confirmed: ${type.name} on ${guestWhen}`,
        },
        renderEmail(
          `You're booked, ${name}`,
          rows,
          'A calendar invite is on its way separately. Reply to this email if you need to reschedule.'
        )
      )
    );
  }

  if (settings.emailOwner && ownerEmail) {
    const rows = [
      ['Meeting', type.name],
      ['When', ownerWhen],
      ['Guest', `${name} <${guest.email}>`],
    ];
    if (guestZone !== config.timeZone) rows.push(['Guest time', guestWhen]);
    if (meetLink) rows.push(['Google Meet', meetLink, true]);
    if (keyLabel) rows.push(['Key', keyLabel]);
    if (guest.notes) rows.push(['Notes', guest.notes]);
    messages.push(
      Object.assign(
        {
          recipient: 'owner',
          to: ownerEmail,
          replyTo: guest.email,
          subject: `New booking: ${type.name} with ${name} on ${ownerWhen}`,
        },
        renderEmail(`${name} booked a ${type.name}`, rows, 'Reply to this email to reach the guest directly.')
      )
    );
  }

  return messages;
}
