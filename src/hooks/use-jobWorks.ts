import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    fetchJobWorks,
    createJobWork,
    updateJobWork,
} from "@/repositories/jobWorks.repo";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

export function useJobWorks() {
    const { organizationId, isLoading: organizationLoading } =
        useCurrentOrganization();

    return useQuery({
        queryKey: ["jobWorks", organizationId],
        enabled: !organizationLoading && !!organizationId,
        queryFn: async () => {
            return fetchJobWorks(organizationId!);
        },
    });
}

export function useCreateJobWork() {
    const queryClient = useQueryClient();
    const { organizationId } = useCurrentOrganization();

    return useMutation({
        mutationFn: async (name: string) => {
            if (!organizationId) {
                throw new Error("No organization found for the current user.");
            }

            return createJobWork(name, organizationId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["jobWorks", organizationId],
            });
        },
    });
}

export function useUpdateJobWork() {
    const queryClient = useQueryClient();
    const { organizationId } = useCurrentOrganization();

    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: { name: string; active: boolean };
        }) => {
            if (!organizationId) {
                throw new Error("No organization found for the current user.");
            }

            return updateJobWork(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["jobWorks", organizationId],
            });
        },
    });
}