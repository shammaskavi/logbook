import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchJobWorks,
    createJobWork,
    updateJobWork,
} from "@/repositories/jobWorks.repo";

export function useJobWorks() {
    return useQuery({
        queryKey: ["jobWorks"],
        queryFn: fetchJobWorks,
    });
}

export function useCreateJobWork() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createJobWork,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["jobWorks"] });
        },
    });
}

export function useUpdateJobWork() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name: string; active: boolean } }) =>
            updateJobWork(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["jobWorks"] });
        },
    });
}