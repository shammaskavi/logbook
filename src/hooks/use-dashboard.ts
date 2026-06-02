import { useQuery } from "@tanstack/react-query";
import { dashboardRepo } from "@/repositories/dashboard.repo";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

export function useDashboardSummary() {
    const { organizationId, isLoading: organizationLoading } =
        useCurrentOrganization();

    return useQuery({
        queryKey: ["dashboard_summary", organizationId],
        enabled: !organizationLoading && !!organizationId,
        staleTime: 60_000, // 1 minute
        gcTime: 5 * 60_000, // 5 minutes
        queryFn: async () => {
            if (!organizationId) {
                throw new Error(
                    "No organization found for the current user."
                );
            }

            return dashboardRepo.getSummary(organizationId);
        },
    });
}

export function useMonthlyQuantityTrend() {
    const { organizationId, isLoading: organizationLoading } =
        useCurrentOrganization();

    return useQuery({
        queryKey: [
            "dashboard_monthly_quantity_trend",
            organizationId,
        ],
        enabled:
            !organizationLoading && !!organizationId,
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        queryFn: async () => {
            if (!organizationId) {
                throw new Error(
                    "No organization found for the current user."
                );
            }

            return dashboardRepo.getMonthlyQuantityTrend(
                organizationId
            );
        },
    });
}

export function useJobWorkTypeBreakdown() {
    const { organizationId, isLoading: organizationLoading } =
        useCurrentOrganization();

    return useQuery({
        queryKey: [
            "dashboard_job_work_type_breakdown",
            organizationId,
        ],
        enabled:
            !organizationLoading && !!organizationId,
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        queryFn: async () => {
            if (!organizationId) {
                throw new Error(
                    "No organization found for the current user."
                );
            }

            return dashboardRepo.getJobWorkTypeBreakdown(
                organizationId
            );
        },
    });
}

export function useTopPartiesByQuantity() {
    const { organizationId, isLoading: organizationLoading } =
        useCurrentOrganization();

    return useQuery({
        queryKey: [
            "dashboard_top_parties_by_quantity",
            organizationId,
        ],
        enabled:
            !organizationLoading && !!organizationId,
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        queryFn: async () => {
            if (!organizationId) {
                throw new Error(
                    "No organization found for the current user."
                );
            }

            return dashboardRepo.getTopPartiesByQuantity(
                organizationId
            );
        },
    });
}

export function usePendingWorkByParty() {
    const { organizationId, isLoading: organizationLoading } =
        useCurrentOrganization();

    return useQuery({
        queryKey: [
            "dashboard_pending_work_by_party",
            organizationId,
        ],
        enabled:
            !organizationLoading && !!organizationId,
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        queryFn: async () => {
            if (!organizationId) {
                throw new Error(
                    "No organization found for the current user."
                );
            }

            return dashboardRepo.getPendingWorkByParty(
                organizationId
            );
        },
    });
}