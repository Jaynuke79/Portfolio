export function parseBookingSlug(hash: string): string | null {
  if (hash.startsWith("#book/")) {
    const slug = hash.slice(6);
    return slug || null;
  }
  return null;
}
