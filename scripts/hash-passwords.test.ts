import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { bookingHashEnvKey } from "../client/src/lib/appointments";

const scriptPath = resolve(dirname(fileURLToPath(import.meta.url)), "hash-passwords.mjs");
const outDir = mkdtempSync(join(tmpdir(), "booking-hashes-"));

afterAll(() => rmSync(outDir, { recursive: true, force: true }));

describe("hash-passwords.mjs", () => {
  it("writes env keys and hashes matching the client-side convention", () => {
    const outFile = join(outDir, ".env.test");
    execFileSync("node", [scriptPath], {
      env: {
        ...process.env,
        BOOKING_PASSWORDS: JSON.stringify({ "test-slug": "hunter2" }),
        ENV_OUTPUT: outFile,
      },
    });

    const written = readFileSync(outFile, "utf8").trim();
    const expectedKey = bookingHashEnvKey("test-slug");
    const expectedHash = createHash("sha256").update("hunter2").digest("hex");

    expect(written).toBe(`${expectedKey}=${expectedHash}`);
  });
});
