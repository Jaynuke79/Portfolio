import { webcrypto } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PBKDF2_ITERATIONS = 310000;

const rawPasswords = process.env.BOOKING_PASSWORDS;
const rawUrls = process.env.BOOKING_URLS;
if (!rawPasswords || !rawUrls) {
  console.log('BOOKING_PASSWORDS or BOOKING_URLS not set — skipping');
  process.exit(0);
}

const passwords = JSON.parse(rawPasswords);
const urls = JSON.parse(rawUrls);

async function encrypt(password, url) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
  );
  const key = await webcrypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const ciphertext = new Uint8Array(
    await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(url))
  );
  const packed = new Uint8Array(salt.length + iv.length + ciphertext.length);
  packed.set(salt, 0);
  packed.set(iv, salt.length);
  packed.set(ciphertext, salt.length + iv.length);
  return Buffer.from(packed).toString('base64');
}

const lines = [];
for (const [slug, url] of Object.entries(urls)) {
  const password = passwords[slug];
  if (!password) {
    console.error(`No password for slug "${slug}" — skipping it`);
    continue;
  }
  const key = `VITE_BOOKING_CIPHER_${slug.toUpperCase().replace(/-/g, '_')}`;
  lines.push(`${key}=${await encrypt(String(password), String(url))}`);
}

const relPath = process.env.ENV_OUTPUT ?? 'client/.env.local';
const outFile = resolve(__dirname, '..', relPath);
writeFileSync(outFile, lines.join('\n') + '\n');
console.log(`Wrote ${lines.length} cipher(s) to ${relPath}`);
