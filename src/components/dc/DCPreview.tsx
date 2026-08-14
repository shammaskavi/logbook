import { format } from "date-fns";
import { useBusinessSettings } from "@/hooks/use-data";
import { supabase } from "@/integrations/supabase/client";
import { A4, mmToPx } from "@/lib/print/paper";
import { PrintSheetStyles } from "@/lib/print/PrintSheetStyles";
import { useMeasuredPages } from "@/lib/print/useMeasuredPages";
import { DEFAULT_CHALLAN_COPIES } from "@/lib/print/challanCopies";

const SHEET_CLASS = "dc-sheet";
const PADDING_MM = 4;
const INK = "#8B1E14";

export type DCPreviewItem = {
  work_order_number: string;
  job_work_type_name: string;
  quantity: number;
};

export type DCPreviewProps = {
  dcNumber: string;
  dcDate: string;
  partyName: string;
  partyGstin?: string | null;
  transporterName?: string | null;
  items: DCPreviewItem[];
  /** Copy designations printed on this sheet. Defaults to consignee + consignor. */
  copies?: readonly string[];
};

export function DCPreview({
  dcNumber,
  dcDate,
  partyName,
  partyGstin,
  transporterName,
  items,
  copies = DEFAULT_CHALLAN_COPIES,
}: DCPreviewProps) {
  const { data: businessSettings } = useBusinessSettings();

  const copyCount = Math.max(1, copies.length);
  const copyHeightMm = A4.safeHeightMm / copyCount;
  const pageInnerHeight = mmToPx(copyHeightMm - PADDING_MM * 2) - 6;

  const signature = `${items.length}:${items
    .map((item) => `${item.job_work_type_name}|${item.work_order_number}`)
    .join("~")}`;

  const { pages, rowsRef, chromeRef, continuedFooterRef, finalFooterRef } =
    useMeasuredPages({
      itemCount: items.length,
      pageInnerHeight,
      signature,
    });

  const totalQuantity = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const displayDate = dcDate ? format(new Date(dcDate), "dd MMM yyyy") : "-";

  const businessName = businessSettings?.business_name || "-";
  const businessAddress = businessSettings?.business_address || "";
  const businessGstin = businessSettings?.gstin || "";
  const businessPhone = businessSettings?.phone || "-";

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

  // ── Reusable blocks ──────────────────────────────────────────────────────

  const letterhead = (pageIndex: number, pageCount: number, copyLabel: string) => (
    <div>
      <div
        className="grid grid-cols-[44px_1fr_150px]"
        style={{ borderBottom: `1px solid ${INK}` }}
      >
        <div
          className="p-1.5 flex items-center justify-center"
          style={{ borderRight: `1px solid ${INK}` }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{ width: 30, height: 30, objectFit: "contain" }}
            />
          ) : (
            <div
              className="w-8 h-8 text-white flex items-center justify-center font-bold text-base leading-none"
              style={{ background: INK }}
            >
              {businessInitials}
            </div>
          )}
        </div>

        <div className="p-1.5">
          <div
            className="text-sm font-bold uppercase leading-tight"
            style={{ color: INK }}
          >
            {businessName}
          </div>
          <div className="text-[8px] text-slate-700 leading-tight mt-0.5 whitespace-pre-line">
            {businessAddress}
          </div>
        </div>

        <div className="text-[8px]" style={{ borderLeft: `1px solid ${INK}` }}>
          {businessGstin && (
            <div className="px-2 py-1" style={{ borderBottom: `1px solid ${INK}` }}>
              <span className="font-semibold">GSTIN:</span> {businessGstin}
            </div>
          )}
          <div className="px-2 py-1">
            <span className="font-semibold">Ph:</span> {businessPhone}
          </div>
        </div>
      </div>

      {/* Title bar carries the copy designation, which Rule 55(2) requires to
          be marked on the face of each copy. */}
      <div
        className="flex items-center justify-between px-2 text-white font-bold py-1 uppercase"
        style={{ background: INK, borderBottom: `1px solid ${INK}` }}
      >
        <span className="text-[8px] font-semibold opacity-0 select-none">
          {copyLabel}
        </span>
        <span className="tracking-wide">Delivery Challan</span>
        <span className="text-[8px] font-semibold tracking-tight">{copyLabel}</span>
      </div>

      <div
        className="grid grid-cols-[1fr_120px_120px] text-[9px]"
        style={{ borderBottom: `1px solid ${INK}` }}
      >
        <div className="px-2 py-1.5" style={{ borderRight: `1px solid ${INK}` }}>
          <div>
            <span className="font-semibold">To:</span>{" "}
            <span className="font-bold uppercase">{partyName || "-"}</span>
          </div>
          {partyGstin && (
            <div className="mt-0.5">
              <span className="font-semibold">GSTIN:</span> {partyGstin}
            </div>
          )}
        </div>

        <div className="px-2 py-1.5" style={{ borderRight: `1px solid ${INK}` }}>
          <span className="font-semibold">DC No:</span>{" "}
          <span className="font-bold" style={{ color: INK }}>
            {dcNumber}
          </span>
        </div>

        <div className="px-2 py-1.5 flex flex-col justify-between">
          <div>
            <span className="font-semibold">Date:</span> {displayDate}
          </div>
          <div className="text-[7px] text-slate-500 font-semibold mt-0.5">
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
          className="w-[14%] px-2 py-[3px] text-left"
          style={{ borderRight: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}
        >
          WO No.
        </th>
        <th
          className="w-[63%] px-2 py-[3px] text-left"
          style={{ borderRight: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}
        >
          Particulars
        </th>
        <th
          className="w-[23%] px-2 py-[3px] text-right"
          style={{ borderBottom: `1px solid ${INK}` }}
        >
          Quantity
        </th>
      </tr>
    </thead>
  );

  const itemRow = (item: DCPreviewItem | undefined, key: number, striped: boolean) => (
    <tr key={key} className={striped ? "bg-slate-50" : "bg-white"}>
      <td
        className="px-2 py-[3px] align-top"
        style={{ borderRight: `1px solid ${INK}` }}
      >
        {item?.work_order_number || "-"}
      </td>
      <td
        className="px-2 py-[3px] align-top break-words"
        style={{ borderRight: `1px solid ${INK}` }}
      >
        {item?.job_work_type_name || "-"}
      </td>
      <td className="px-2 py-[3px] text-right align-top tabular-nums font-semibold">
        {Number(item?.quantity || 0)}
      </td>
    </tr>
  );

  const spacerRow = (
    <tr aria-hidden="true" style={{ height: "100%" }}>
      <td style={{ borderRight: `1px solid ${INK}` }} />
      <td style={{ borderRight: `1px solid ${INK}` }} />
      <td />
    </tr>
  );

  const continuedFooter = (carriedQty: number) => (
    <div
      className="grid grid-cols-[77%_23%] text-[9px]"
      style={{ borderTop: `1px solid ${INK}` }}
    >
      <div
        className="px-2 py-1.5 italic text-slate-600"
        style={{ borderRight: `1px solid ${INK}` }}
      >
        Continued on next page
      </div>
      <div
        className="px-2 py-1.5 text-right font-bold tabular-nums"
        style={{ background: "#F5E7D9", color: INK }}
      >
        C/F {carriedQty}
      </div>
    </div>
  );

  const finalFooter = (
    <div>
      <div
        className="grid grid-cols-[77%_23%] text-[9px]"
        style={{ borderTop: `1px solid ${INK}` }}
      >
        <div className="px-2 py-1.5" style={{ borderRight: `1px solid ${INK}` }}>
          <span className="font-semibold">Transporter:</span>{" "}
          {transporterName || "Self"}
          <span className="mx-3">|</span>
          <span className="font-semibold">No. of Bundles:</span>{" "}
          <span className="inline-block border-b border-slate-400 w-16" />
        </div>
        <div
          className="px-2 py-1.5 text-right font-bold tabular-nums"
          style={{ background: "#F5E7D9", color: INK }}
        >
          {totalQuantity}
        </div>
      </div>

      <div
        className="px-2 py-1 text-[7px] text-slate-500 italic"
        style={{ borderTop: `1px solid ${INK}` }}
      >
        Goods sent for job work only. Not a sale — this challan is not a tax invoice.
      </div>

      <div
        className="grid grid-cols-3 px-3 pt-4 pb-2 text-[8px] text-slate-600 items-end"
        style={{ borderTop: `1px solid ${INK}` }}
      >
        <div className="text-left uppercase">Receiver's Signature</div>
        <div className="text-center text-slate-400">&nbsp;</div>
        <div className="text-right uppercase font-semibold">For {businessName}</div>
      </div>
    </div>
  );

  const copyStyle: React.CSSProperties = {
    height: `${copyHeightMm}mm`,
    padding: `${PADDING_MM}mm`,
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
    fontSize: "10px",
    lineHeight: 1.2,
  };

  const pageCount = pages.length;

  /** One challan copy: the whole document body, labelled for its recipient. */
  const renderCopy = (
    pageIndex: number,
    pageRows: number[],
    copyLabel: string,
    carriedQty: number,
    isLastPage: boolean
  ) => (
    <div style={copyStyle}>
      <div className="flex flex-col h-full" style={{ border: `1px solid ${INK}` }}>
        {letterhead(pageIndex, pageCount, copyLabel)}

        <div className="flex-grow flex flex-col overflow-hidden">
          <table
            className="w-full table-fixed text-[9px] border-collapse"
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

        {isLastPage ? finalFooter : continuedFooter(carriedQty)}
      </div>
    </div>
  );

  return (
    <>
      <PrintSheetStyles
        sheetClass={SHEET_CLASS}
        widthMm={A4.widthMm}
        heightMm={A4.safeHeightMm}
        paddingMm={0}
      />

      {/* Hidden measurement copy — one challan copy at true size. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: -99999,
          top: 0,
          visibility: "hidden",
          pointerEvents: "none",
          width: `${A4.widthMm}mm`,
          ...copyStyle,
        }}
      >
        <div style={{ border: `1px solid ${INK}` }}>
          <div ref={chromeRef as React.RefObject<HTMLDivElement>}>
            {letterhead(0, 1, copies[0])}
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
            {continuedFooter(0)}
          </div>
          <div ref={finalFooterRef as React.RefObject<HTMLDivElement>}>
            {finalFooter}
          </div>
        </div>
      </div>

      <div id="printable-dc" className="flex flex-col gap-6 print:gap-0 w-full">
        {pages.map((pageRows, pageIndex) => {
          const isLastPage = pageIndex === pageCount - 1;

          const carriedQty = pages
            .slice(0, pageIndex + 1)
            .flat()
            .reduce((sum, index) => sum + Number(items[index]?.quantity || 0), 0);

          return (
            <div
              key={pageIndex}
              className={`${SHEET_CLASS} bg-white text-black mx-auto shadow-lg print:shadow-none`}
              style={{
                width: `${A4.widthMm}mm`,
                height: `${A4.safeHeightMm}mm`,
                boxSizing: "border-box",
              }}
            >
              {copies.map((copyLabel, copyIndex) => (
                <div key={copyLabel} className="relative">
                  {renderCopy(pageIndex, pageRows, copyLabel, carriedQty, isLastPage)}

                  {/* Cut guide between copies. */}
                  {copyIndex < copyCount - 1 && (
                    <div
                      className="absolute left-0 right-0 bottom-0 flex items-center justify-center"
                      style={{ transform: "translateY(50%)" }}
                    >
                      <span className="bg-white px-2 text-[6px] uppercase tracking-widest text-slate-400">
                        cut here
                      </span>
                    </div>
                  )}
                  {copyIndex < copyCount - 1 && (
                    <div
                      className="absolute left-0 right-0 bottom-0"
                      style={{ borderTop: "1px dashed #94a3b8" }}
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
