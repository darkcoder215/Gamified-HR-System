// Force Western Arabic numerals (0-9) per the POWR brand guide.
const ARABIC_INDIC = /[٠-٩۰-۹]/g;
const MAP: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

export function toWesternDigits(value: string | number): string {
  return String(value).replace(ARABIC_INDIC, (d) => MAP[d] ?? d);
}

export function formatNumber(n: number): string {
  return toWesternDigits(n.toLocaleString('en-US'));
}
