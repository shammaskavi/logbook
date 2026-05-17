import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useInvoices } from "@/hooks/use-data";
import InvoicePreviewModal from "@/components/invoice/InvoicePreviewModal";
import { format } from "date-fns";

export default function InvoicesPage() {
    const navigate = useNavigate();
    const { data: invoices = [], isLoading } = useInvoices();

    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    return (
        <div className="p-6 space-y-6">

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Invoices</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage and track generated invoices
                    </p>
                </div>

                <Button onClick={() => navigate("/invoices/new")}>Create Invoice</Button>
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border border-border">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr className="text-left">
                                <th className="px-4 py-3 font-medium">Invoice No</th>
                                <th className="px-4 py-3 font-medium">Date</th>
                                <th className="px-4 py-3 font-medium">Party</th>
                                <th className="px-4 py-3 font-medium text-right">Total</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                                        Loading invoices...
                                    </td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                                        No invoices found.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((invoice: any) => (
                                    <tr key={invoice.id} className="border-t hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            {invoice.invoice_number}
                                        </td>
                                        <td className="px-4 py-3">
                                            {format(new Date(invoice.invoice_date), "dd MMM yyyy")}
                                        </td>
                                        <td className="px-4 py-3">
                                            {invoice.party_name}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold">
                                            ₹{(() => {
                                                const storedTotal = Number(
                                                    invoice.grand_total ??
                                                    invoice.total_amount ??
                                                    invoice.amount ??
                                                    invoice.total ??
                                                    0
                                                );

                                                // If the stored total is valid and greater than zero, use it.
                                                if (storedTotal > 0) {
                                                    return storedTotal.toFixed(2);
                                                }

                                                // Otherwise, calculate the total from invoice items.
                                                const calculatedTotal = (invoice.items || []).reduce(
                                                    (sum: number, item: any) => {
                                                        const lineAmount = Number(
                                                            item.amount ??
                                                            (Number(item.quantity || 0) * Number(item.rate || 0))
                                                        );

                                                        return sum + lineAmount;
                                                    },
                                                    0
                                                );

                                                return calculatedTotal.toFixed(2);
                                            })()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedInvoiceId(invoice.id);
                                                    setPreviewOpen(true);
                                                }}
                                            >
                                                View
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Preview Modal */}
            <InvoicePreviewModal
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                invoiceId={selectedInvoiceId}
            />

        </div>
    );
}
