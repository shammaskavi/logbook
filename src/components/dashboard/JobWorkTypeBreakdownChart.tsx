
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobWorkTypeBreakdown } from "@/hooks/use-dashboard";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const BRAND_GREEN = "hsl(150, 25%, 30%)";

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

export default function JobWorkTypeBreakdownChart() {
    const { data = [], isLoading, error } =
        useJobWorkTypeBreakdown();

    if (isLoading) {
        return <ChartSkeleton />;
    }

    if (error) {
        return (
            <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                    <CardTitle>Job Work Type Breakdown</CardTitle>
                    <CardDescription>
                        Quantity processed by each job work type.
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
                    <CardTitle>Job Work Type Breakdown</CardTitle>
                    <CardDescription>
                        Quantity processed by each job work type.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[320px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No job work data available yet.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader>
                <CardTitle>Job Work Type Breakdown</CardTitle>
                <CardDescription>
                    Quantity processed by each job work type.
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
                                dataKey="job_work_type_name"
                                width={120}
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
                                fill={BRAND_GREEN}
                                radius={[0, 6, 6, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}