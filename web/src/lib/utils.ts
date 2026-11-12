import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currency = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });
export const formatMoney = (n: number) => currency.format(n);

export const formatKm = (n: number) => `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** ISO string -> value for <input type="datetime-local"> (local time). */
export function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value -> ISO string, or null when empty. */
export function fromLocalInput(v: string) {
  return v ? new Date(v).toISOString() : null;
}
