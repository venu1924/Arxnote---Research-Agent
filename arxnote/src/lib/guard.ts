const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;
const DAILY_PAID = 12;

type Bucket = { stamps: number[]; inflight: number };
type Spend = { day: string; openai: number; serp: number };

const buckets = new Map<string, Bucket>();
const spend: Spend = { day: "", openai: 0, serp: 0 };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function roll() {
  const day = today();
  if (spend.day !== day) {
    spend.day = day;
    spend.openai = 0;
    spend.serp = 0;
  }
}

export function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
}

export function takeSlot(address: string) {
  const now = Date.now();
  const bucket = buckets.get(address) ?? { stamps: [], inflight: 0 };
  bucket.stamps = bucket.stamps.filter((stamp) => now - stamp < WINDOW_MS);
  if (bucket.inflight >= 1 || bucket.stamps.length >= MAX_PER_WINDOW) {
    buckets.set(address, bucket);
    return { ok: false as const };
  }
  bucket.stamps.push(now);
  bucket.inflight += 1;
  buckets.set(address, bucket);
  roll();
  const openai = spend.openai < DAILY_PAID;
  const serp = spend.serp < DAILY_PAID;
  if (openai) spend.openai += 1;
  if (serp) spend.serp += 1;
  return { ok: true as const, openai, serp };
}

export function releaseSlot(address: string) {
  const bucket = buckets.get(address);
  if (!bucket) return;
  bucket.inflight = Math.max(0, bucket.inflight - 1);
}
