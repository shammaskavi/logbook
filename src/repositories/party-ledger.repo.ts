import { supabase } from "@/integrations/supabase/client";

export interface PartyLedgerSummary {
    total_work_orders: number;
    total_quantity: number;
    total_invoiced: number;
    outstanding_amount: number;
}

export const partyLedgerRepo = {
    async getSummary(
        organizationId: string,
        partyId: string
    ): Promise<PartyLedgerSummary> {
        const { data, error } = await supabase.rpc(
            "get_party_ledger_summary",
            {
                p_organization_id: organizationId,
                p_party_id: partyId,
            }
        );

        if (error) throw error;

        const row = data?.[0];

        return {
            total_work_orders: Number(
                row?.total_work_orders ?? 0
            ),
            total_quantity: Number(
                row?.total_quantity ?? 0
            ),
            total_invoiced: Number(
                row?.total_invoiced ?? 0
            ),
            outstanding_amount: Number(
                row?.outstanding_amount ?? 0
            ),
        };
    },
};