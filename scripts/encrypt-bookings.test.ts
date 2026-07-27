import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { bookingCipherEnvKey } from "../client/src/lib/appointments";
import { decryptBookingUrl } from "../client/src/lib/booking-crypto";

const scriptPath = resolve(dirname(fileURLToPath(import.meta.url)), "encrypt-bookings.mjs");
const outDir = mkdtempSync(join(tmpdir(), "booking-ciphers-"));

const URL = "https://outlook.office.com/bookwithme/user/test/meetingtype/abc?anonymous";
const PASSWORD = "correct horse battery staple";

function runScript(): string {
  const outFile = join(outDir, ".env.test");
  execFileSync("node", [scriptPath], {
    env: {
      ...process.env,
      BOOKING_PASSWORDS: JSON.stringify({ "test-slug": PASSWORD }),
      BOOKING_URLS: JSON.stringify({ "test-slug": URL }),
      ENV_OUTPUT: outFile,
    },
  });
  const line = readFileSync(outFile, "utf8").trim();
  const expectedKey = bookingCipherEnvKey("test-slug");
  expect(line.startsWith(`${expectedKey}=`)).toBe(true);
  return line.slice(expectedKey.length + 1);
}

afterAll(() => rmSync(outDir, { recursive: true, force: true }));

describe("encrypt-bookings.mjs → booking-crypto roundtrip", () => {
  it("client decrypts the script's cipher with the right password", async () => {
    const cipher = runScript();
    expect(cipher).not.toContain("outlook.office.com");
    await expect(decryptBookingUrl(cipher, PASSWORD)).resolves.toBe(URL);
  });

  it("returns null for a wrong password", async () => {
    const cipher = runScript();
    await expect(decryptBookingUrl(cipher, "wrong-password")).resolves.toBeNull();
  });

  it("returns null for corrupted ciphertext", async () => {
    const cipher = runScript();
    const corrupted = cipher.slice(0, -8) + "AAAAAAA=";
    await expect(decryptBookingUrl(corrupted, PASSWORD)).resolves.toBeNull();
  });
});
