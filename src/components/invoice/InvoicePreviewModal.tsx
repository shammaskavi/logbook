import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import InvoicePreview from "./InvoicePreview";
import { useInvoice } from "@/hooks/use-data";
import { useRef } from "react"; // 1. Import useRef
import { useReactToPrint } from "react-to-print"; // 2. Import the hook

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

    // 3. Create a reference for the invoice content
    const contentRef = useRef<HTMLDivElement>(null);

    // 4. Set up the print function
    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: `Invoice_${invoice?.invoice_number || 'draft'}`,
    });

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-screen max-w-none h-screen p-0 flex flex-col [&>button]:hidden">

                {/* Top Action Bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-background print:hidden">
                    <h2 className="text-lg font-medium">Invoice Preview</h2>
                    <div className="flex items-center gap-2">
                        {/* 5. Trigger handlePrint */}
                        <Button variant="default" onClick={() => handlePrint()} disabled={!invoice}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print Invoice
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="overflow-y-auto flex-grow bg-muted/30">
                    <div className="py-8 flex justify-center">
                        {isLoading ? (
                            <div className="text-center text-sm text-muted-foreground">Loading...</div>
                        ) : invoice ? (
                            /* 6. Attach the ref here */
                            <div ref={contentRef} className="bg-white shadow-xl">
                                <InvoicePreview invoice={invoice} />
                            </div>
                        ) : (
                            <div className="text-center">Invoice not found.</div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}