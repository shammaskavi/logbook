import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useInvoices, useParties } from "@/hooks/use-data";
import InvoicePreviewModal from "@/components/invoice/InvoicePreviewModal";
import { format } from "date-fns";
import { Receipt, Plus, Eye, Search, SlidersHorizontal, X } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getInvoiceTotal(invoice: any): number {
    const storedTotal = Number(
        invoice.grand_total ?? invoice.total_amount ?? invoice.amount ?? invoice.total ?? 0
    );
    if (storedTotal > 0) return storedTotal;
    return (invoice.items || []).reduce((sum: number, item: any) => {
        return sum + Number(item.amount ?? (Number(item.quantity || 0) * Number(item.rate || 0)));
    }, 0);
}

export default function InvoicesPage() {
    const navigate = useNavigate();
    const { data: invoices = [], isLoading } = useInvoices();
    const { data: parties = [] } = useParties();

    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [filterMonth, setFilterMonth] = useState<string>("all");
    const [filterParty, setFilterParty] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);

    const activeFiltersCount = [filterMonth, filterParty].filter(v => v !== "all").length;

    const filteredInvoices = useMemo(() => {
        return invoices.filter((inv: any) => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!inv.party_name?.toLowerCase().includes(q) && !inv.invoice_number?.toLowerCase().includes(q)) return false;
            }
            if (filterMonth !== "all") {
                if (new Date(inv.invoice_date).getMonth() !== parseInt(filterMonth)) return false;
            }
            if (filterParty !== "all" && inv.party_id !== filterParty) return false;
            return true;
        });
    }, [invoices, searchQuery, filterMonth, filterParty]);

    const totalAmount = filteredInvoices.reduce((sum: number, inv: any) => sum + getInvoiceTotal(inv), 0);

    const clearFilters = () => { setFilterMonth("all"); setFilterParty("all"); };

    const openPreview = (id: string) => { setSelectedInvoiceId(id); setPreviewOpen(true); };

    const hasActiveFilters = searchQuery || filterMonth !== "all" || filterParty !== "all";

    return (
        <div className="p-4 md:p-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-3 mb-5">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Invoices</h1>
                <Button onClick={() => navigate("/invoices/new")} size="sm" className="gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create Invoice</span>
                    <span className="sm:hidden">New</span>
                </Button>
            </div>

            {/* ── Filter Row — same layout as WorkOrderList ── */}
            <div className="flex items-center gap-2 mb-4">
                {/* Search — always visible */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search party or invoice#..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 bg-card w-full"
                    />
                </div>

                {/* Desktop filter dropdowns */}
                <div className="hidden md:flex items-center gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">Filter</span>
                    <Select value={filterMonth} onValueChange={setFilterMonth}>
                        <SelectTrigger className="w-[110px] h-9 bg-card">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Months</SelectItem>
                            {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filterParty} onValueChange={setFilterParty}>
                        <SelectTrigger className="w-[130px] h-9 bg-card">
                            <SelectValue placeholder="Party" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Parties</SelectItem>
                            {parties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* Mobile Filter Sheet trigger */}
                <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="md:hidden relative shrink-0 h-9 gap-1.5">
                            <SlidersHorizontal className="w-4 h-4" />
                            Filter
                            {activeFiltersCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh]">
                        <SheetHeader className="mb-4">
                            <SheetTitle className="text-left">Filter Invoices</SheetTitle>
                        </SheetHeader>
                        <div className="space-y-3 pb-6">
                            <Select value={filterMonth} onValueChange={setFilterMonth}>
                                <SelectTrigger className="w-full h-10 bg-card">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Months</SelectItem>
                                    {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={filterParty} onValueChange={setFilterParty}>
                                <SelectTrigger className="w-full h-10 bg-card">
                                    <SelectValue placeholder="Party" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Parties</SelectItem>
                                    {parties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {activeFiltersCount > 0 && (
                                <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground" onClick={clearFilters}>
                                    <X className="w-4 h-4" />Clear filters
                                </Button>
                            )}
                            <Button className="w-full" onClick={() => setFilterSheetOpen(false)}>
                                Show {filteredInvoices.length} result{filteredInvoices.length !== 1 ? "s" : ""}
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* ── Loading ── */}
            {isLoading ? (
                <div>
                    {/* Mobile skeletons */}
                    <div className="md:hidden space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <Skeleton className="h-3.5 w-40" />
                            </div>
                        ))}
                    </div>
                    {/* Desktop skeleton */}
                    <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
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
                </div>
            ) : filteredInvoices.length === 0 ? (
                /* ── Empty State ── */
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center bg-card rounded-xl border border-border">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {hasActiveFilters ? "No invoices match your filters" : "No invoices yet"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {hasActiveFilters ? "Try adjusting your filters." : "Create your first invoice to get started."}
                        </p>
                    </div>
                    {!hasActiveFilters && (
                        <Button size="sm" onClick={() => navigate("/invoices/new")} className="gap-1.5 mt-1">
                            <Plus className="w-3.5 h-3.5" />Create Invoice
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    {/* ── Mobile: Card View ── */}
                    <div className="md:hidden space-y-3">
                        {filteredInvoices.map((invoice: any) => {
                            const total = getInvoiceTotal(invoice);
                            return (
                                <div
                                    key={invoice.id}
                                    className="bg-card rounded-xl border border-border p-4 active:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => openPreview(invoice.id)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-foreground truncate">{invoice.party_name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {invoice.invoice_number} · {format(new Date(invoice.invoice_date), "d MMM yyyy")}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="font-semibold text-foreground">₹{total.toFixed(2)}</span>
                                            <Eye className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {/* Mobile total footer */}
                        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 rounded-xl border border-border text-sm">
                            <span className="text-muted-foreground">{filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}</span>
                            <span className="font-semibold text-foreground">₹{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* ── Desktop: Table View ── */}
                    <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            {/* Header */}
                            <div className="min-w-[700px] grid grid-cols-[140px_130px_1fr_130px_100px] items-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                                <div>Invoice No.</div>
                                <div>Date</div>
                                <div>Party</div>
                                <div className="text-right">Total ({filteredInvoices.length})</div>
                                <div></div>
                            </div>

                            {/* Rows */}
                            {filteredInvoices.map((invoice: any) => {
                                const total = getInvoiceTotal(invoice);
                                return (
                                    <div
                                        key={invoice.id}
                                        className="min-w-[700px] grid grid-cols-[140px_130px_1fr_130px_100px] items-center px-4 py-3.5 text-sm border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="font-medium text-foreground">{invoice.invoice_number}</div>
                                        <div className="text-foreground">{format(new Date(invoice.invoice_date), "d MMM yyyy")}</div>
                                        <div className="text-foreground font-medium">{invoice.party_name}</div>
                                        <div className="text-right font-semibold text-foreground">₹{total.toFixed(2)}</div>
                                        <div className="flex justify-end">
                                            <button
                                                className="p-1.5 rounded hover:bg-muted transition-colors flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                                                onClick={() => openPreview(invoice.id)}
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Footer summary */}
                            <div className="min-w-[700px] grid grid-cols-[140px_130px_1fr_130px_100px] items-center px-4 py-3 text-xs font-semibold text-muted-foreground bg-muted/20 border-t border-border">
                                <div></div>
                                <div></div>
                                <div>{filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}</div>
                                <div className="text-right text-foreground">₹{totalAmount.toFixed(2)}</div>
                                <div></div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <InvoicePreviewModal
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                invoiceId={selectedInvoiceId}
            />
        </div>
    );
}
