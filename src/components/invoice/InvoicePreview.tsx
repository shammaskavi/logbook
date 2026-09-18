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
        className="grid grid-cols-[auto_1fr_190px]"
        style={{ borderBottom: `1px solid ${INK}` }}
      >
        <div
          className="p-2 flex items-center justify-center aspect-square h-full"
          style={{ borderRight: `1px solid ${INK}`, aspectRatio: "1 / 1" }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", maxWidth: 52, maxHeight: 52, objectFit: "contain" }}
            />
          ) : (
            <div
              className="w-12 h-12 aspect-square text-white flex items-center justify-center font-bold text-2xl leading-none"
              style={{ background: INK }}
            >
              {businessInitials}
            </div>
          )}
        </div>

        <div className="p-2 flex flex-col justify-center">
          <div
            className="text-2xl font-bold uppercase leading-tight"
            style={{ color: INK }}
          >
            {businessName}
          </div>
          <div className="text-[12px] text-slate-700 leading-normal mt-0.5 whitespace-pre-line">
            {businessAddress}
          </div>
        </div>

        <div className="text-[12px] flex flex-col justify-center" style={{ borderLeft: `1px solid ${INK}` }}>
          {businessGstin && (
            <div className="px-3 py-1" style={{ borderBottom: `1px solid ${INK}` }}>
              <span className="font-semibold">GSTIN:</span> {businessGstin}
            </div>
          )}
          <div className="px-3 py-1" style={{ borderBottom: `1px solid ${INK}` }}>
            <span className="font-semibold">PAN:</span> {businessPan}
          </div>
          <div className="px-3 py-1">
            <span className="font-semibold">Ph:</span> {businessPhone}
          </div>
        </div>
      </div>

      <div
        className="text-white text-center font-bold py-1.5 uppercase tracking-widest text-[13px]"
        style={{ background: INK, borderBottom: `1px solid ${INK}` }}
      >
        Tax Invoice
      </div>

      <div
        className="grid grid-cols-[1.8fr_1.2fr_1fr] text-[12.5px]"
        style={{ borderBottom: `1px solid ${INK}` }}
      >
        <div className="px-3 py-2" style={{ borderRight: `1px solid ${INK}` }}>
          <div>
            <span className="font-semibold">To:</span>{" "}
            <span className="font-bold uppercase text-[13px]">{invoice?.party_name || "-"}</span>
          </div>
          {invoice?.party_gstin && (
            <div className="mt-0.5 text-[11px]">
              <span className="font-semibold">GSTIN:</span> {invoice.party_gstin}
            </div>
          )}
        </div>

        <div className="px-3 py-2" style={{ borderRight: `1px solid ${INK}` }}>
          <span className="font-semibold">Invoice No:</span>{" "}
          <span className="font-bold break-all leading-tight text-[13px]" style={{ color: INK }}>
            {displayInvoiceNo}
          </span>
        </div>

        <div className="px-3 py-2 flex flex-col justify-between">
          <div>
            <span className="font-semibold">Date:</span> {displayDate}
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-1">
            Page {pageIndex + 1} of {pageCount}
          </div>
        </div>
      </div>
    </div>
  );

  const tableHead = (
    <thead>
      <tr className="uppercase font-bold text-[12px]" style={{ background: "#F5E7D9", color: INK }}>
        <th
          className="w-[10%] px-3 py-2 text-left"
          style={{ borderRight: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}
        >
          WO No.
        </th>
        <th
          className="w-[10%] px-3 py-2 text-left"
          style={{ borderRight: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}
        >
          DC No.
        </th>
        <th
          className="w-[44%] px-3 py-2 text-left"
          style={{ borderRight: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}
        >
          Particulars
        </th>
        <th
          className="w-[12%] px-3 py-2 text-right"
          style={{ borderRight: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}
        >
          Quantity
        </th>
        <th
          className="w-[8%] px-3 py-2 text-right"
          style={{ borderRight: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}
        >
          Rate
        </th>
        <th
          className="w-[16%] px-3 py-2 text-right"
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
        className="px-3 py-2 align-top font-medium"
        style={{ borderRight: `1px solid ${INK}` }}
      >
        {item?.wo_number || "-"}
      </td>
      <td
        className="px-3 py-2 align-top font-medium"
        style={{ borderRight: `1px solid ${INK}` }}
      >
        {item?.dc_number || "-"}
      </td>
      <td
        className="px-3 py-2 align-top break-words font-medium"
        style={{ borderRight: `1px solid ${INK}` }}
      >
        {item?.particulars || "-"}
      </td>
      <td
        className="px-3 py-2 text-right align-top tabular-nums"
        style={{ borderRight: `1px solid ${INK}` }}
      >
        {Number(item?.quantity || 0)}
      </td>
      <td
        className="px-3 py-2 text-right align-top tabular-nums"
        style={{ borderRight: `1px solid ${INK}` }}
      >
        {money(item?.rate)}
      </td>
      <td className="px-3 py-2 text-right align-top tabular-nums font-bold">
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
      className="grid grid-cols-[64%_20%_16%] text-[12px]"
      style={{ borderTop: `1px solid ${INK}` }}
    >
      <div
        className="px-3 py-2 italic text-slate-600"
        style={{ borderRight: `1px solid ${INK}` }}
      >
        Continued on next page
      </div>
      <div
        className="px-3 py-2 font-semibold text-right tabular-nums"
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
        className="grid grid-cols-[64%_36%] text-[12px]"
        style={{ borderTop: `1px solid ${INK}` }}
      >
        <div
          className="px-3 py-2 flex flex-col justify-between"
          style={{ borderRight: `1px solid ${INK}` }}
        >
          <div>
            <div className="font-semibold text-[11px]">Amount (in words)</div>
            <div className="italic text-slate-700 leading-snug mt-0.5 text-[12px]">{words}</div>
          </div>
          <div className="font-semibold mt-2 text-[12px]">Total Quantity: {totalQuantity}</div>
        </div>

        <div>
          <div className="flex justify-between px-3 py-1.5">
            <span>Subtotal</span>
            <span className="tabular-nums font-semibold">{money(subtotal)}</span>
          </div>

          {taxRows.map((row) => (
            <div key={row.label} className="flex justify-between px-3 py-1.5">
              <span>{row.label}</span>
              <span className="tabular-nums font-semibold">{money(row.value)}</span>
            </div>
          ))}

          <div
            className="flex justify-between px-3 py-2 font-bold text-white text-[13.5px]"
            style={{ background: INK, borderTop: `1px solid ${INK}` }}
          >
            <span>TOTAL</span>
            <span className="tabular-nums">₹ {money(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div
        className="px-3 py-2 text-[11px] leading-relaxed"
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

      <div className="grid grid-cols-3 px-4 pt-6 pb-3 text-[11px] text-slate-600 items-end">
        <div className="text-left uppercase font-medium">Receiver's Signature</div>
        <div className="text-center text-slate-400">E. &amp; O.E.</div>
        <div className="text-right uppercase font-semibold">For {businessName}</div>
      </div>

      <div
        className="py-1 px-3 text-center text-[9px] text-slate-500 tracking-wider flex items-center justify-center gap-1.5"
        style={{ borderTop: `1px solid ${INK}`, background: "#FAF7F5" }}
      >
        <span className="uppercase font-medium text-slate-600">Powered by Tovak</span>
        <span className="text-slate-400">•</span>
        <a
          href="https://tovak.in"
          target="_blank"
          rel="noreferrer"
          className="text-slate-600 font-semibold hover:underline print:no-underline"
        >
          tovak.in
        </a>
      </div>
    </div>
  );

  const sheetStyle: React.CSSProperties = {
    width: `${A4.widthMm}mm`,
    height: `${A4.safeHeightMm}mm`,
    padding: `${PADDING_MM}mm`,
    boxSizing: "border-box",
    fontSize: "12.5px",
    lineHeight: 1.35,
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
            <table className="w-full table-fixed text-[12.5px] border-collapse">
              {tableHead}
            </table>
          </div>

          <table className="w-full table-fixed text-[12.5px] border-collapse">
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
                    className="w-full h-full table-fixed text-[12.5px] border-collapse"
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
