

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonthlyQuantityTrend } from "@/hooks/use-dashboard";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

function formatMonth(value: string) {
    return new Date(value).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
    });
}

function ChartSkeleton() {
    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[320px] w-full rounded-xl" />
            </CardContent>
        </Card>
    );
}

export default function MonthlyQuantityTrendChart() {
    const { data = [], isLoading, error } =
        useMonthlyQuantityTrend();

    if (isLoading) {
        return <ChartSkeleton />;
    }

    if (error) {
        return (
            <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                    <CardTitle>Monthly Quantity Trend</CardTitle>
                    <CardDescription>
                        Total quantity received through work orders.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-destructive">
                        {(error as Error).message ||
                            "Failed to load chart data."}
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (data.length === 0) {
        return (
            <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                    <CardTitle>Monthly Quantity Trend</CardTitle>
                    <CardDescription>
                        Total quantity received through work orders.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No work order data available yet.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader>
                <CardTitle>Monthly Quantity Trend</CardTitle>
                <CardDescription>
                    Total quantity received through work orders.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis
                                dataKey="month"
                                tickFormatter={formatMonth}
                                tick={{ fontSize: 12 }}
                            />

                            <YAxis tick={{ fontSize: 12 }} />

                            <Tooltip
                                labelFormatter={(label) =>
                                    formatMonth(String(label))
                                }
                                formatter={(value: number) => [
                                    new Intl.NumberFormat("en-IN").format(
                                        value
                                    ),
                                    "Quantity",
                                ]}
                            />

                            <Line
                                type="monotone"
                                dataKey="total_quantity"
                                stroke="currentColor"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}