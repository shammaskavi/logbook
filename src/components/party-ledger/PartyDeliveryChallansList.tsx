import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Truck, Calendar, Package } from "lucide-react";
import { format } from "date-fns";

interface PartyDeliveryChallanItem {
    quantity?: number | null;
    job_work_type_name?: string | null;
    job_work_name?: string | null;
    pending_quantity?: number | null;
    job_work?: { name?: string | null; job_work_name?: string | null } | null;
}

interface PartyDeliveryChallan {
    id: string;
    dc_number?: string | null;
    challan_number?: string | null;
    generated_date?: string | null;
    delivery_date?: string | null;
    created_at?: string | null;
    transporter_name?: string | null;
    total_quantity?: number | null;
    items?: PartyDeliveryChallanItem[];
}

interface PartyDeliveryChallansListProps {
    deliveryChallans?: PartyDeliveryChallan[];
    isLoading?: boolean;
    previewCount?: number;
}

function getJobWorkName(item: PartyDeliveryChallanItem) {
    return item.job_work_type_name || item.job_work_name ||
        item.job_work?.name || item.job_work?.job_work_name || "Unnamed Job Work";
}

function formatDate(value?: string | null) {
    if (!value) return "—";
    try { return format(new Date(value), "d MMM yyyy"); } catch { return "—"; }
}

function getTotalQty(challan: PartyDeliveryChallan) {
    if (challan.total_quantity != null && Number(challan.total_quantity) > 0) return Number(challan.total_quantity);
    return (challan.items || []).reduce((s, i) => s + Number(i.quantity ?? 0), 0);
}

// ── Loading ───────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
                <Skeleton className="h-4 w-44" />
            </div>
            <div className="divide-y divide-border">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 space-y-2">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3.5 w-20" />
                        </div>
                        <div className="flex gap-4">
                            <Skeleton className="h-3.5 w-28" />
                            <Skeleton className="h-3.5 w-16" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PartyDeliveryChallansList({
    deliveryChallans = [],
    isLoading = false,
    previewCount,
}: PartyDeliveryChallansListProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (isLoading) return <LoadingSkeleton />;

    const displayChallans = previewCount ? deliveryChallans.slice(0, previewCount) : deliveryChallans;

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Delivery Challans
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                    {deliveryChallans.length} total
                </span>
            </div>

            {/* Empty */}
            {deliveryChallans.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Truck className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">No delivery challans</p>
                        <p className="text-xs text-muted-foreground mt-1">No challans created for this party yet.</p>
                    </div>
                </div>
            )}

            {/* Rows */}
            <div className="divide-y divide-border">
                {displayChallans.map(challan => {
                    const challanNumber = challan.dc_number || challan.challan_number || "Delivery Challan";
                    const totalQty = getTotalQty(challan);
                    const isExpanded = expandedId === challan.id;
                    const dateVal = challan.generated_date || challan.delivery_date || challan.created_at;

                    return (
                        <div key={challan.id}>
                            <div
                                className="p-4 cursor-pointer hover:bg-muted/20 active:bg-muted/30 transition-colors"
                                onClick={() => setExpandedId(isExpanded ? null : challan.id)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-foreground text-sm">DC# {challanNumber}</p>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(dateVal)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Package className="w-3.5 h-3.5" />
                                                Qty: <strong className="text-foreground">{totalQty}</strong>
                                            </span>
                                            {challan.transporter_name && (
                                                <span className="truncate">{challan.transporter_name}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {isExpanded
                                            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded items */}
                            {isExpanded && challan.items && challan.items.length > 0 && (
                                <div className="border-t border-border bg-muted/10">
                                    <div className="grid grid-cols-[1fr_80px] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20">
                                        <div>Job Work</div>
                                        <div className="text-right">Qty</div>
                                    </div>
                                    <div className="divide-y divide-border">
                                        {challan.items.map((item, idx) => (
                                            <div key={idx} className="grid grid-cols-[1fr_80px] px-4 py-2.5 text-sm">
                                                <div className="text-foreground truncate pr-2">{getJobWorkName(item)}</div>
                                                <div className="text-right text-foreground">{Number(item.quantity ?? 0)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {previewCount && deliveryChallans.length > previewCount && (
                <div className="px-4 py-3 border-t border-border bg-muted/10 text-xs text-muted-foreground text-center">
                    Showing {previewCount} of {deliveryChallans.length} — switch to the Challans tab to see all
                </div>
            )}
        </div>
    );
}