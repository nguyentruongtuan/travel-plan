import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Amounts are stored and entered as whole Vietnamese đồng.
const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
export const formatMoney = (n: number) => currency.format(n);

/** Text typed into a money field -> whole-đồng digits grouped with dots ("1234567" -> "1.234.567"). */
export function formatMoneyInput(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Money field text -> whole đồng; empty means 0. */
export const parseMoneyInput = (text: string) => Number(text.replace(/\D/g, "")) || 0;

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
