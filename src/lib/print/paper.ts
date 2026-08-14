/**
 * Physical paper geometry shared by every printable document.
 *
 * CSS treats `1mm` as a real physical millimetre, and at the browser's
 * reference resolution that works out to exactly 96 CSS pixels per inch.
 * Layout measurements come back in CSS pixels, so every budget we compare
 * them against has to be converted through the same constant.
 */
export const PX_PER_MM = 96 / 25.4;

/** Convert millimetres to CSS pixels. */
export function mmToPx(millimetres: number): number {
  return millimetres * PX_PER_MM;
}

/**
 * A4 sheet, and the height we actually give a sheet element.
 *
 * The sheet is deliberately a hair shorter than the 297mm `@page` box. With
 * `margin: 0` the page box and the element are the same size, and sub-pixel
 * rounding in either direction is enough to push the last sliver onto a
 * second, blank sheet. Giving up 1mm costs nothing visually and removes the
 * trailing-blank-page class of bug entirely.
 */
export const A4 = {
  widthMm: 210,
  heightMm: 297,
  /** Height applied to the sheet element itself. */
  safeHeightMm: 296,
} as const;

/**
 * A delivery challan is printed two-up: two half-height copies stacked on one
 * A4 sheet, so the sheet can be cut in half to yield two complete challans.
 */
export const A4_HALF = {
  widthMm: 210,
  /** Half of `A4.safeHeightMm`, so two copies fit one sheet exactly. */
  heightMm: 148,
} as const;
