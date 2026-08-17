import { describe, it, expect } from "vitest";
import { matchJobWork, normalize, type JobWorkOption } from "./matchJobWork";
import { checkTotal, type ExtractedWorkOrder } from "./types";

/**
 * Job work names drawn from the vocabulary that actually appears on the five
 * sample slips, since that is what the list will grow into.
 */
const OPTIONS: JobWorkOption[] = [
  { id: "jw-gum-finishing", name: "Gum Finishing" },
  { id: "jw-double-deco-gum", name: "Double Deco Gum" },
  { id: "jw-polish", name: "Polish" },
  { id: "jw-folding", name: "Folding" },
  { id: "jw-handloom", name: "Handloom" },
  { id: "jw-latkan", name: "Latkan" },
];

describe("normalize", () => {
  it("strips punctuation, digits and unit noise", () => {
    expect(normalize("double deco gum 1f")).toEqual(["double", "deco", "gum"]);
    expect(normalize("14 Pcs")).toEqual([]);
  });
});

describe("matchJobWork", () => {
  it("matches exactly regardless of case and trailing noise", () => {
    const result = matchJobWork("GUM FINISHING", OPTIONS);
    expect(result.strength).toBe("exact");
    expect(result.option?.id).toBe("jw-gum-finishing");
  });

  it("matches a shortened form written on a slip", () => {
    // Varalakshmi writes "Gum Finish & 1f" for "Gum Finishing".
    const result = matchJobWork("Gum Finish & 1f", OPTIONS);
    expect(result.option?.id).toBe("jw-gum-finishing");
    expect(["exact", "likely"]).toContain(result.strength);
  });

  it("matches when the slip carries extra words around the name", () => {
    const result = matchJobWork("double deco gum 1f", OPTIONS);
    expect(result.option?.id).toBe("jw-double-deco-gum");
    expect(["exact", "likely"]).toContain(result.strength);
  });

  it("does not confidently match vocabulary that isn't in the list", () => {
    // "pure mix gold" (S.L Silk House) has no counterpart in the list.
    const result = matchJobWork("pure mix and full mix gold", OPTIONS);
    expect(result.strength).toBe("none");
    expect(result.option).toBeNull();
  });

  it("returns none rather than guessing on a partial, torn description", () => {
    // Govardan's descriptions are hole-punched: "...mix Brocade Br".
    const result = matchJobWork("mix Brocade Br", OPTIONS);
    expect(result.strength).toBe("none");
  });

  it("handles an empty job work list without throwing", () => {
    expect(matchJobWork("Gum Finishing", []).strength).toBe("none");
  });

  it("handles text that normalises to nothing", () => {
    expect(matchJobWork("14", OPTIONS).strength).toBe("none");
    expect(matchJobWork('"', OPTIONS).strength).toBe("none");
  });

  it("never returns an option when strength is none", () => {
    for (const text of ["zzzz qqqq", "", "1f", "129 = 66+63"]) {
      const result = matchJobWork(text, OPTIONS);
      if (result.strength === "none") expect(result.option).toBeNull();
    }
  });
});

describe("checkTotal", () => {
  const base: ExtractedWorkOrder = {
    party_name: { value: "Uttam Silks & Sarees", confidence: "high" },
    work_order_number: { value: "2357", confidence: "high" },
    received_date: { value: "2025-08-24", raw: "24/8/25", confidence: "high" },
    items: [],
    document_total_quantity: null,
    notes: [],
  };

  it("confirms a slip whose items sum to the written total", () => {
    const result = checkTotal({
      ...base,
      items: [
        { raw_text: "D/s pattani", quantity: 2, confidence: "high", flags: [] },
        { raw_text: "kanchi fold", quantity: 1, confidence: "high", flags: [] },
        { raw_text: "gutaka fold", quantity: 1, confidence: "high", flags: [] },
      ],
      document_total_quantity: 4,
    });
    expect(result.status).toBe("match");
  });

  it("catches the Varalakshmi case where the items do not reconcile", () => {
    const result = checkTotal({
      ...base,
      items: [
        { raw_text: "double deco gum", quantity: 9, confidence: "low", flags: [] },
        { raw_text: "double deco gum", quantity: 14, confidence: "low", flags: ["ditto_expanded"] },
        { raw_text: "Gum Finish", quantity: 135, confidence: "low", flags: ["ambiguous_quantity"] },
      ],
      document_total_quantity: 669,
    });
    expect(result.status).toBe("mismatch");
    expect(result.itemsTotal).toBe(158);
  });

  it("reports when the slip has no written total to check against", () => {
    expect(checkTotal(base).status).toBe("no_total_on_document");
  });

  it("treats a null quantity as zero rather than throwing", () => {
    const result = checkTotal({
      ...base,
      items: [{ raw_text: "illegible", quantity: null, confidence: "low", flags: ["illegible"] }],
      document_total_quantity: 5,
    });
    expect(result.itemsTotal).toBe(0);
    expect(result.status).toBe("mismatch");
  });
});
