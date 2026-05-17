import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInvoices, useParties } from "@/hooks/use-data";
import InvoicePreviewModal from "@/components/invoice/InvoicePreviewModal";
import { format } from "date-fns";
import { Receipt, Plus, Eye, Search } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getInvoiceTotal(invoice: any): number {
    const storedTotal = Number(
        invoice.grand_total ??
        invoice.total_amount ??
        invoice.amount ??
        invoice.total ??
        0
    );
    if (storedTotal > 0) return storedTotal;

    return (invoice.items || []).reduce((sum: number, item: any) => {
        const lineAmount = Number(
            item.amount ??
            (Number(item.quantity || 0) * Number(item.rate || 0))
        );
        return sum + lineAmount;
    }, 0);
}

export default function InvoicesPage() {
    const navigate = useNavigate();
    const { data: invoices = [], isLoading } = useInvoices();
    const { data: parties = [] } = useParties();

    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    // Filters — matching WorkOrderList pattern
    const [filterMonth, setFilterMonth] = useState<string>("all");
    const [filterParty, setFilterParty] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredInvoices = useMemo(() => {
        return invoices.filter((inv: any) => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (
                    !inv.party_name?.toLowerCase().includes(q) &&
                    !inv.invoice_number?.toLowerCase().includes(q)
                ) return false;
            }
            if (filterMonth !== "all") {
                const m = new Date(inv.invoice_date).getMonth();
                if (m !== parseInt(filterMonth)) return false;
            }
            if (filterParty !== "all" && inv.party_id !== filterParty) return false;
            return true;
        });
    }, [invoices, searchQuery, filterMonth, filterParty]);

    const totalAmount = filteredInvoices.reduce(
        (sum: number, inv: any) => sum + getInvoiceTotal(inv),
        0
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
                <Button onClick={() => navigate("/invoices/new")} className="gap-2 w-full sm:w-auto">
                    <Plus className="w-4 h-4" />
                    Create Invoice
                </Button>
            </div>

            {/* Filters — same pattern as WorkOrderList */}
            <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:flex-wrap sm:items-center">
                <span className="text-sm font-medium text-muted-foreground">Filter</span>

                <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-full sm:w-[110px] h-9 bg-card">
                        <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {MONTHS.map((m, i) => (
                            <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterParty} onValueChange={setFilterParty}>
                    <SelectTrigger className="w-full sm:w-[130px] h-9 bg-card">
                        <SelectValue placeholder="Party" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Parties</SelectItem>
                        {parties.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="relative w-full sm:ml-auto sm:w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 w-full h-9 bg-card"
                    />
                </div>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <div className="min-w-[700px] px-4 py-3 border-b border-border">
                            <Skeleton className="h-4 w-full" />
                        </div>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="min-w-[700px] grid grid-cols-[140px_130px_1fr_130px_100px] items-center px-4 py-3.5 border-b border-border last:border-b-0">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-20 ml-auto" />
                                <Skeleton className="h-8 w-16 ml-auto" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        {/* Header row */}
                        <div className="min-w-[700px] grid grid-cols-[140px_130px_1fr_130px_100px] items-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                            <div>Invoice No.</div>
                            <div>Date</div>
                            <div>Party</div>
                            <div className="text-right">Total ({filteredInvoices.length})</div>
                            <div></div>
                        </div>

                        {/* Empty state */}
                        {filteredInvoices.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                    <Receipt className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        {searchQuery || filterMonth !== "all" || filterParty !== "all"
                                            ? "No invoices match your filters"
                                            : "No invoices yet"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {searchQuery || filterMonth !== "all" || filterParty !== "all"
                                            ? "Try adjusting your filters."
                                            : "Create your first invoice to get started."}
                                    </p>
                                </div>
                                {!searchQuery && filterMonth === "all" && filterParty === "all" && (
                                    <Button size="sm" onClick={() => navigate("/invoices/new")} className="gap-1.5 mt-1">
                                        <Plus className="w-3.5 h-3.5" />
                                        Create Invoice
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Rows */}
                        {filteredInvoices.map((invoice: any) => {
                            const total = getInvoiceTotal(invoice);
                            return (
                                <div
                                    key={invoice.id}
                                    className="min-w-[700px] grid grid-cols-[140px_130px_1fr_130px_100px] items-center px-4 py-3.5 text-sm border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                                >
                                    <div className="font-medium text-foreground">
                                        {invoice.invoice_number}
                                    </div>
                                    <div className="text-foreground">
                                        {format(new Date(invoice.invoice_date), "d MMM yyyy")}
                                    </div>
                                    <div className="text-foreground font-medium">
                                        {invoice.party_name}
                                    </div>
                                    <div className="text-right font-semibold text-foreground">
                                        ₹{total.toFixed(2)}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            className="p-1 rounded hover:bg-muted transition-colors flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                                            onClick={() => {
                                                setSelectedInvoiceId(invoice.id);
                                                setPreviewOpen(true);
                                            }}
                                        >
                                            <Eye className="w-4 h-4" />
                                            View
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Footer summary row */}
                        {filteredInvoices.length > 0 && (
                            <div className="min-w-[700px] grid grid-cols-[140px_130px_1fr_130px_100px] items-center px-4 py-3 text-xs font-semibold text-muted-foreground bg-muted/20 border-t border-border">
                                <div></div>
                                <div></div>
                                <div>{filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}</div>
                                <div className="text-right text-foreground">
                                    ₹{totalAmount.toFixed(2)}
                                </div>
                                <div></div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            <InvoicePreviewModal
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                invoiceId={selectedInvoiceId}
            />
        </div>
    );
}
