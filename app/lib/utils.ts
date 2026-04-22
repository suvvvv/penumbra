import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const USDC_DECIMALS = 6;

export function formatUsdc(baseUnits: bigint | number): string {
  const value = typeof baseUnits === "bigint" ? baseUnits : BigInt(baseUnits);
  const whole = value / 10n ** BigInt(USDC_DECIMALS);
  const frac = value % 10n ** BigInt(USDC_DECIMALS);
  const fracStr = frac.toString().padStart(USDC_DECIMALS, "0").slice(0, 2);
  return `${whole.toLocaleString()}.${fracStr}`;
}

export function parseUsdc(input: string): bigint {
  const [whole, frac = ""] = input.trim().replace(/,/g, "").split(".");
  const wholePart = BigInt(whole || "0") * 10n ** BigInt(USDC_DECIMALS);
  const fracPadded = (frac + "0".repeat(USDC_DECIMALS)).slice(0, USDC_DECIMALS);
  return wholePart + BigInt(fracPadded || "0");
}

export function truncateAddress(addr: string, head = 4, tail = 4): string {
  if (!addr) return "";
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function maskCiphertext(bytes: number = 20): string {
  const hex = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < bytes; i++) {
    out += hex[Math.floor(Math.random() * 16)];
    out += hex[Math.floor(Math.random() * 16)];
  }
  return out;
}

export function randomId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
