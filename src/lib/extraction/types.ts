/**
 * Contract for extracting a draft work order from a photographed job-work slip.
 *
 * Deliberately provider-agnostic: the same shape is produced whether the call
 * goes to Gemini, Claude, or anything else. Swapping providers should touch
 * only the adapter that fills this in.
 *
 * Two principles run through it:
 *
 * 1. Nothing here is authoritative. Every field is a suggestion the user
 *    confirms or corrects, so the extractor is never asked to be certain — it
 *    is asked to be honest about what it could and could not read.
 * 2. Job work names are returned as raw text, not resolved to IDs. Matching
 *    against the organisation's job work list happens locally in
 *    `matchJobWork.ts`, which costs nothing and needs no re-prompting when the
 *    list changes.
 */

export type Confidence = "high" | "medium" | "low";

export type ItemFlag =
  /** Description came from a ditto mark repeating the line above. */
  | "ditto_expanded"
  /** A quantity on this line was struck through and replaced. */
  | "struck_through"
  /** Text is torn, hole-punched, or otherwise physically missing. */
  | "illegible"
  /** More than one number could plausibly be the quantity. */
  | "ambiguous_quantity"
  /** Handwritten correction overriding printed text. */
  | "handwritten_correction";

export interface ExtractedField<T> {
  value: T | null;
  confidence: Confidence;
  /** Exactly what appeared on the page, before any interpretation. */
  raw?: string | null;
}

export interface ExtractedItem {
  /** Verbatim text from the slip — never normalised or guessed at. */
  raw_text: string;
  quantity: number | null;
  confidence: Confidence;
  flags: ItemFlag[];
}

export interface ExtractedWorkOrder {
  /**
   * The company on the printed letterhead — the party that issued the order.
   * NOT the handwritten "To:" name, which is the job worker receiving it.
   */
  party_name: ExtractedField<string>;
  work_order_number: ExtractedField<string>;
  /** ISO `yyyy-MM-dd`; `raw` keeps the original so the user can sanity-check it. */
  received_date: ExtractedField<string>;
  items: ExtractedItem[];
  /**
   * The total quantity written on the slip, when there is one. Used as a
   * checksum against the sum of the line items — a mismatch is the strongest
   * available signal that the item table was misread.
   */
  document_total_quantity: number | null;
  /** Anything the extractor wants to warn about, in plain language. */
  notes: string[];
}

/** Result of comparing `document_total_quantity` against the line items. */
export interface TotalCheck {
  status: "match" | "mismatch" | "no_total_on_document";
  documentTotal: number | null;
  itemsTotal: number;
}

export function checkTotal(extracted: ExtractedWorkOrder): TotalCheck {
  const itemsTotal = extracted.items.reduce(
    (sum, item) => sum + (item.quantity ?? 0),
    0
  );

  if (extracted.document_total_quantity == null) {
    return { status: "no_total_on_document", documentTotal: null, itemsTotal };
  }

  return {
    status:
      extracted.document_total_quantity === itemsTotal ? "match" : "mismatch",
    documentTotal: extracted.document_total_quantity,
    itemsTotal,
  };
}
