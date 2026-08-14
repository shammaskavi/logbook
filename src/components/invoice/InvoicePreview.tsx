import { format } from "date-fns";
import { useBusinessSettings } from "@/hooks/use-data";
import { supabase } from "@/integrations/supabase/client";
import { A4, mmToPx } from "@/lib/print/paper";
import { PrintSheetStyles } from "@/lib/print/PrintSheetStyles";
import { useMeasuredPages } from "@/lib/print/useMeasuredPages";
import { amountInWords } from "@/lib/format/amountInWords";

const SHEET_CLASS = "invoice-sheet";
const PADDING_MM = 8;

/**
 * Height available inside one sheet for the framed document, in CSS pixels.
 * A few pixels are held back for the frame's own border and sub-pixel rounding.
 */
const PAGE_INNER_HEIGHT = mmToPx(A4.safeHeightMm - PADDING_MM * 2) - 6;

const INK = "#8B1E14";

interface InvoicePreviewProps {
  invoice: any;
}

function money(value: number): string {
  return Number(value || 0).toFixed(2);
}

function lineAmount(item: any): number {
  return Number(item?.quantity || 0) * Number(item?.rate || 0);
}

export default function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const { data: businessSettings } = useBusinessSettings();

  const items: any[] = Array.isArray(invoice?.items) ? invoice.items : [];

  // Re-measure when the row content changes, not just when the count does.
  const signature = `${items.length}:${items
    .map((item) => `${item?.particulars ?? ""}|${item?.wo_number ?? ""}`)
    .join("~")}`;

  const { pages, rowsRef, chromeRef, continuedFooterRef, finalFooterRef } =
    useMeasuredPages({
      itemCount: items.length,
      pageInnerHeight: PAGE_INNER_HEIGHT,
      signature,
    });

  const computedSubtotal = items.reduce((sum, item) => sum + lineAmount(item), 0);

  const cgstPercent = Number(invoice?.cgst_percent || 0);
  const sgstPercent = Number(invoice?.sgst_percent || 0);
  const igstPercent = Number(invoice?.igst_percent || 0);

  const gstType = invoice?.gst_type ?? "none";

  // The stored figures are what was actually billed, so they win when present.
  const storedSubtotal = Number(invoice?.subtotal);
  const subtotal =
    Number.isFinite(storedSubtotal) && storedSubtotal > 0
      ? storedSubtotal
      : computedSubtotal;

  const cgstAmount = gstType === "cgst_sgst" ? (subtotal * cgstPercent) / 100 : 0;
  const sgstAmount = gstType === "cgst_sgst" ? (subtotal * sgstPercent) / 100 : 0;
  const igstAmount = gstType === "igst" ? (subtotal * igstPercent) / 100 : 0;

  const storedTotal = Number(invoice?.grand_total);
  const grandTotal =
    Number.isFinite(storedTotal) && storedTotal > 0
      ? storedTotal
      : subtotal + cgstAmount + sgstAmount + igstAmount;

  const totalQuantity = items.reduce(
    (sum, item) => sum + Number(item?.quantity || 0),
    0
  );

  const words =
    invoice?.amount_in_words && invoice.amount_in_words !== "-"
      ? invoice.amount_in_words
      : amountInWords(grandTotal);

  const businessName = businessSettings?.business_name || invoice?.businessName || "-";

  const businessInitials = businessName
    .trim()
    .split(/\s+/)
    .map((word: string) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const logoUrl = businessSettings?.logo_url
    ? supabase.storage.from("business-logos").getPublicUrl(businessSettings.logo_url)
        .data.publicUrl
    : null;

  const businessAddress =
    businessSettings?.business_address || invoice?.businessAddress || "-";
  const businessPan = businessSettings?.pan || invoice?.businessPAN || "-";
  const businessPhone = businessSettings?.phone || invoice?.businessPhone || "-";
  const businessGstin = businessSettings?.gstin || "";

  const displayInvoiceNo = invoice?.invoice_number || "-";
  const displayDate = invoice?.invoice_date
    ? format(new Date(invoice.invoice_date), "dd MMM yyyy")
    : "-";

  const taxRows =
    gstType === "cgst_sgst"
      ? [
          { label: `CGST @ ${cgstPercent}%`, value: cgstAmount },
          { label: `SGST @ ${sgstPercent}%`, value: sgstAmount },
        ]
      : gstType === "igst"
        ? [{ label: `IGST @ ${igstPercent}%`, value: igstAmount }]
        : [];

  // ── Reusable blocks ──────────────────────────────────────────────────────
  // Rendered both into the hidden measurement copy and into the real pages, so
  // that what gets measured is exactly what gets printed.

  const letterhead = (pageIndex: number, pageCount: number) => (
    <div>
      <div
        className="grid grid-cols-[56px_1fr_150px]"
        style={{ borderBottom: `1px solid ${INK}` }}
      >
        <div
          className="p-2 flex items-center justify-center"
          style={{ borderRight: `1px solid ${INK}` }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{ width: 40, height: 40, objectFit: "contain" }}
            />
          ) : (
            <div
              className="w-10 h-10 text-white flex items-center justify-center font-bold text-xl leading-none"
              style={{ background: INK }}
            >
              {businessInitials}
            </div>
          )}
        </div>

        <div className="p-2">
          <div
            className="text-lg font-bold uppercase leading-tight"
            style={{ color: INK }}
          >
            {businessName}
          </div>
          <div className="text-[9px] text-slate-700 leading-tight mt-0.5 whitespace-pre-line">
            {businessAddress}
          </div>
        </div>

        <div className="text-[9px]" style={{ borderLeft: `1px solid ${INK}` }}>
          {businessGstin && (
            <div className="px-2 py-1" style={{ borderBottom: `1px solid ${INK}` }}>
              <span className="font-semibold">GSTIN:</span> {businessGstin}
            </div>
          )}
          <div className="px-2 py-1" style={{ borderBottom: `1px solid ${INK}` }}>
            <span className="font-semibold">PAN:</span> {businessPan}
          </div>
          <div className="px-2 py-1">
            <span className="font-semibold">Ph:</span> {businessPhone}
          </div>
        </div>
      </div>

      <div
        className="text-white text-center font-bold py-1 uppercase tracking-wide"
        style={{ background: INK, borderBottom: `1px solid ${INK}` }}
      >
        Tax Invoice
      </div>

      <div
        className="grid grid-cols-[1.8fr_1.2fr_1fr] text-[10px]"
        style={{ borderBottom: `1px solid ${INK}` }}
      >
        <div className="px-2 py-2" style={{ borderRight: `1px solid ${INK}` }}>
          <div>
            <span className="font-semibold">To:</span>{" "}
            <span className="font-bold uppercase">{invoice?.party_name || "-"}</span>
          </div>
          {invoice?.party_gstin && (
            <div className="mt-0.5">
              <span className="font-semibold">GSTIN:</span> {invoice.party_gstin}
            </div>
          )}
        </div>

        <div className="px-2 py-2" style={{ borderRight: `1px solid ${INK}` }}>
          <span className="font-semibold">Invoice No:</span>{" "}
          <span className="font-bold break-all leading-tight" style={{ color: INK }}>
            {displayInvoiceNo}
          </span>
        </div>

        <div className="px-2 py-2 flex flex-col justify-between">
          <div>
            <span className="font-semibold">Date:</span> {displayDate}
          </div>
          <div className="text-[8px] text-slate-500 font-semibold mt-1">
            Page {pageIndex + 1} of {pageCount}
          </div>
        </div>
      </div>
    </div>
  );

  const tableHead = (
    <thead>
      <tr className="uppercase font-bold" style={{ background: "#F5E7D9", color: INK }}>
        <th
          className="w-[10%] px-2 py-[4px] text-left"
          style={{ borderRight: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}
        >
          WO No.
        </th>
        <th
          className="w-[10%] px-2 py-[4px] text-left"
          style={{ borderRight: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}
        >
          DC No.
        </th>
        <th
          className="w-[44%] px-2 py-[4px] text-left"
          style={{ borderRight: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}
        >
          Particulars
        </th>
        <th
          className="w-[12%] px-2 py-[4px] text-right"
          style={{ borderRight: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}
        >
          Quantity
        </th>
        <th
          className="w-[8%] px-2 py-[4px] text-right"
          style={{ borderRight: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}
        >
          Rate
        </th>
        <th
          className="w-[16%] px-2 py-[4px] text-right"
          style={{ borderBottom: `1px solid ${INK}` }}
        >
          Amount
        </th>
      </tr>
    </thead>
  );

  const itemRow = (item: any, key: number, striped: boolean) => (
    <tr key={key} className={striped ? "bg-slate-50" : "bg-white"}>
      <td
        className="px-2 py-[3px] align-top"
        style={{ borderRight: `1px solid ${INK}` }}
      >
        {item?.wo_number || "-"}
      </td>
      <td
        className="px-2 py-[3px] align-top"
        style={{ borderRight: `1px solid ${INK}` }}
      >
        {item?.dc_number || "-"}
      </td>
      <td
        className="px-2 py-[3px] align-top break-words"
        style={{ borderRight: `1px solid ${INK}` }}
      >
        {item?.particulars || "-"}
      </td>
      <td
        className="px-2 py-[3px] text-right align-top tabular-nums"
        style={{ borderRight: `1px solid ${INK}` }}
      >
        {Number(item?.quantity || 0)}
      </td>
      <td
        className="px-2 py-[3px] text-right align-top tabular-nums"
        style={{ borderRight: `1px solid ${INK}` }}
      >
        {money(item?.rate)}
      </td>
      <td className="px-2 py-[3px] text-right align-top tabular-nums font-semibold">
        {money(lineAmount(item))}
      </td>
    </tr>
  );

  /** Stretches to fill the leftover height so the column rules reach the frame. */
  const spacerRow = (
    <tr aria-hidden="true" style={{ height: "100%" }}>
      <td style={{ borderRight: `1px solid ${INK}` }} />
      <td style={{ borderRight: `1px solid ${INK}` }} />
      <td style={{ borderRight: `1px solid ${INK}` }} />
      <td style={{ borderRight: `1px solid ${INK}` }} />
      <td style={{ borderRight: `1px solid ${INK}` }} />
      <td />
    </tr>
  );

  const continuedFooter = (carriedQty: number, carriedAmount: number) => (
    <div
      className="grid grid-cols-[64%_20%_16%] text-[10px]"
      style={{ borderTop: `1px solid ${INK}` }}
    >
      <div
        className="px-2 py-2 italic text-slate-600"
        style={{ borderRight: `1px solid ${INK}` }}
      >
        Continued on next page
      </div>
      <div
        className="px-2 py-2 font-semibold text-right tabular-nums"
        style={{ borderRight: `1px solid ${INK}` }}
      >
        Carried Fwd: {carriedQty}
      </div>
      <div className="px-3 py-2 font-bold text-right tabular-nums">
        {money(carriedAmount)}
      </div>
    </div>
  );

  const finalFooter = (
    <div>
      <div
        className="grid grid-cols-[64%_36%] text-[10px]"
        style={{ borderTop: `1px solid ${INK}` }}
      >
        <div
          className="px-2 py-2 flex flex-col justify-between"
          style={{ borderRight: `1px solid ${INK}` }}
        >
          <div>
            <div className="font-semibold">Amount (in words)</div>
            <div className="italic text-slate-700 leading-tight mt-0.5">{words}</div>
          </div>
          <div className="font-semibold mt-2">Total Quantity: {totalQuantity}</div>
        </div>

        <div>
          <div className="flex justify-between px-3 py-1">
            <span>Subtotal</span>
            <span className="tabular-nums">{money(subtotal)}</span>
          </div>

          {taxRows.map((row) => (
            <div key={row.label} className="flex justify-between px-3 py-1">
              <span>{row.label}</span>
              <span className="tabular-nums">{money(row.value)}</span>
            </div>
          ))}

          <div
            className="flex justify-between px-3 py-2 font-bold text-white"
            style={{ background: INK, borderTop: `1px solid ${INK}` }}
          >
            <span>TOTAL</span>
            <span className="tabular-nums">₹ {money(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div
        className="px-2 py-2 text-[9px] leading-relaxed"
        style={{ borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}
      >
        <span className="font-bold mr-4">Bank Details</span>
        <span className="mr-4">
          <span className="font-semibold">A/C Name:</span>{" "}
          {businessSettings?.account_name || businessName}
        </span>
        <span className="mr-4">
          <span className="font-semibold">A/C No:</span>{" "}
          {businessSettings?.account_number || "-"}
        </span>
        <span className="mr-4">
          <span className="font-semibold">IFSC:</span>{" "}
          {businessSettings?.ifsc_code || "-"}
        </span>
        <span className="mr-4">
          <span className="font-semibold">Branch:</span>{" "}
          {businessSettings?.bank_branch || "-"}
        </span>
        <span>
          <span className="font-semibold">Bank:</span>{" "}
          {businessSettings?.bank_name || "-"}
        </span>
      </div>

      <div className="grid grid-cols-3 px-3 pt-5 pb-3 text-[9px] text-slate-600 items-end">
        <div className="text-left uppercase">Receiver's Signature</div>
        <div className="text-center text-slate-400">E. &amp; O.E.</div>
        <div className="text-right uppercase font-semibold">For {businessName}</div>
      </div>
    </div>
  );

  const sheetStyle: React.CSSProperties = {
    width: `${A4.widthMm}mm`,
    height: `${A4.safeHeightMm}mm`,
    padding: `${PADDING_MM}mm`,
    boxSizing: "border-box",
    fontSize: "11px",
    lineHeight: 1.25,
  };

  if (!invoice) return null;

  const pageCount = pages.length;

  return (
    <>
      <PrintSheetStyles
        sheetClass={SHEET_CLASS}
        widthMm={A4.widthMm}
        heightMm={A4.safeHeightMm}
        paddingMm={PADDING_MM}
      />

      {/* Hidden measurement copy: identical width, padding and typography to a
          real sheet, so measured heights match printed heights exactly. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: -99999,
          top: 0,
          visibility: "hidden",
          pointerEvents: "none",
          ...sheetStyle,
        }}
      >
        <div style={{ border: `1px solid ${INK}` }}>
          <div ref={chromeRef as React.RefObject<HTMLDivElement>}>
            {letterhead(0, 1)}
            <table className="w-full table-fixed text-[9px] border-collapse">
              {tableHead}
            </table>
          </div>

          <table className="w-full table-fixed text-[9px] border-collapse">
            <tbody ref={rowsRef as React.RefObject<HTMLTableSectionElement>}>
              {items.map((item, index) => itemRow(item, index, index % 2 === 1))}
            </tbody>
          </table>

          <div ref={continuedFooterRef as React.RefObject<HTMLDivElement>}>
            {continuedFooter(0, 0)}
          </div>
          <div ref={finalFooterRef as React.RefObject<HTMLDivElement>}>
            {finalFooter}
          </div>
        </div>
      </div>

      <div id="printable-invoice" className="flex flex-col gap-6 print:gap-0 w-full">
        {pages.map((pageRows, pageIndex) => {
          const isLastPage = pageIndex === pageCount - 1;

          // Running totals through the end of this page.
          const throughThisPage = pages
            .slice(0, pageIndex + 1)
            .flat()
            .map((index) => items[index]);

          const carriedQty = throughThisPage.reduce(
            (sum, item) => sum + Number(item?.quantity || 0),
            0
          );
          const carriedAmount = throughThisPage.reduce(
            (sum, item) => sum + lineAmount(item),
            0
          );

          return (
            <div
              key={pageIndex}
              className={`${SHEET_CLASS} bg-white text-black font-sans mx-auto flex flex-col shadow-lg print:shadow-none`}
              style={sheetStyle}
            >
              <div
                className="flex flex-col h-full"
                style={{ border: `1px solid ${INK}` }}
              >
                {letterhead(pageIndex, pageCount)}

                <div className="flex-grow flex flex-col overflow-hidden">
                  <table
                    className="w-full h-full table-fixed text-[9px] border-collapse"
                    style={{ height: "100%" }}
                  >
                    {tableHead}
                    <tbody>
                      {pageRows.map((itemIndex) =>
                        itemRow(items[itemIndex], itemIndex, itemIndex % 2 === 1)
                      )}
                      {spacerRow}
                    </tbody>
                  </table>
                </div>

                {isLastPage ? finalFooter : continuedFooter(carriedQty, carriedAmount)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
