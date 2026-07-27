const PBKDF2_ITERATIONS = 310000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export async function decryptBookingUrl(
  cipherB64: string,
  password: string
): Promise<string | null> {
  try {
    const packed = Uint8Array.from(atob(cipherB64), (c) => c.charCodeAt(0));
    const salt = packed.slice(0, SALT_BYTES);
    const iv = packed.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
    const ciphertext = packed.slice(SALT_BYTES + IV_BYTES);
    const keyMaterial = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}
