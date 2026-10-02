/*
  Pure helpers for visitor access keys. A key is 16 Crockford base32 characters
  (80 random bits) shown as four dash-separated groups; only its SHA-256 hash is
  ever stored.
*/

function keyAlphabet() {
  return '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
}

/**
 * Concatenated hex from v4 UUIDs with the version nibble (index 12) and variant
 * nibble (index 16) dropped, since those carry fixed rather than random bits.
 */
function randomHexFromUuids(uuids) {
  return uuids
    .map(uuid => uuid.replace(/-/g, '').split('').filter((_, i) => i !== 12 && i !== 16).join(''))
    .join('');
}

/** Hex digits → a display key; needs at least 20 hex chars (80 bits). */
function formatKeyFromHex(hex) {
  const alphabet = keyAlphabet();
  let bits = '';
  for (const digit of hex.slice(0, 20)) bits += parseInt(digit, 16).toString(2).padStart(4, '0');
  let key = '';
  for (let i = 0; i < 80; i += 5) key += alphabet[parseInt(bits.slice(i, i + 5), 2)];
  return key.match(/.{4}/g).join('-');
}

/**
 * Canonical form used for hashing: case, spaces and dashes are ignored, and the
 * look-alikes Crockford base32 excludes (O, I, L) are read as 0, 1, 1 so a key
 * read aloud or retyped from a screenshot still matches.
 */
function normalizeKey(input) {
  if (typeof input !== 'string') return '';
  return input
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

function isWellFormedKey(normalized) {
  return /^[0-9A-HJKMNP-TV-Z]{16}$/.test(normalized);
}

/** 'ok' | 'expired' | 'used_up' for a stored key record at `nowMs`. */
function keyStatus(record, nowMs) {
  if (record.expiresAt && new Date(record.expiresAt).getTime() <= nowMs) return 'expired';
  if (record.maxUses != null && record.uses >= record.maxUses) return 'used_up';
  return 'ok';
}

/**
 * The terms a key is issued or updated with. Each field comes from the request
 * when present, else from the key being updated, else from `keyDefaults`.
 * Returns { terms } or { error } so callers own how failures surface.
 *
 * Request fields: label, maxUses | unlimitedUses, expiresInDays | expiresOn
 * (YYYY-MM-DD, end of that day in the owner's zone), typeIds | allTypes.
 * A `typeIds` of null on a key means every meeting type, including ones added
 * to the config later.
 */
function resolveKeyTerms(body, { defaults, knownTypeIds, timeZone, nowMs }, current) {
  const maxExpiryMs = nowMs + 365 * 86400000;

  let maxUses;
  if (body.unlimitedUses === true) maxUses = null;
  else if (body.maxUses !== undefined) maxUses = Number(body.maxUses);
  else if (current) maxUses = current.maxUses;
  else maxUses = defaults.maxUses === undefined ? 1 : defaults.maxUses;
  if (maxUses !== null && !(Number.isInteger(maxUses) && maxUses >= 1)) return { error: 'invalid_uses' };

  if (body.expiresInDays !== undefined && body.expiresOn !== undefined) return { error: 'invalid_expiry' };
  let expiresMs;
  if (body.expiresOn !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.expiresOn))) return { error: 'invalid_expiry' };
    expiresMs = wallTimeToEpochMs(body.expiresOn, '23:59', timeZone) + 59999;
  } else if (body.expiresInDays !== undefined) {
    expiresMs = nowMs + Number(body.expiresInDays) * 86400000;
  } else if (current) {
    expiresMs = new Date(current.expiresAt).getTime();
  } else {
    expiresMs = nowMs + (defaults.expiresInDays === undefined ? 14 : defaults.expiresInDays) * 86400000;
  }
  const keepingCurrentExpiry = current && body.expiresOn === undefined && body.expiresInDays === undefined;
  if (!keepingCurrentExpiry && !(expiresMs > nowMs && expiresMs <= maxExpiryMs)) return { error: 'invalid_expiry' };

  let typeIds;
  if (body.allTypes === true) typeIds = null;
  else if (body.typeIds !== undefined) typeIds = body.typeIds;
  else if (current) typeIds = current.typeIds === undefined ? null : current.typeIds;
  else typeIds = defaults.typeIds === undefined ? null : defaults.typeIds;
  if (typeIds !== null) {
    if (!Array.isArray(typeIds) || typeIds.length === 0) return { error: 'invalid_types' };
    typeIds = typeIds.filter((id, i) => typeIds.indexOf(id) === i);
    if (typeIds.some(id => !knownTypeIds.includes(id))) return { error: 'unknown_type' };
  }

  const label = typeof body.label === 'string' ? body.label.slice(0, 100) : current ? current.label : '';
  return { terms: { label, maxUses, expiresAt: new Date(expiresMs).toISOString(), typeIds } };
}

/** The meeting types a key unlocks, in config order. */
function typesForKey(types, record) {
  return record.typeIds == null ? types : types.filter(t => record.typeIds.includes(t.id));
}
