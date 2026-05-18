import { useQuery } from "@tanstack/react-query";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { partyLedgerRepo } from "@/repositories/party-ledger.repo";

export function usePartyLedgerSummary(
    partyId?: string
) {
    const {
        organizationId,
        isLoading: organizationLoading,
    } = useCurrentOrganization();

    return useQuery({
        queryKey: [
            "party_ledger_summary",
            organizationId,
            partyId,
        ],
        enabled:
            !organizationLoading &&
            !!organizationId &&
            !!partyId,
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        queryFn: async () => {
            if (!organizationId || !partyId) {
                throw new Error(
                    "Missing organization or party ID."
                );
            }

            return partyLedgerRepo.getSummary(
                organizationId,
                partyId
            );
        },
    });
}