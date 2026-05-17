
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

const BRAND_GREEN = "hsl(150, 25%, 30%)";
const BRAND_GREEN_LIGHT = "hsl(150, 25%, 85%)";

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
                    <div className="h-[320px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No work order data available yet.</p>
                    </div>
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
                        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 10%, 88%)" />

                            <XAxis
                                dataKey="month"
                                tickFormatter={formatMonth}
                                tick={{ fontSize: 12, fill: "hsl(150, 5%, 45%)" }}
                                axisLine={false}
                                tickLine={false}
                            />

                            <YAxis
                                tick={{ fontSize: 12, fill: "hsl(150, 5%, 45%)" }}
                                axisLine={false}
                                tickLine={false}
                                width={40}
                            />

                            <Tooltip
                                contentStyle={{
                                    background: "hsl(0, 0%, 100%)",
                                    border: "1px solid hsl(40, 10%, 88%)",
                                    borderRadius: "8px",
                                    fontSize: 13,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                }}
                                labelFormatter={(label) =>
                                    formatMonth(String(label))
                                }
                                formatter={(value: number) => [
                                    new Intl.NumberFormat("en-IN").format(value),
                                    "Quantity",
                                ]}
                            />

                            <Line
                                type="monotone"
                                dataKey="total_quantity"
                                stroke={BRAND_GREEN}
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: BRAND_GREEN, stroke: BRAND_GREEN_LIGHT, strokeWidth: 2 }}
                                activeDot={{ r: 6, fill: BRAND_GREEN }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}