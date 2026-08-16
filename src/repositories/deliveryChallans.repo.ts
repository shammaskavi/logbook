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

export async function createDeliveryChallanWithEffects(
    input: CreateDCInput,
    organizationId: string
) {
    const { data, error } = await supabase.rpc(
        "create_delivery_challan_with_effects",
        {
            p_organization_id: organizationId,
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

type ManualDCItemInput = {
    job_work_type_name: string;
    quantity: number;
    /** Typed in by hand — this line has no work order behind it. */
    manual_wo_number?: string | null;
};

type CreateManualDCInput = {
    dc_number: string;
    generated_date: string; // ISO date
    party_id: string;
    party_name: string;
    transporter_name?: string | null;
    items: ManualDCItemInput[];
};

/**
 * Creates a free-form challan: items are entered manually rather than drawn
 * from a work order's pending quantities, so nothing is decremented anywhere.
 */
export async function createManualDeliveryChallan(
    input: CreateManualDCInput,
    organizationId: string
) {
    const { data, error } = await supabase.rpc(
        "create_manual_delivery_challan",
        {
            p_organization_id: organizationId,
            p_dc_number: input.dc_number,
            p_generated_date: input.generated_date,
            p_party_id: input.party_id,
            p_party_name: input.party_name,
            p_transporter_name: input.transporter_name ?? null,
            p_items: input.items.map(i => ({
                job_work_type_name: i.job_work_type_name,
                quantity: i.quantity,
                manual_wo_number: i.manual_wo_number ?? null,
            })),
        }
    );

    if (error) throw error;
    return data; // returns dc_id
}

export async function deleteDeliveryChallanWithEffects(dcId: string) {
    const { data, error } = await supabase.rpc(
        "delete_delivery_challan_with_effects",
        {
            p_dc_id: dcId,
        }
    );

    if (error) throw error;
    return data;
}

