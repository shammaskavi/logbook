/**
 * Copy designations for a delivery challan, per CGST Rule 55(2).
 *
 * The rule names three copies — Original for Consignee, Duplicate for
 * Transporter, Triplicate for Consignor — and requires the designation to be
 * marked on the face of each one. We print the consignee and consignor copies
 * two-up on a single A4 sheet, so cutting the sheet in half gives each party a
 * complete challan.
 *
 * Pass `ALL_CHALLAN_COPIES` to `DCPreview` to add the transporter copy; the
 * sheet divides evenly across however many copies it is given.
 */
export const DEFAULT_CHALLAN_COPIES = [
  "Original for Consignee",
  "Triplicate for Consignor",
] as const;

export const ALL_CHALLAN_COPIES = [
  "Original for Consignee",
  "Duplicate for Transporter",
  "Triplicate for Consignor",
] as const;
