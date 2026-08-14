const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];

const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

/** Spell out a whole number using the Indian system (thousand / lakh / crore). */
function spell(value: number): string {
  if (value < 20) return ONES[value];
  if (value < 100) return `${TENS[Math.floor(value / 10)]} ${ONES[value % 10]}`;
  if (value < 1_000) return `${ONES[Math.floor(value / 100)]} Hundred ${spell(value % 100)}`;
  if (value < 100_000) return `${spell(Math.floor(value / 1_000))} Thousand ${spell(value % 1_000)}`;
  if (value < 10_000_000) return `${spell(Math.floor(value / 100_000))} Lakh ${spell(value % 100_000)}`;
  return `${spell(Math.floor(value / 10_000_000))} Crore ${spell(value % 10_000_000)}`;
}

function tidy(words: string): string {
  return words.replace(/\s+/g, " ").trim();
}

/**
 * Render a rupee amount as words for the invoice's "Amount (in words)" line.
 *
 * Paise are rounded to two decimals and spelled separately, matching the
 * convention used on Indian tax invoices.
 */
export function amountInWords(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "Zero Rupees Only";

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  // Rounding paise can carry into the rupee column (e.g. 10.999 -> 11.00).
  const carried = paise === 100;
  const finalRupees = carried ? rupees + 1 : rupees;
  const finalPaise = carried ? 0 : paise;

  const rupeeWords = tidy(spell(finalRupees)) || "Zero";
  const parts = [`${rupeeWords} Rupees`];

  if (finalPaise > 0) {
    parts.push(`and ${tidy(spell(finalPaise))} Paise`);
  }

  return `${parts.join(" ")} Only`;
}
