/**
 * Matches raw text read off a slip against the organisation's own job work
 * list — locally, with no model call.
 *
 * Doing this in code rather than in the extraction prompt means it costs
 * nothing per work order, runs instantly, is deterministic enough to debug
 * ("why did it pick that?"), and needs no re-prompting when someone adds a job
 * work in Settings.
 *
 * A miss is not a failure. Unmatched text is handed to the user as-is so they
 * can correct it or add it as a new job work — so the matcher is tuned to
 * avoid confident-but-wrong matches rather than to match everything.
 */

export interface JobWorkOption {
  id: string;
  name: string;
}

export interface JobWorkMatch {
  /** Best candidate, or null when nothing scored above the floor. */
  option: JobWorkOption | null;
  score: number;
  /**
   * `exact` — same after normalising, safe to select silently.
   * `likely` — pre-select it, but show the raw text so the user can see it.
   * `weak` — offer it as a suggestion only; do not pre-select.
   * `none` — no candidate; user picks, or creates a new job work.
   */
  strength: "exact" | "likely" | "weak" | "none";
}

/**
 * Tokens that carry no distinguishing meaning on these slips — mostly units,
 * shorthand and connectors that appear across unrelated items.
 */
const NOISE_TOKENS = new Set([
  "and",
  "with",
  "the",
  "for",
  "pcs",
  "pc",
  "pieces",
  "nos",
  "no",
  "qty",
  "1f",
  "if",
  "kg",
  "mtr",
  "mtrs",
]);

/** Lowercase, strip punctuation and digits, drop noise words. */
export function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !NOISE_TOKENS.has(token));
}

function trigrams(text: string): Set<string> {
  const padded = ` ${text} `;
  const out = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) {
    out.add(padded.slice(i, i + 3));
  }
  return out;
}

/** Dice coefficient over character trigrams — tolerant of suffixes and typos. */
function trigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const ta = trigrams(a);
  const tb = trigrams(b);
  let shared = 0;
  ta.forEach((gram) => {
    if (tb.has(gram)) shared += 1;
  });
  return (2 * shared) / (ta.size + tb.size);
}

/**
 * Dice coefficient over tokens, allowing a token to match by prefix so
 * "finish" hits "finishing".
 *
 * Scoring against BOTH sides rather than just the candidate's tokens is what
 * makes a specific name beat a generic one. Coverage-of-candidate alone gives
 * a single-word option a perfect score whenever that word appears anywhere —
 * so "kanchi bung kanchi fold" matched a bare "Fold" as strongly as it matched
 * "Kanchi Fold", and short names won on iteration order. Dividing by the sum of
 * both token counts penalises a candidate that explains only part of the text.
 */
function tokenDice(slipTokens: string[], optionTokens: string[]): number {
  if (optionTokens.length === 0 || slipTokens.length === 0) return 0;

  const consumed = new Set<number>();
  let matched = 0;

  for (const optionToken of optionTokens) {
    const index = slipTokens.findIndex(
      (slipToken, i) =>
        !consumed.has(i) &&
        (slipToken === optionToken ||
          slipToken.startsWith(optionToken) ||
          optionToken.startsWith(slipToken))
    );

    if (index !== -1) {
      consumed.add(index);
      matched += 1;
    }
  }

  return (2 * matched) / (optionTokens.length + slipTokens.length);
}

const LIKELY_THRESHOLD = 0.7;
const WEAK_THRESHOLD = 0.45;

/**
 * @param rawText   Item description as read off the slip.
 * @param options   The organisation's job work types (pass only active ones).
 */
export function matchJobWork(
  rawText: string,
  options: JobWorkOption[]
): JobWorkMatch {
  const slipTokens = normalize(rawText);
  const slipJoined = slipTokens.join(" ");

  if (slipTokens.length === 0 || options.length === 0) {
    return { option: null, score: 0, strength: "none" };
  }

  let best: JobWorkOption | null = null;
  let bestScore = 0;

  for (const option of options) {
    const optionTokens = normalize(option.name);
    const optionJoined = optionTokens.join(" ");

    if (optionJoined && optionJoined === slipJoined) {
      return { option, score: 1, strength: "exact" };
    }

    // Take the better of the two views: token Dice handles extra words around
    // the right name, trigrams handle misspellings and suffixes ("pattan" for
    // "pattani", which shares no whole token).
    const score = Math.max(
      tokenDice(slipTokens, optionTokens),
      trigramSimilarity(slipJoined, optionJoined)
    );

    if (score > bestScore) {
      bestScore = score;
      best = option;
    }
  }

  // "exact" is reserved for normalised equality, checked in the loop above. A
  // high score is confidence, not identity — claiming otherwise made a partial
  // match look verified.
  if (bestScore >= LIKELY_THRESHOLD) {
    return { option: best, score: bestScore, strength: "likely" };
  }
  if (bestScore >= WEAK_THRESHOLD) {
    return { option: best, score: bestScore, strength: "weak" };
  }

  return { option: null, score: bestScore, strength: "none" };
}
