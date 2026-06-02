import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDashboardSummary, usePendingWorkByParty } from "@/hooks/use-dashboard";
import MonthlyQuantityTrendChart from "@/components/dashboard/MonthlyQuantityTrendChart";
import JobWorkTypeBreakdownChart from "@/components/dashboard/JobWorkTypeBreakdownChart";
import TopPartiesByQuantityChart from "@/components/dashboard/TopPartiesByQuantityChart";
import {
    IndianRupee, Clock3, FileText, Users, Receipt,
    ClipboardList, Plus, ArrowRight, ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Formatters ────────────────────────────────────────────────────────────────
function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value || 0);
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-IN").format(value || 0);
}

// ─── Metric Card ───────────────────────────────────────────────────────────────
const accentStyles = {
    green:   { icon: "bg-green-50 text-green-700",   value: "text-green-800" },
    amber:   { icon: "bg-amber-50 text-amber-700",   value: "text-amber-800" },
    blue:    { icon: "bg-blue-50 text-blue-700",     value: "text-blue-800"  },
    default: { icon: "bg-muted text-muted-foreground", value: "text-foreground" },
};

type Accent = keyof typeof accentStyles;

type MetricCardProps = {
    title: string;
    value: number;
    icon: LucideIcon;
    isCurrency?: boolean;
    accent?: Accent;
    onClick?: () => void;
};

function MetricCard({ title, value, icon: Icon, isCurrency = false, accent = "default", onClick }: MetricCardProps) {
    const styles = accentStyles[accent];
    return (
        <Card
            className={cn(
                "rounded-2xl shadow-sm border-border/60 transition-all",
                onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            )}
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", styles.icon)}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
                <div className={cn("text-2xl font-bold tracking-tight", styles.value)}>
                    {isCurrency ? formatCurrency(value) : formatNumber(value)}
                </div>
                {onClick && <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />}
            </CardContent>
        </Card>
    );
}

// ─── Metric Skeleton ────────────────────────────────────────────────────────────
function DashboardSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="rounded-2xl shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-36" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// ─── Pending Work by Party ──────────────────────────────────────────────────────
function PendingWorkByParty() {
    const navigate = useNavigate();
    const { data = [], isLoading, error } = usePendingWorkByParty();

    if (isLoading) {
        return (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/30">
                    <Skeleton className="h-4 w-40" />
                </div>
                <div className="divide-y divide-border">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3.5">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || data.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Pending Work by Party
                    </span>
                </div>
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                        <Clock3 className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">All caught up!</p>
                    <p className="text-xs text-muted-foreground">No pending work orders at the moment.</p>
                </div>
            </div>
        );
    }

    // Find the max value for relative bar width
    const max = Math.max(...data.map(d => d.pending_quantity));

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pending Work by Party
                </span>
                <span className="text-xs text-muted-foreground">
                    {data.length} partie{data.length !== 1 ? "s" : ""} with open work
                </span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
                {data.map((row, idx) => {
                    const barWidth = max > 0 ? (row.pending_quantity / max) * 100 : 0;
                    return (
                        <div
                            key={row.party_id || idx}
                            className="relative px-4 py-3 hover:bg-muted/20 active:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => navigate(`/parties/${row.party_id}/ledger`)}
                        >
                            {/* Background progress bar */}
                            <div
                                className="absolute left-0 top-0 bottom-0 bg-amber-50 transition-all"
                                style={{ width: `${barWidth}%` }}
                            />
                            <div className="relative flex items-center justify-between gap-4">
                                <span className="text-sm font-medium text-foreground truncate">{row.party_name}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-sm font-bold text-amber-700 tabular-nums">
                                        {formatNumber(row.pending_quantity)}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const navigate = useNavigate();
    const { data, isLoading, error } = useDashboardSummary();

    const summary = data ?? {
        revenue_this_month: 0,
        pending_quantity: 0,
        unbilled_amount: 0,
        active_customers: 0,
        invoice_count: 0,
        work_order_count: 0,
    };

    // Current month label e.g. "May 2025"
    const monthLabel = new Date().toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
    });

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {monthLabel} overview
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-9"
                        onClick={() => navigate("/invoices/new")}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">New Invoice</span>
                        <span className="sm:hidden">Invoice</span>
                    </Button>
                    <Button
                        size="sm"
                        className="gap-1.5 h-9"
                        onClick={() => navigate("/work-order/new")}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">New Work Order</span>
                        <span className="sm:hidden">WO</span>
                    </Button>
                </div>
            </div>

            {/* ── Metric Cards ── */}
            {isLoading ? (
                <DashboardSkeleton />
            ) : error ? (
                <Card className="rounded-2xl border-destructive/20 bg-destructive/5">
                    <CardContent className="p-6 text-sm text-destructive">
                        {(error as Error).message || "Failed to load dashboard data."}
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <MetricCard
                            title="Revenue This Month"
                            value={summary.revenue_this_month}
                            icon={IndianRupee}
                            isCurrency
                            accent="green"
                            onClick={() => navigate("/invoices")}
                        />
                        <MetricCard
                            title="Pending Quantity"
                            value={summary.pending_quantity}
                            icon={Clock3}
                            accent="amber"
                            onClick={() => navigate("/")}
                        />
                        <MetricCard
                            title="Unbilled Quantity"
                            value={summary.unbilled_amount}
                            icon={FileText}
                            accent="blue"
                            onClick={() => navigate("/")}
                        />
                        <MetricCard
                            title="Active Customers"
                            value={summary.active_customers}
                            icon={Users}
                            accent="default"
                            onClick={() => navigate("/settings/parties")}
                        />
                        <MetricCard
                            title="Invoices This Month"
                            value={summary.invoice_count}
                            icon={Receipt}
                            accent="default"
                            onClick={() => navigate("/invoices")}
                        />
                        <MetricCard
                            title="Work Orders This Month"
                            value={summary.work_order_count}
                            icon={ClipboardList}
                            accent="default"
                            onClick={() => navigate("/")}
                        />
                    </div>

                    {/* ── Pending Work by Party ── */}
                    <PendingWorkByParty />

                    {/* ── Charts ── */}
                    <div className="grid gap-6 xl:grid-cols-2">
                        <MonthlyQuantityTrendChart />
                        <JobWorkTypeBreakdownChart />
                    </div>
                    <TopPartiesByQuantityChart />
                </>
            )}
        </div>
    );
}