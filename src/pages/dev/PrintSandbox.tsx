import { useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import { DCPreview, type DCPreviewItem } from "@/components/dc/DCPreview";

/**
 * Development-only harness for the printable documents.
 *
 * Print layout is the one part of this app that cannot be verified from a unit
 * test — page breaking only happens in a real engine at real paper size. This
 * route renders the same components the app uses, with a row count you can
 * push past a page boundary, so pagination can be checked without creating
 * throwaway invoices in the database. Mounted only when `import.meta.env.DEV`.
 */

const JOB_WORKS = [
  "Handloom",
  "Polish",
  "Lattan",
  "Folding",
  "Faal",
  "Latkan",
];

const LONG_LABEL =
  "Handloom weaving with double-border zari work, contrast pallu finishing and hand-knotted latkan attachment as per approved sample";

function buildInvoice(count: number, longText: boolean) {
  const items = Array.from({ length: count }, (_, i) => ({
    id: String(i),
    wo_number: String(1000 + i),
    dc_number: String(200 + (i % 40)),
    particulars: longText && i % 3 === 0 ? LONG_LABEL : JOB_WORKS[i % JOB_WORKS.length],
    quantity: (i % 9) + 1,
    rate: 45 + (i % 5) * 12.5,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);

  return {
    id: "preview",
    invoice_number: "INV-2026-0042",
    invoice_date: "2026-08-14",
    party_name: "Rathi International",
    party_gstin: "29AEDPJ8482L1ZU",
    gst_type: "cgst_sgst",
    cgst_percent: 2.5,
    sgst_percent: 2.5,
    igst_percent: 0,
    subtotal,
    grand_total: subtotal * 1.05,
    items,
  };
}

function buildChallanItems(count: number, longText: boolean): DCPreviewItem[] {
  return Array.from({ length: count }, (_, i) => ({
    work_order_number: String(1000 + i),
    job_work_type_name:
      longText && i % 3 === 0 ? LONG_LABEL : JOB_WORKS[i % JOB_WORKS.length],
    quantity: (i % 9) + 1,
  }));
}

const COUNTS = [1, 5, 20, 34, 35, 36, 80, 200];

export default function PrintSandbox() {
  const [doc, setDoc] = useState<"invoice" | "dc">("invoice");
  const [count, setCount] = useState(35);
  const [longText, setLongText] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef, documentTitle: "print-sandbox" });

  const invoice = useMemo(() => buildInvoice(count, longText), [count, longText]);
  const challanItems = useMemo(
    () => buildChallanItems(count, longText),
    [count, longText]
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-white px-4 py-3 print:hidden">
        <span className="text-sm font-semibold">Print sandbox</span>

        <div className="flex gap-1">
          {(["invoice", "dc"] as const).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={doc === value ? "default" : "outline"}
              onClick={() => setDoc(value)}
            >
              {value === "invoice" ? "Invoice" : "Delivery Challan"}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {COUNTS.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={count === value ? "default" : "outline"}
              onClick={() => setCount(value)}
            >
              {value}
            </Button>
          ))}
        </div>

        <Button
          size="sm"
          variant={longText ? "default" : "outline"}
          onClick={() => setLongText((v) => !v)}
        >
          Long descriptions
        </Button>

        <Button size="sm" onClick={() => handlePrint()}>
          Print / Save as PDF
        </Button>
      </div>

      <div className="flex justify-center py-8">
        <div ref={contentRef} className="print-scale-host">
          {doc === "invoice" ? (
            <InvoicePreview invoice={invoice} />
          ) : (
            <DCPreview
              dcNumber="0142"
              dcDate="2026-08-14"
              partyName="Rathi International"
              partyGstin="29AEDPJ8482L1ZU"
              transporterName="Saleem Bhai"
              items={challanItems}
            />
          )}
        </div>
      </div>
    </div>
  );
}
