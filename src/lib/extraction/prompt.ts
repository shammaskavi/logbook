import contract from "./contract.json";

/**
 * Extraction prompt and schemas for photographed job-work slips.
 *
 * The canonical text lives in `contract.json` so that the app and the
 * evaluation script in `scripts/extract-with-gemini.mjs` read the same bytes —
 * a prompt duplicated between a `.ts` module and a plain script drifts within
 * a week, and then the accuracy numbers stop describing what ships.
 *
 * Every rule in the prompt comes from a specific failure observed in the five
 * real slips in `samples/work-orders/`. Do not simplify them away without
 * checking those images — each one is load-bearing:
 *
 *  - The party rule exists because all five slips are addressed "To: Kamil",
 *    so a naive read pulls the job worker as the party on every document.
 *  - The ditto rule exists because Varalakshmi's slip repeats items with `"`.
 *  - The strikethrough and correction rules exist because that same slip has
 *    two struck-out quantities, and Kiva's has a red handwritten process
 *    replacing the printed one.
 *  - The illegibility rule exists because Govardan's slip is hole-punched
 *    straight through the item descriptions.
 *  - The total rule exists because it is the only checksum available.
 */

export const EXTRACTION_PROMPT: string = contract.prompt;

/** Standard JSON Schema — for providers that accept it (Claude, OpenAI). */
export const EXTRACTION_SCHEMA = contract.jsonSchema;

/**
 * Gemini's `responseSchema` dialect: an OpenAPI 3.0 subset that rejects
 * `additionalProperties` and type unions, expressing nullability with
 * `nullable: true` instead.
 */
export const EXTRACTION_SCHEMA_GEMINI = contract.gemini;

/** Names for the job worker receiving the order — never the party. */
export const RECIPIENT_ALIASES: readonly string[] = contract.recipient_aliases;
