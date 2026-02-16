import { supabase } from "@/integrations/supabase/client";

type DCItemInput = {
    work_order_id: string;
    work_order_item_id: string;
    job_work_type_name: string;
    dc_quantity: number;
};

type CreateDCInput = {
    dc_number: string;
    generated_date: string; // ISO date
    party_id: string;
    party_name: string;
    transporter_name?: string | null;
    items: DCItemInput[];
};

export async function createDeliveryChallanWithEffects(input: CreateDCInput) {
    const { data, error } = await supabase.rpc(
        "create_delivery_challan_with_effects",
        {
            p_dc_number: input.dc_number,
            p_generated_date: input.generated_date,
            p_party_id: input.party_id,
            p_party_name: input.party_name,
            p_transporter_name: input.transporter_name ?? null,
            p_items: input.items.map(i => ({
                work_order_id: i.work_order_id,
                work_order_item_id: i.work_order_item_id,
                job_work_type_name: i.job_work_type_name,
                dc_quantity: i.dc_quantity,
            })),
        }
    );

    if (error) throw error;
    return data; // returns dc_id
}