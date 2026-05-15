/**
 * UUID v7 — time-ordered, sortable. Inline implementation (no external dep).
 * Structure: 48-bit ms timestamp | 4-bit version (7) | 12-bit seq | 2-bit variant | 62-bit random
 */
export function uuidv7(): string {
  const now = BigInt(Date.now());
  const hi = Number((now >> BigInt(28)) & BigInt(0xffffffff));
  const mid = Number((now >> BigInt(12)) & BigInt(0xffff));
  const lo = Number(now & BigInt(0xfff));
  const rand = crypto.getRandomValues(new Uint8Array(8));
  rand[0] = (rand[0]! & 0x3f) | 0x80; // set variant bits
  const hex = (n: number, pad: number) => n.toString(16).padStart(pad, "0");
  const randHex = Array.from(rand)
    .map((b) => hex(b, 2))
    .join("");
  return `${hex(hi, 8)}-${hex(mid, 4)}-7${hex(lo, 3)}-${randHex.slice(0, 4)}-${randHex.slice(4)}`;
}
