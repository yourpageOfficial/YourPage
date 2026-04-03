import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export function formatCredit(amountIDR: number): string {
  const credits = Math.floor(amountIDR / 1000);
  return `${credits} Credit`;
}

export function idrToCredit(amountIDR: number): number {
  return Math.floor(amountIDR / 1000);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
