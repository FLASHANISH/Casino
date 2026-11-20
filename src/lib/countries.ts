// Country + wallet-currency directory for Quvanta.
// At signup the player picks a country; their wallet currency is the
// currency of that country (India -> INR, USA -> USD, UK -> GBP, ...).
// Deposits and withdraws happen in that currency (UPI is INR-only).
// No emoji anywhere in this file.

export type Country = {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  currency: string; // ISO 4217 code
  symbol: string;
};

export const COUNTRIES: Country[] = [
  { code: "IN", name: "India", currency: "INR", symbol: "₹" },
  { code: "US", name: "United States", currency: "USD", symbol: "$" },
  { code: "GB", name: "United Kingdom", currency: "GBP", symbol: "£" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", symbol: "د.إ" },
  { code: "DE", name: "Germany", currency: "EUR", symbol: "€" },
  { code: "FR", name: "France", currency: "EUR", symbol: "€" },
  { code: "ES", name: "Spain", currency: "EUR", symbol: "€" },
  { code: "IT", name: "Italy", currency: "EUR", symbol: "€" },
  { code: "NL", name: "Netherlands", currency: "EUR", symbol: "€" },
  { code: "CA", name: "Canada", currency: "CAD", symbol: "CA$" },
  { code: "AU", name: "Australia", currency: "AUD", symbol: "A$" },
  { code: "SG", name: "Singapore", currency: "SGD", symbol: "S$" },
  { code: "PK", name: "Pakistan", currency: "PKR", symbol: "₨" },
  { code: "BD", name: "Bangladesh", currency: "BDT", symbol: "৳" },
  { code: "NP", name: "Nepal", currency: "NPR", symbol: "₨" },
  { code: "LK", name: "Sri Lanka", currency: "LKR", symbol: "₨" },
  { code: "JP", name: "Japan", currency: "JPY", symbol: "¥" },
  { code: "CN", name: "China", currency: "CNY", symbol: "¥" },
  { code: "BR", name: "Brazil", currency: "BRL", symbol: "R$" },
  { code: "ZA", name: "South Africa", currency: "ZAR", symbol: "R" },
  { code: "NG", name: "Nigeria", currency: "NGN", symbol: "₦" },
  { code: "KE", name: "Kenya", currency: "KES", symbol: "KSh" },
  { code: "RU", name: "Russia", currency: "RUB", symbol: "₽" },
  { code: "TR", name: "Turkey", currency: "TRY", symbol: "₺" },
  { code: "TH", name: "Thailand", currency: "THB", symbol: "฿" },
  { code: "MY", name: "Malaysia", currency: "MYR", symbol: "RM" },
  { code: "ID", name: "Indonesia", currency: "IDR", symbol: "Rp" },
  { code: "PH", name: "Philippines", currency: "PHP", symbol: "₱" },
  { code: "VN", name: "Vietnam", currency: "VND", symbol: "₫" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", symbol: "﷼" },
  { code: "QA", name: "Qatar", currency: "QAR", symbol: "﷼" },
  { code: "KW", name: "Kuwait", currency: "KWD", symbol: "KD" },
  { code: "NZ", name: "New Zealand", currency: "NZD", symbol: "NZ$" },
  { code: "MX", name: "Mexico", currency: "MXN", symbol: "MX$" },
  { code: "CH", name: "Switzerland", currency: "CHF", symbol: "CHF" },
  { code: "SE", name: "Sweden", currency: "SEK", symbol: "kr" },
];

export const DEFAULT_COUNTRY = "IN";

export function countryByCode(code: string): Country | undefined {
  const c = (code || "").trim().toUpperCase();
  return COUNTRIES.find((x) => x.code === c);
}

/** Currency (code + symbol) for a country code. Falls back to USD. */
export function currencyForCountry(code: string): {
  currency: string;
  symbol: string;
} {
  const c = countryByCode(code);
  return c ? { currency: c.currency, symbol: c.symbol } : { currency: "USD", symbol: "$" };
}

/** Symbol for a currency code (e.g. "INR" -> "₹"). Falls back to the code itself. */
export function symbolForCurrency(currency: string): string {
  const code = (currency || "").trim().toUpperCase();
  if (code === "USDT") return "₮";
  const c = COUNTRIES.find((x) => x.currency === code);
  return c ? c.symbol : code;
}

/** Format an amount in a currency, e.g. formatMoney(100, "INR") -> "₹100.00". */
export function formatMoney(amount: number, currency: string): string {
  const symbol = symbolForCurrency(currency);
  const n = Number(amount) || 0;
  return `${symbol}${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
