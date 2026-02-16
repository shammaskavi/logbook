import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchParties,
    createParty,
    updateParty,
    deleteParty,
} from "@/repositories/parties.repo";

export function useParties() {
    return useQuery({
        queryKey: ["parties"],
        queryFn: fetchParties,
    });
}

export function useCreateParty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createParty,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["parties"] });
        },
    });
}

export function useUpdateParty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: {
            id: string; data: {
                name: string;
                phone_number?: string | null;
                gstin?: string | null;
            }
        }) => updateParty(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["parties"] });
        },
    });
}

export function useDeleteParty() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteParty,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["parties"] });
        },
    });
}