const USAGE = `Usage:
  npm run booking-keys -- issue [options]
  npm run booking-keys -- update <id> [options]
  npm run booking-keys -- list
  npm run booking-keys -- revoke <id>
  npm run booking-keys -- types

Options (omitted ones fall back to keyDefaults on issue, or stay unchanged on update):
  --label "Recruiter at Acme"   private note, never shown to the guest
  --uses 1|unlimited            bookings allowed with this key
  --days 7                      expires this many days from now
  --expires 2026-10-31          expires at the end of this date (your time zone)
  --types 15min,30min|all       meeting types the key unlocks

Env: SCHEDULE_API_URL (the Apps Script /exec URL), SCHEDULE_ADMIN_TOKEN.`;

const OPTION_NAMES = new Set(['label', 'uses', 'days', 'expires', 'types']);

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  const positional = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith('--')) {
      options[rest[i].slice(2)] = rest[i + 1];
      i++;
    } else {
      positional.push(rest[i]);
    }
  }
  return { command, options, positional };
}

/** Request fields for the options given, or null if any option is malformed. */
export function keyTermsFromOptions(options) {
  if (Object.keys(options).some(name => !OPTION_NAMES.has(name) || options[name] === undefined)) return null;
  const terms = {};

  if (options.label !== undefined) terms.label = options.label;

  if (options.uses === 'unlimited') {
    terms.unlimitedUses = true;
  } else if (options.uses !== undefined) {
    const maxUses = Number(options.uses);
    if (!(Number.isInteger(maxUses) && maxUses >= 1)) return null;
    terms.maxUses = maxUses;
  }

  if (options.days !== undefined && options.expires !== undefined) return null;
  if (options.days !== undefined) {
    const days = Number(options.days);
    if (!(days > 0 && days <= 365)) return null;
    terms.expiresInDays = days;
  }
  if (options.expires !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(options.expires)) return null;
    terms.expiresOn = options.expires;
  }

  if (options.types === 'all') {
    terms.allTypes = true;
  } else if (options.types !== undefined) {
    const typeIds = options.types.split(',').map(t => t.trim()).filter(Boolean);
    if (typeIds.length === 0) return null;
    terms.typeIds = typeIds;
  }

  return terms;
}

export function buildRequest({ command, options, positional }) {
  if (command === 'list') return { action: 'listKeys' };
  if (command === 'types') return { action: 'getConfig' };
  if (command === 'revoke') return positional[0] ? { action: 'revokeKey', id: positional[0] } : null;

  if (command === 'issue' || command === 'update') {
    const terms = keyTermsFromOptions(options);
    if (!terms) return null;
    if (command === 'issue') return { action: 'issueKey', ...terms };
    if (!positional[0] || Object.keys(terms).length === 0) return null;
    return { action: 'updateKey', id: positional[0], ...terms };
  }
  return null;
}

function formatKeyRow(k) {
  return {
    id: k.id,
    label: k.label,
    status: k.status,
    uses: `${k.uses}/${k.maxUses ?? '∞'}`,
    types: k.typeIds ? k.typeIds.join(',') : 'all',
    expires: k.expiresAt.slice(0, 16).replace('T', ' ') + 'Z',
  };
}

async function main() {
  const request = buildRequest(parseArgs(process.argv.slice(2)));
  const url = process.env.SCHEDULE_API_URL;
  const adminToken = process.env.SCHEDULE_ADMIN_TOKEN;
  if (!request || !url || !adminToken) {
    console.error(USAGE);
    process.exit(1);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...request, adminToken }),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error(`Error: ${data.error}`);
    process.exit(1);
  }

  if (request.action === 'issueKey') {
    console.table([formatKeyRow(data)]);
    console.log(`Key:  ${data.key}  (shown once — only its hash is stored)`);
    console.log(`Send: https://j2a3e.com/#schedule`);
  } else if (request.action === 'updateKey') {
    console.table([formatKeyRow(data)]);
  } else if (request.action === 'listKeys') {
    console.table(data.keys.map(formatKeyRow));
  } else if (request.action === 'getConfig') {
    console.table(data.config.types);
    console.log(`Key defaults: ${JSON.stringify(data.config.keyDefaults)} (time zone ${data.config.timeZone})`);
  } else {
    console.log(`Revoked ${data.revoked}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
