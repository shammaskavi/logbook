import { matchJobWork, type JobWorkOption } from "./matchJobWork";
import { checkTotal, type ExtractedWorkOrder } from "./types";

/**
 * Turns a raw extraction into something the work order form can be filled with,
 * plus a plain-language list of what the reviewer should check.
 *
 * Nothing here is trusted. The form is the review screen: every value arrives
 * pre-filled and editable, and anything the extractor was unsure about — or
 * that this mapping could not resolve — surfaces as a warning rather than being
 * quietly accepted.
 */

export interface PreparedItem {
  /** Resolved job work, or null when the user needs to pick or create one. */
  jobWorkTypeId: string | null;
  quantity: number;
  /** What was written on the slip, kept so the user can see what to correct. */
  extractedText: string;
  /** How the match was reached — drives whether the row needs attention. */
  matchStrength: "exact" | "likely" | "weak" | "none";
}

export interface PreparedWorkOrder {
  partyId: string | null;
  partyNameOnSlip: string | null;
  workOrderNumber: string;
  receivedDate: Date | null;
  /** The date exactly as written, so the user can check it without the photo. */
  receivedDateRaw: string | null;
  items: PreparedItem[];
  /** Ordered most-important first; safe to show verbatim. */
  warnings: string[];
}

export interface NamedOption {
  id: string;
  name: string;
}

function parseIsoDate(value: string | null): Date | null {
  if (!value) return null;
  // Parse as local noon rather than UTC midnight, so formatting the date back
  // out cannot slide to the previous day in a behind-UTC timezone.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    12
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function prepareWorkOrder(
  extracted: ExtractedWorkOrder,
  parties: NamedOption[],
  jobWorkTypes: JobWorkOption[]
): PreparedWorkOrder {
  const warnings: string[] = [];

  // ── Party ────────────────────────────────────────────────────────────────
  const partyNameOnSlip = extracted.party_name?.value ?? null;
  const partyMatch = partyNameOnSlip
    ? matchJobWork(partyNameOnSlip, parties)
    : null;

  const partyId =
    partyMatch && (partyMatch.strength === "exact" || partyMatch.strength === "likely")
      ? partyMatch.option?.id ?? null
      : null;

  if (!partyNameOnSlip) {
    warnings.push("No party name could be read — please select one.");
  } else if (!partyId) {
    warnings.push(
      `"${partyNameOnSlip}" is not in your parties list. Select the right one, or add it.`
    );
  } else if (extracted.party_name.confidence === "low") {
    warnings.push(`Party was hard to read — confirm it is "${partyNameOnSlip}".`);
  }

  // ── Date ─────────────────────────────────────────────────────────────────
  const receivedDate = parseIsoDate(extracted.received_date?.value ?? null);
  const receivedDateRaw = extracted.received_date?.raw ?? null;

  if (!receivedDate) {
    warnings.push("No date could be read — please set it.");
  } else if (extracted.received_date.confidence !== "high") {
    warnings.push(
      receivedDateRaw
        ? `Check the date — the slip reads "${receivedDateRaw}". Handwritten dates are the least reliable field.`
        : "Check the date — it was hard to read."
    );
  }

  // ── Work order number ────────────────────────────────────────────────────
  const workOrderNumber = extracted.work_order_number?.value?.trim() ?? "";
  if (!workOrderNumber) {
    warnings.push("No work order number could be read — please enter it.");
  } else if (extracted.work_order_number.confidence === "low") {
    warnings.push(`Check the work order number — read as "${workOrderNumber}".`);
  }

  // ── Items ────────────────────────────────────────────────────────────────
  const items: PreparedItem[] = (extracted.items ?? []).map((item) => {
    const match = matchJobWork(item.raw_text ?? "", jobWorkTypes);
    const usable = match.strength === "exact" || match.strength === "likely";

    return {
      jobWorkTypeId: usable ? match.option?.id ?? null : null,
      quantity: item.quantity ?? 0,
      extractedText: item.raw_text ?? "",
      matchStrength: match.strength,
    };
  });

  const unresolved = items.filter((item) => item.jobWorkTypeId === null);
  if (unresolved.length > 0) {
    warnings.push(
      `${unresolved.length} of ${items.length} job works could not be matched to your list — pick one on each row, or add it.`
    );
  }

  const missingQuantity = items.filter((item) => item.quantity <= 0);
  if (missingQuantity.length > 0) {
    warnings.push(
      `${missingQuantity.length} item${missingQuantity.length === 1 ? "" : "s"} came through without a quantity.`
    );
  }

  // The written total is the only checksum on the page, so a mismatch is the
  // strongest signal that the item table was misread.
  const total = checkTotal(extracted);
  if (total.status === "mismatch") {
    warnings.push(
      `The slip's total is ${total.documentTotal} but the items add up to ${total.itemsTotal}. Check the quantities.`
    );
  }

  if (items.length === 0) {
    warnings.push("No items could be read — please enter them.");
  }

  // Anything the extractor chose to say, after our own checks.
  warnings.push(...(extracted.notes ?? []));

  return {
    partyId,
    partyNameOnSlip,
    workOrderNumber,
    receivedDate,
    receivedDateRaw,
    items,
    warnings,
  };
}
