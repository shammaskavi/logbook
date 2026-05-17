import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import MonthlyQuantityTrendChart from "@/components/dashboard/MonthlyQuantityTrendChart";
import JobWorkTypeBreakdownChart from "@/components/dashboard/JobWorkTypeBreakdownChart";
import TopPartiesByQuantityChart from "@/components/dashboard/TopPartiesByQuantityChart";
import {
    IndianRupee,
    Clock3,
    FileText,
    Users,
    Receipt,
    ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

type MetricCardProps = {
    title: string;
    value: number;
    icon: LucideIcon;
    isCurrency?: boolean;
    accent?: "green" | "amber" | "blue" | "default";
};

const accentStyles = {
    green: {
        icon: "bg-green-50 text-green-700",
        value: "text-green-800",
    },
    amber: {
        icon: "bg-amber-50 text-amber-700",
        value: "text-amber-800",
    },
    blue: {
        icon: "bg-blue-50 text-blue-700",
        value: "text-blue-800",
    },
    default: {
        icon: "bg-muted text-muted-foreground",
        value: "text-foreground",
    },
};

function MetricCard({
    title,
    value,
    icon: Icon,
    isCurrency = false,
    accent = "default",
}: MetricCardProps) {
    const styles = accentStyles[accent];
    return (
        <Card className="rounded-2xl shadow-sm border-border/60 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", styles.icon)}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold tracking-tight", styles.value)}>
                    {isCurrency ? formatCurrency(value) : formatNumber(value)}
                </div>
            </CardContent>
        </Card>
    );
}

function DashboardSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="rounded-2xl shadow-sm">
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

export default function DashboardPage() {
    const { data, isLoading, error } = useDashboardSummary();

    const summary = data ?? {
        revenue_this_month: 0,
        pending_quantity: 0,
        unbilled_amount: 0,
        active_customers: 0,
        invoice_count: 0,
        work_order_count: 0,
    };

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Business overview for the current month.
                </p>
            </div>

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
                        />

                        <MetricCard
                            title="Pending Quantity"
                            value={summary.pending_quantity}
                            icon={Clock3}
                            accent="amber"
                        />

                        <MetricCard
                            title="Unbilled Quantity"
                            value={summary.unbilled_amount}
                            icon={FileText}
                            accent="blue"
                        />

                        <MetricCard
                            title="Active Customers"
                            value={summary.active_customers}
                            icon={Users}
                            accent="default"
                        />

                        <MetricCard
                            title="Invoices This Month"
                            value={summary.invoice_count}
                            icon={Receipt}
                            accent="default"
                        />

                        <MetricCard
                            title="Work Orders This Month"
                            value={summary.work_order_count}
                            icon={ClipboardList}
                            accent="default"
                        />
                    </div>

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