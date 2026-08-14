/**
 * Row packing for paginated print documents.
 *
 * Documents like invoices and delivery challans have a fixed frame per page
 * (letterhead at the top, totals or a carried-forward strip at the bottom) and
 * a variable number of line items in between. The amount of vertical space
 * left for those line items is not the same on every page: the final page also
 * has to fit the totals, tax breakdown and bank details, so it holds fewer
 * rows than the pages before it.
 *
 * Given the measured height of each row, `packRows` decides which rows land on
 * which page such that no page ever overflows its frame. Measuring instead of
 * assuming a fixed rows-per-page count is what makes wrapped, multi-line rows
 * safe — a hard-coded count silently clips them.
 */

export interface PageBudget {
  /** Vertical space (px) available for rows on any page that is not the last. */
  bodyHeight: number;
  /** Vertical space (px) available for rows on the last page, where the totals block also has to fit. */
  lastPageBodyHeight: number;
}

/**
 * Distribute rows across pages so that every page fits inside its budget.
 *
 * @param heights Measured height in CSS pixels of each row, in document order.
 * @param budget  Space available for rows, per page.
 * @returns Array of pages, each an array of indices into `heights`. Always
 *          returns at least one page, so callers can render an empty document
 *          without special-casing.
 *
 * A row taller than the budget cannot be split — it is placed on a page of its
 * own and allowed to overflow, which is strictly better than dropping it.
 */
export function packRows(heights: number[], budget: PageBudget): number[][] {
  const { bodyHeight, lastPageBodyHeight } = budget;

  if (heights.length === 0) return [[]];

  // First pass: greedily fill pages using the roomier non-final budget.
  const pages: number[][] = [[]];
  let used = 0;

  heights.forEach((height, index) => {
    const current = pages[pages.length - 1];
    // Never start a page with a break — a row taller than a whole page would
    // otherwise push an empty page ahead of itself.
    if (current.length > 0 && used + height > bodyHeight) {
      pages.push([]);
      used = 0;
    }
    pages[pages.length - 1].push(index);
    used += height;
  });

  // Second pass: the final page is smaller than the others because the totals
  // block shares it. Spill rows forward until the last page genuinely fits.
  // Each spill creates a new last page, so this repeats until it settles.
  for (let guard = 0; guard < heights.length + 1; guard++) {
    const last = pages[pages.length - 1];
    const lastHeight = sumOf(heights, last);

    if (lastHeight <= lastPageBodyHeight) break;
    // A single row that cannot fit anywhere: leave it and accept the overflow
    // rather than looping forever moving it from page to page.
    if (last.length <= 1) break;

    const spilled: number[] = [];
    let remaining = lastHeight;

    while (last.length > 1 && remaining > lastPageBodyHeight) {
      const index = last.pop()!;
      spilled.unshift(index);
      remaining -= heights[index];
    }

    pages.push(spilled);
  }

  return pages;
}

function sumOf(heights: number[], indices: number[]): number {
  return indices.reduce((total, index) => total + heights[index], 0);
}

/** True when `a` and `b` describe the same pagination. */
export function samePagination(a: number[][], b: number[][]): boolean {
  if (a.length !== b.length) return false;
  return a.every((page, i) => {
    const other = b[i];
    return page.length === other.length && page.every((v, j) => v === other[j]);
  });
}
