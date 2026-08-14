import { describe, it, expect } from "vitest";
import { packRows, samePagination } from "./pagination";
import { amountInWords } from "@/lib/format/amountInWords";

const budget = { bodyHeight: 100, lastPageBodyHeight: 60 };

describe("packRows", () => {
  it("returns a single empty page when there are no rows", () => {
    expect(packRows([], budget)).toEqual([[]]);
  });

  it("keeps everything on one page when it fits the smaller final budget", () => {
    expect(packRows([10, 10, 10], budget)).toEqual([[0, 1, 2]]);
  });

  it("never lets a page exceed its budget", () => {
    const heights = Array.from({ length: 40 }, () => 10);
    const pages = packRows(heights, budget);

    pages.forEach((page, index) => {
      const total = page.reduce((sum, i) => sum + heights[i], 0);
      const limit =
        index === pages.length - 1 ? budget.lastPageBodyHeight : budget.bodyHeight;
      expect(total).toBeLessThanOrEqual(limit);
    });
  });

  it("accounts for the totals block shrinking the final page", () => {
    // 10 rows of 10px fit one 100px page, but not once the totals block
    // reduces the usable height to 60px — so they must spill onto a second.
    const pages = packRows(Array.from({ length: 10 }, () => 10), budget);
    expect(pages.length).toBe(2);
    expect(pages[1].length).toBeLessThanOrEqual(6);
  });

  it("preserves every row exactly once and in order", () => {
    const heights = [12, 40, 8, 33, 27, 19, 55, 14, 22, 31, 9, 47];
    const flattened = packRows(heights, budget).flat();

    expect(flattened).toEqual(heights.map((_, i) => i));
  });

  it("handles rows taller than a whole page without dropping or looping", () => {
    const pages = packRows([10, 500, 10], budget);
    expect(pages.flat()).toEqual([0, 1, 2]);
  });

  it("does not emit empty pages when a row overflows", () => {
    const pages = packRows([500, 500], budget);
    pages.forEach((page) => expect(page.length).toBeGreaterThan(0));
  });
});

describe("samePagination", () => {
  it("compares page contents, not identity", () => {
    expect(samePagination([[0, 1]], [[0, 1]])).toBe(true);
    expect(samePagination([[0, 1]], [[0], [1]])).toBe(false);
    expect(samePagination([[0]], [[1]])).toBe(false);
  });
});

describe("amountInWords", () => {
  it("spells whole rupees", () => {
    expect(amountInWords(1)).toBe("One Rupees Only");
    expect(amountInWords(2500)).toBe("Two Thousand Five Hundred Rupees Only");
  });

  it("uses the Indian numbering system", () => {
    expect(amountInWords(150000)).toBe("One Lakh Fifty Thousand Rupees Only");
    expect(amountInWords(12000000)).toBe("One Crore Twenty Lakh Rupees Only");
  });

  it("spells paise separately", () => {
    expect(amountInWords(10.5)).toBe("Ten Rupees and Fifty Paise Only");
  });

  it("carries rounded paise into the rupee column", () => {
    expect(amountInWords(10.999)).toBe("Eleven Rupees Only");
  });

  it("handles zero and invalid input", () => {
    expect(amountInWords(0)).toBe("Zero Rupees Only");
    expect(amountInWords(NaN)).toBe("Zero Rupees Only");
  });
});
