import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import InvoicePreview from "./InvoicePreview";
import { useInvoice } from "@/hooks/use-data";

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

    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="w-screen max-w-none h-screen p-0">

                {/* Top Action Bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-background print:hidden">
                    <h2 className="text-lg font-medium">Invoice Preview</h2>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handlePrint} disabled={!invoice}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>

                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="overflow-y-auto h-[calc(100vh-64px)] bg-muted/30">
                    <div className="py-8">

                        {isLoading && (
                            <div className="text-center text-sm text-muted-foreground">
                                Loading invoice...
                            </div>
                        )}

                        {!isLoading && invoice && (
                            <InvoicePreview invoice={invoice} />
                        )}

                        {!isLoading && !invoice && (
                            <div className="text-center text-sm text-muted-foreground">
                                Invoice not found.
                            </div>
                        )}

                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}