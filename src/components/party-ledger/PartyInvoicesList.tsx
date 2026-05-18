import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, Eye } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import InvoicePreviewModal from "@/components/invoice/InvoicePreviewModal";

interface PartyInvoiceItem {
    quantity?: number | null;
    rate?: number | null;
    amount?: number | null;
}

interface PartyInvoice {
    id: string;
    invoice_number?: string | null;
    invoice_date?: string | null;
    grand_total?: number | null;
    total_amount?: number | null;
    amount?: number | null;
    total?: number | null;
    items?: PartyInvoiceItem[];
}

interface PartyInvoicesListProps {
    invoices?: PartyInvoice[];
    isLoading?: boolean;
    previewCount?: number;
}

function formatDate(value?: string | null) {
    if (!value) return "—";
    try { return format(new Date(value), "d MMM yyyy"); } catch { return "—"; }
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(value);
}

function getInvoiceTotal(invoice: PartyInvoice): number {
    const storedTotal = Number(
        invoice.grand_total ?? invoice.total_amount ?? invoice.amount ?? invoice.total ?? 0
    );
    if (storedTotal > 0) return storedTotal;
    return (invoice.items || []).reduce((sum, item) => {
        return sum + Number(item.amount ?? (Number(item.quantity ?? 0) * Number(item.rate ?? 0)));
    }, 0);
}

// ── Loading ───────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
                <Skeleton className="h-4 w-28" />
            </div>
            <div className="divide-y divide-border">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3.5 w-32" />
                        </div>
                        <Skeleton className="h-5 w-24" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PartyInvoicesList({
    invoices = [],
    isLoading = false,
    previewCount,
}: PartyInvoicesListProps) {
    const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    const displayInvoices = previewCount ? invoices.slice(0, previewCount) : invoices;
    const grandTotal = invoices.reduce((s, inv) => s + getInvoiceTotal(inv), 0);

    if (isLoading) return <LoadingSkeleton />;

    return (
        <>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Invoices
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                        {invoices.length} total
                    </span>
                </div>

                {/* Empty */}
                {invoices.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">No invoices</p>
                            <p className="text-xs text-muted-foreground mt-1">No invoices created for this party yet.</p>
                        </div>
                    </div>
                )}

                {/* Rows */}
                <div className="divide-y divide-border">
                    {displayInvoices.map(invoice => {
                        const total = getInvoiceTotal(invoice);
                        return (
                            <div
                                key={invoice.id}
                                className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 active:bg-muted/30 transition-colors cursor-pointer"
                                onClick={() => { setPreviewInvoiceId(invoice.id); setPreviewOpen(true); }}
                            >
                                <div className="min-w-0">
                                    <p className="font-semibold text-foreground text-sm">
                                        {invoice.invoice_number || "Invoice"}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                                        <span>{formatDate(invoice.invoice_date)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="font-semibold text-foreground text-sm">{formatCurrency(total)}</span>
                                    <Eye className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Grand total footer */}
                {invoices.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                        <span className="text-xs font-semibold text-muted-foreground">
                            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
                        </span>
                        <span className="text-sm font-bold text-foreground">{formatCurrency(grandTotal)}</span>
                    </div>
                )}

                {previewCount && invoices.length > previewCount && (
                    <div className="px-4 py-3 border-t border-border bg-muted/10 text-xs text-muted-foreground text-center">
                        Showing {previewCount} of {invoices.length} — switch to the Invoices tab to see all
                    </div>
                )}
            </div>

            <InvoicePreviewModal
                open={previewOpen}
                onClose={() => { setPreviewOpen(false); setPreviewInvoiceId(null); }}
                invoiceId={previewInvoiceId}
            />
        </>
    );
}