import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import InvoicePreview from "./InvoicePreview";
import { useInvoice } from "@/hooks/use-data";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

interface InvoicePreviewModalProps {
    open: boolean;
    onClose: () => void;
    invoiceId: string | null;
}

export default function InvoicePreviewModal({
    open,
    onClose,
    invoiceId,
}: InvoicePreviewModalProps) {
    const { data: invoice, isLoading } = useInvoice(invoiceId ?? undefined);
    const contentRef = useRef<HTMLDivElement>(null);

    // Browser print is also the PDF path: "Save as PDF" in the print dialog
    // produces real vector text with the page breaks we laid out, which a
    // canvas-based export cannot match.
    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: `Invoice_${(invoice as any)?.invoice_number || "draft"}`,
    });

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-screen max-w-none h-screen p-0 flex flex-col [&>button]:hidden border-none rounded-none">

                <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b bg-background sticky top-0 z-10 print:hidden">
                    <h2 className="text-sm md:text-lg font-semibold truncate max-w-[150px] md:max-w-none">
                        Invoice {(invoice as any)?.invoice_number}
                    </h2>

                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => handlePrint()} disabled={!invoice}>
                            <Printer className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Print / Save as PDF</span>
                        </Button>

                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="overflow-auto flex-grow bg-slate-100/50 flex flex-col items-center">
                    <div className="py-4 md:py-12 w-full flex justify-center">
                        {isLoading ? (
                            <div className="text-center py-20 text-sm text-muted-foreground">
                                Loading invoice...
                            </div>
                        ) : invoice ? (
                            <div className="relative w-full flex justify-center px-4">
                                {/* `print-scale-host` is unset during print so the sheet
                                    prints at true A4 size regardless of viewport scaling. */}
                                <div
                                    ref={contentRef}
                                    className="print-scale-host origin-top scale-[0.45] sm:scale-[0.6] md:scale-[0.85] lg:scale-100"
                                >
                                    <InvoicePreview invoice={invoice} />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20">Invoice not found.</div>
                        )}
                    </div>

                    {/* Lets mobile users scroll past the visually scaled sheet. */}
                    <div className="h-[500px] md:hidden" aria-hidden="true" />
                </div>
            </DialogContent>
        </Dialog>
    );
}
