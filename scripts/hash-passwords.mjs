import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const raw = process.env.BOOKING_PASSWORDS;
if (!raw) {
  console.log('BOOKING_PASSWORDS not set — skipping');
  process.exit(0);
}

const passwords = JSON.parse(raw);
const lines = Object.entries(passwords).map(([slug, pw]) => {
  const hash = createHash('sha256').update(String(pw)).digest('hex');
  const key = `VITE_BOOKING_HASH_${slug.toUpperCase().replace(/-/g, '_')}`;
  return `${key}=${hash}`;
});

const relPath = process.env.ENV_OUTPUT ?? 'client/.env.local';
const outFile = resolve(__dirname, '..', relPath);
writeFileSync(outFile, lines.join('\n') + '\n');
console.log(`Wrote ${lines.length} hash(es) to ${relPath}`);
