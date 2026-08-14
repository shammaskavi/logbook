import { useLayoutEffect, useRef, useState } from "react";
import { packRows, samePagination } from "./pagination";

export interface MeasuredPagesOptions {
  /** Number of line items to lay out. */
  itemCount: number;
  /** Usable height (px) inside one page, excluding the sheet's own padding. */
  pageInnerHeight: number;
  /**
   * Changes whenever the *content* of the rows changes in a way that could
   * affect their height. Row count alone is not enough: swapping to a
   * different document with the same number of longer descriptions has to
   * re-measure. A cheap string is fine — it only needs to differ, not describe.
   */
  signature: string;
}

/**
 * Measures the real rendered height of every row and of the fixed page
 * furniture, then decides where the page breaks go.
 *
 * The caller renders a hidden measurement copy of the document — all rows plus
 * one instance of each chrome block — and attaches the returned refs to it.
 * Heights are read with `offsetHeight` rather than `getBoundingClientRect()`
 * because the on-screen preview is CSS-scaled on small viewports;
 * `offsetHeight` reports untransformed layout height, which is what the print
 * layout actually uses.
 */
export function useMeasuredPages({
  itemCount,
  pageInnerHeight,
  signature,
}: MeasuredPagesOptions) {
  /** Wraps every row, hidden off-screen, one child element per item. */
  const rowsRef = useRef<HTMLElement | null>(null);
  /** Letterhead + table head: repeats identically on every page. */
  const chromeRef = useRef<HTMLElement | null>(null);
  /** Bottom strip used on pages that continue onto another page. */
  const continuedFooterRef = useRef<HTMLElement | null>(null);
  /** Bottom block used on the final page (totals, tax, bank details). */
  const finalFooterRef = useRef<HTMLElement | null>(null);

  const [pages, setPages] = useState<number[][]>(() => [
    Array.from({ length: itemCount }, (_, i) => i),
  ]);

  useLayoutEffect(() => {
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;

      const rowsContainer = rowsRef.current;
      if (!rowsContainer) return;

      const heights = Array.from(rowsContainer.children).map(
        (row) => (row as HTMLElement).offsetHeight
      );

      const chrome = chromeRef.current?.offsetHeight ?? 0;
      const continuedFooter = continuedFooterRef.current?.offsetHeight ?? 0;
      const finalFooter = finalFooterRef.current?.offsetHeight ?? 0;

      const next = packRows(heights, {
        bodyHeight: pageInnerHeight - chrome - continuedFooter,
        lastPageBodyHeight: pageInnerHeight - chrome - finalFooter,
      });

      // Guarded so re-measuring on an unrelated render cannot loop.
      setPages((current) => (samePagination(current, next) ? current : next));
    };

    measure();

    // Web fonts land after first paint and change every row's height, so the
    // first measurement is taken against fallback metrics. Measure again once
    // the real font is in.
    document.fonts?.ready.then(measure).catch(() => {
      /* font loading is best-effort; the initial measurement still stands */
    });

    return () => {
      cancelled = true;
    };
  }, [itemCount, pageInnerHeight, signature]);

  // `pages` is state, so on the render where `itemCount` changes it still
  // describes the *previous* document and can hold indices past the end of the
  // new one. Fall back to a single page until the layout effect re-measures,
  // so a caller can always index its items safely.
  const covers = pages.reduce((total, page) => total + page.length, 0);
  const safePages =
    covers === itemCount
      ? pages
      : [Array.from({ length: itemCount }, (_, i) => i)];

  return { pages: safePages, rowsRef, chromeRef, continuedFooterRef, finalFooterRef };
}
