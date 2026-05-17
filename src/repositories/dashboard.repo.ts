import { supabase } from "@/integrations/supabase/client";

export interface DashboardSummary {
    revenue_this_month: number;
    pending_quantity: number;
    unbilled_amount: number;
    active_customers: number;
    invoice_count: number;
    work_order_count: number;
}

export interface MonthlyQuantityTrendPoint {
    month: string;
    total_quantity: number;
}

export interface JobWorkTypeBreakdownPoint {
    job_work_type_name: string;
    total_quantity: number;
}

export interface TopPartyByQuantityPoint {
    party_name: string;
    total_quantity: number;
}

export const dashboardRepo = {
    async getSummary(
        organizationId: string
    ): Promise<DashboardSummary> {
        const { data, error } = await supabase.rpc(
            "get_dashboard_summary",
            {
                p_organization_id: organizationId,
            }
        );

        if (error) throw error;

        const row = data?.[0];

        return {
            revenue_this_month: Number(
                row?.revenue_this_month ?? 0
            ),
            pending_quantity: Number(
                row?.pending_quantity ?? 0
            ),
            unbilled_amount: Number(
                row?.unbilled_amount ?? 0
            ),
            active_customers: Number(
                row?.active_customers ?? 0
            ),
            invoice_count: Number(
                row?.invoice_count ?? 0
            ),
            work_order_count: Number(
                row?.work_order_count ?? 0
            ),
        };
    },
    async getMonthlyQuantityTrend(
        organizationId: string
    ): Promise<MonthlyQuantityTrendPoint[]> {
        const { data, error } = await supabase.rpc(
            "get_monthly_quantity_trend",
            {
                p_organization_id: organizationId,
            }
        );

        if (error) throw error;

        return (data ?? []).map((row: any) => ({
            month: row.month,
            total_quantity: Number(
                row.total_quantity ?? 0
            ),
        }));
    },
    async getJobWorkTypeBreakdown(
        organizationId: string
    ): Promise<JobWorkTypeBreakdownPoint[]> {
        const { data, error } = await supabase.rpc(
            "get_job_work_type_breakdown",
            {
                p_organization_id: organizationId,
            }
        );

        if (error) throw error;

        return (data ?? []).map((row: any) => ({
            job_work_type_name:
                row.job_work_type_name ?? "Unknown",
            total_quantity: Number(
                row.total_quantity ?? 0
            ),
        }));
    },
    async getTopPartiesByQuantity(
        organizationId: string
    ): Promise<TopPartyByQuantityPoint[]> {
        const { data, error } = await supabase.rpc(
            "get_top_parties_by_quantity",
            {
                p_organization_id: organizationId,
            }
        );

        if (error) throw error;

        return (data ?? []).map((row: any) => ({
            party_name: row.party_name ?? "Unknown",
            total_quantity: Number(
                row.total_quantity ?? 0
            ),
        }));
    }
};