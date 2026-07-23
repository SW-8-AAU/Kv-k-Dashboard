import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** Danish price display, e.g. 12.5 -> "12,50 kr". The API serializes
 *  some Decimal columns as strings ("12.95") — accept both. */
export function formatPrice(
  value: number | string | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return `${n.toFixed(2).replace(".", ",")} kr`;
}

/** "quantity unitText" when present, falling back to whichever exists. */
export function formatSize(
  quantity: number | null | undefined,
  unitText: string | null | undefined,
): string | null {
  if (quantity !== null && quantity !== undefined && unitText) {
    return `${quantity} ${unitText}`;
  }
  if (quantity !== null && quantity !== undefined) return String(quantity);
  return unitText ?? null;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("da-DK", { dateStyle: "medium", timeStyle: "short" });
}

export const EAN_PATTERN = /^\d{8,14}$/;

/** Case/whitespace-insensitive text equality for diff highlighting.
 *  Missing values on either side count as "no difference to show". */
export function textDiffers(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() !== b.trim().toLowerCase();
}

/** Size equality across quantity+unit pairs; null on either side = no diff. */
export function sizeDiffers(
  aQty: number | null | undefined,
  aUnit: string | null | undefined,
  bQty: number | null | undefined,
  bUnit: string | null | undefined,
): boolean {
  const a = formatSize(aQty, aUnit);
  const b = formatSize(bQty, bUnit);
  return textDiffers(a, b);
}
