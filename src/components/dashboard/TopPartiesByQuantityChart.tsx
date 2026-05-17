
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTopPartiesByQuantity } from "@/hooks/use-dashboard";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const BRAND_AMBER = "hsl(43, 80%, 45%)";

function ChartSkeleton() {
    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader>
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[320px] w-full rounded-xl" />
            </CardContent>
        </Card>
    );
}

export default function TopPartiesByQuantityChart() {
    const { data = [], isLoading, error } =
        useTopPartiesByQuantity();

    if (isLoading) {
        return <ChartSkeleton />;
    }

    if (error) {
        return (
            <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                    <CardTitle>Top Parties by Quantity</CardTitle>
                    <CardDescription>
                        Customers contributing the highest work volume.
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
                    <CardTitle>Top Parties by Quantity</CardTitle>
                    <CardDescription>
                        Customers contributing the highest work volume.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[320px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No party data available yet.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader>
                <CardTitle>Top Parties by Quantity</CardTitle>
                <CardDescription>
                    Customers contributing the highest work volume.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 8, right: 16, left: 24, bottom: 8 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(40, 10%, 88%)" />

                            <XAxis
                                type="number"
                                tick={{ fontSize: 12, fill: "hsl(150, 5%, 45%)" }}
                                axisLine={false}
                                tickLine={false}
                            />

                            <YAxis
                                type="category"
                                dataKey="party_name"
                                width={140}
                                tick={{ fontSize: 12, fill: "hsl(150, 5%, 45%)" }}
                                axisLine={false}
                                tickLine={false}
                            />

                            <Tooltip
                                contentStyle={{
                                    background: "hsl(0, 0%, 100%)",
                                    border: "1px solid hsl(40, 10%, 88%)",
                                    borderRadius: "8px",
                                    fontSize: 13,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                }}
                                formatter={(value: number) => [
                                    new Intl.NumberFormat("en-IN").format(value),
                                    "Quantity",
                                ]}
                            />

                            <Bar
                                dataKey="total_quantity"
                                fill={BRAND_AMBER}
                                radius={[0, 6, 6, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}