import { describe, it, expect } from "vitest";
import { prepareWorkOrder } from "./applyExtraction";
import type { ExtractedWorkOrder } from "./types";

const PARTIES = [
  { id: "p-uttam", name: "Uttam Silks & Sarees" },
  { id: "p-kiva", name: "Kiva Saree World" },
  { id: "p-govardan", name: "Govardan Silks" },
];

const JOB_WORKS = [
  { id: "jw-gum", name: "Gum Finishing" },
  { id: "jw-double", name: "Double Deco Gum" },
  { id: "jw-kanchi", name: "Kanchi Fold" },
  { id: "jw-pattani", name: "Pattani" },
];

function extraction(overrides: Partial<ExtractedWorkOrder> = {}): ExtractedWorkOrder {
  return {
    party_name: { value: "Uttam Silks & Sarees", confidence: "high" },
    work_order_number: { value: "2357", confidence: "high" },
    received_date: { value: "2025-03-24", raw: "24/03/25", confidence: "high" },
    items: [{ raw_text: "D/s pattani", quantity: 2, confidence: "high", flags: [] }],
    document_total_quantity: 2,
    notes: [],
    ...overrides,
  };
}

describe("prepareWorkOrder", () => {
  it("fills the form and raises nothing when everything reads cleanly", () => {
    const result = prepareWorkOrder(extraction(), PARTIES, JOB_WORKS);

    expect(result.partyId).toBe("p-uttam");
    expect(result.workOrderNumber).toBe("2357");
    expect(result.items[0].jobWorkTypeId).toBe("jw-pattani");
    expect(result.warnings).toEqual([]);
  });

  it("parses the date without sliding a day in a behind-UTC timezone", () => {
    const result = prepareWorkOrder(extraction(), PARTIES, JOB_WORKS);

    expect(result.receivedDate?.getFullYear()).toBe(2025);
    expect(result.receivedDate?.getMonth()).toBe(2); // March
    expect(result.receivedDate?.getDate()).toBe(24);
  });

  it("leaves the party unset and says so when the slip names one you don't have", () => {
    const result = prepareWorkOrder(
      extraction({ party_name: { value: "Varalakshmi Creations", confidence: "high" } }),
      PARTIES,
      JOB_WORKS
    );

    expect(result.partyId).toBeNull();
    expect(result.partyNameOnSlip).toBe("Varalakshmi Creations");
    expect(result.warnings.join(" ")).toContain("Varalakshmi Creations");
  });

  it("surfaces the raw date whenever confidence is below high", () => {
    const result = prepareWorkOrder(
      extraction({
        received_date: { value: "2023-08-24", raw: "24/8/23", confidence: "low" },
      }),
      PARTIES,
      JOB_WORKS
    );

    // Still pre-filled — but flagged, with the characters as written so the user
    // can check against the page. This is the field that fails most often.
    expect(result.receivedDate).not.toBeNull();
    expect(result.warnings.join(" ")).toContain('"24/8/23"');
  });

  it("keeps unmatched job work text on the row for the user to fix", () => {
    const result = prepareWorkOrder(
      extraction({
        items: [
          { raw_text: "pure mix and full mix gold", quantity: 30, confidence: "medium", flags: [] },
        ],
        document_total_quantity: 30,
      }),
      PARTIES,
      JOB_WORKS
    );

    expect(result.items[0].jobWorkTypeId).toBeNull();
    expect(result.items[0].extractedText).toBe("pure mix and full mix gold");
    expect(result.warnings.join(" ")).toContain("could not be matched");
  });

  it("flags a total that disagrees with the item quantities", () => {
    const result = prepareWorkOrder(
      extraction({
        items: [
          { raw_text: "D/s pattani", quantity: 2, confidence: "high", flags: [] },
          { raw_text: "kanchi fold", quantity: 1, confidence: "high", flags: [] },
        ],
        document_total_quantity: 9,
      }),
      PARTIES,
      JOB_WORKS
    );

    const joined = result.warnings.join(" ");
    expect(joined).toContain("9");
    expect(joined).toContain("3");
  });

  it("reports missing quantities rather than saving a zero", () => {
    const result = prepareWorkOrder(
      extraction({
        items: [{ raw_text: "D/s pattani", quantity: null, confidence: "low", flags: ["illegible"] }],
        document_total_quantity: null,
      }),
      PARTIES,
      JOB_WORKS
    );

    expect(result.items[0].quantity).toBe(0);
    expect(result.warnings.join(" ")).toContain("without a quantity");
  });

  it("copes with an extraction that read almost nothing", () => {
    const result = prepareWorkOrder(
      {
        party_name: { value: null, confidence: "low" },
        work_order_number: { value: null, confidence: "low" },
        received_date: { value: null, raw: null, confidence: "low" },
        items: [],
        document_total_quantity: null,
        notes: ["The photo is too blurred to read."],
      },
      PARTIES,
      JOB_WORKS
    );

    expect(result.partyId).toBeNull();
    expect(result.receivedDate).toBeNull();
    expect(result.workOrderNumber).toBe("");
    expect(result.items).toEqual([]);
    // Every gap named, and the extractor's own note carried through.
    const joined = result.warnings.join(" ");
    expect(joined).toContain("No party name");
    expect(joined).toContain("No date");
    expect(joined).toContain("No work order number");
    expect(joined).toContain("No items");
    expect(joined).toContain("too blurred");
  });

  it("passes the extractor's notes through last", () => {
    const result = prepareWorkOrder(
      extraction({ notes: ["Row 4 shows 129 broken down as 66 + 63."] }),
      PARTIES,
      JOB_WORKS
    );

    expect(result.warnings.at(-1)).toBe("Row 4 shows 129 broken down as 66 + 63.");
  });
});
