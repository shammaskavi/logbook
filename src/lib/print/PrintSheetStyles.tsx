interface PrintSheetStylesProps {
  /** Class applied to each physical sheet element. */
  sheetClass: string;
  widthMm: number;
  heightMm: number;
  paddingMm: number;
}

/**
 * Print rules for a paginated document.
 *
 * Two rules carry most of the weight:
 *
 * - `break-inside: avoid` on the sheet. Pagination is decided in JS, so the
 *   browser must never take a second opinion and split a sheet across two
 *   physical pages — that is what produces half-rows at a page boundary.
 * - `transform: none` on the preview's scaling wrapper. The on-screen preview
 *   shrinks the sheet to fit narrow viewports; leaving that transform active
 *   during print would scale the output and break page breaking.
 */
export function PrintSheetStyles({
  sheetClass,
  widthMm,
  heightMm,
  paddingMm,
}: PrintSheetStylesProps) {
  return (
    <style>{`
      @page {
        size: A4 portrait;
        margin: 0;
      }

      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
        }

        /* Backgrounds and rules are part of the document, not decoration. */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-scale-host {
          transform: none !important;
          width: auto !important;
        }

        .${sheetClass} {
          width: ${widthMm}mm !important;
          height: ${heightMm}mm !important;
          padding: ${paddingMm}mm !important;
          margin: 0 !important;
          box-shadow: none !important;
          outline: none !important;
          border-radius: 0 !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          break-after: page !important;
          page-break-after: always !important;
        }

        .${sheetClass}:last-child {
          break-after: auto !important;
          page-break-after: auto !important;
        }
      }
    `}</style>
  );
}
