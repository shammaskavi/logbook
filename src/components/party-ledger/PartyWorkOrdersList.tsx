import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ClipboardList, Calendar, Package } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { getWorkOrderStatus, getWorkOrderTotals } from "@/types";
import { format } from "date-fns";

interface WorkOrderItem {
    id?: string;
    quantity?: number | null;
    pending_quantity?: number | null;
    job_work_name?: string | null;
    job_work_type_name?: string | null;
    job_work?: { name?: string | null; job_work_name?: string | null } | null;
}

interface PartyWorkOrder {
    id: string;
    wo_number?: string | null;
    work_order_number?: string | null;
    received_date?: string | null;
    total_quantity?: number | null;
    pending_quantity?: number | null;
    status?: string | null;
    items?: WorkOrderItem[];
    party_id?: string;
    party_name?: string;
}

interface PartyWorkOrdersListProps {
    workOrders: PartyWorkOrder[];
    isLoading?: boolean;
    previewCount?: number;
}

function getJobWorkName(item: WorkOrderItem) {
    return item.job_work_type_name || item.job_work_name ||
        item.job_work?.name || item.job_work?.job_work_name || "Unnamed Job Work";
}

function formatDate(value?: string | null) {
    if (!value) return "—";
    try { return format(new Date(value), "d MMM yyyy"); } catch { return "—"; }
}

function getTotalQty(wo: PartyWorkOrder) {
    if (wo.total_quantity != null && Number(wo.total_quantity) > 0) return Number(wo.total_quantity);
    return (wo.items || []).reduce((s, i) => s + Number(i.quantity ?? 0), 0);
}

function getTotalPending(wo: PartyWorkOrder) {
    if (wo.pending_quantity != null && Number(wo.pending_quantity) >= 0) return Number(wo.pending_quantity);
    return (wo.items || []).reduce((s, i) => s + Number(i.pending_quantity ?? 0), 0);
}

// ── Loading ───────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
                <Skeleton className="h-4 w-36" />
            </div>
            <div className="divide-y divide-border">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 space-y-2">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-3.5 w-40" />
                        <div className="flex gap-4">
                            <Skeleton className="h-3.5 w-16" />
                            <Skeleton className="h-3.5 w-16" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PartyWorkOrdersList({
    workOrders = [],
    isLoading = false,
    previewCount,
}: PartyWorkOrdersListProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (isLoading) return <LoadingSkeleton />;

    const displayOrders = previewCount ? workOrders.slice(0, previewCount) : workOrders;

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Work Orders
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                    {workOrders.length} total
                </span>
            </div>

            {/* Empty */}
            {workOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">No work orders</p>
                        <p className="text-xs text-muted-foreground mt-1">No work orders created for this party yet.</p>
                    </div>
                </div>
            )}

            {/* Rows */}
            <div className="divide-y divide-border">
                {displayOrders.map(wo => {
                    const woNumber = wo.work_order_number || wo.wo_number || "Work Order";
                    const totalQty = getTotalQty(wo);
                    const totalPending = getTotalPending(wo);
                    const isExpanded = expandedId === wo.id;

                    // Build a status-compatible object for StatusBadge
                    const statusObj = {
                        items: (wo.items || []).map(i => ({
                            id: String(i.id || ""),
                            work_order_id: wo.id,
                            job_work_type_id: "",
                            job_work_type_name: getJobWorkName(i),
                            quantity: Number(i.quantity ?? 0),
                            pending_quantity: Number(i.pending_quantity ?? 0),
                        })),
                    };
                    const status = wo.status || getWorkOrderStatus(statusObj as any);

                    return (
                        <div key={wo.id}>
                            <div
                                className="p-4 cursor-pointer hover:bg-muted/20 active:bg-muted/30 transition-colors"
                                onClick={() => setExpandedId(isExpanded ? null : wo.id)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-foreground text-sm">{woNumber}</p>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(wo.received_date)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Package className="w-3.5 h-3.5" />
                                                Qty: <strong className="text-foreground">{totalQty}</strong>
                                            </span>
                                            <span>
                                                Pending: <strong className="text-foreground">{totalPending}</strong>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <StatusBadge status={status} />
                                        {isExpanded
                                            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded items */}
                            {isExpanded && wo.items && wo.items.length > 0 && (
                                <div className="border-t border-border bg-muted/10">
                                    <div className="grid grid-cols-[1fr_80px_80px] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20">
                                        <div>Job Work</div>
                                        <div className="text-center">Qty</div>
                                        <div className="text-right">Pending</div>
                                    </div>
                                    <div className="divide-y divide-border">
                                        {wo.items.map((item, idx) => (
                                            <div key={idx} className="grid grid-cols-[1fr_80px_80px] px-4 py-2.5 text-sm">
                                                <div className="text-foreground truncate pr-2">{getJobWorkName(item)}</div>
                                                <div className="text-center text-foreground">{Number(item.quantity ?? 0)}</div>
                                                <div className="text-right text-muted-foreground">{Number(item.pending_quantity ?? 0)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* "Showing N of M" hint when in preview mode */}
            {previewCount && workOrders.length > previewCount && (
                <div className="px-4 py-3 border-t border-border bg-muted/10 text-xs text-muted-foreground text-center">
                    Showing {previewCount} of {workOrders.length} — switch to the Work Orders tab to see all
                </div>
            )}
        </div>
    );
}