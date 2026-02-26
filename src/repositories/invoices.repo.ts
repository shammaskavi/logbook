

import { supabase } from "@/integrations/supabase/client";

export interface BillableDCItem {
    dc_item_id: string;
    work_order_id: string;
    wo_number: string;
    dc_id: string;
    dc_number: string;
    job_work_type_name: string;
    delivered_qty: number;
    invoiced_qty: number;
    remaining_qty: number;
}

export interface CreateInvoiceItemPayload {
    dc_item_id: string;
    work_order_id: string;
    wo_number: string;
    dc_number: string;
    particulars: string;
    quantity: number;
    rate: number;
}

export interface CreateInvoicePayload {
    invoice_number: string;
    invoice_date: string;
    party_id: string;
    party_name: string;
    party_gstin: string | null;
    gst_type: "cgst_sgst" | "igst" | "none";
    cgst_percent: number;
    sgst_percent: number;
    igst_percent: number;
    items: CreateInvoiceItemPayload[];
}

export const invoicesRepo = {
    async getBillableDCItems(partyId: string): Promise<BillableDCItem[]> {
        const { data, error } = await supabase.rpc(
            "get_billable_dc_items",
            { p_party_id: partyId }
        );

        if (error) throw error;

        return (data ?? []) as BillableDCItem[];
    },

    async createInvoice(payload: CreateInvoicePayload): Promise<string> {
        const { data, error } = await supabase.rpc(
            "create_invoice_with_effects",
            {
                p_invoice_number: payload.invoice_number,
                p_invoice_date: payload.invoice_date,
                p_party_id: payload.party_id,
                p_party_name: payload.party_name,
                p_party_gstin: payload.party_gstin,
                p_gst_type: payload.gst_type,
                p_cgst_percent: payload.cgst_percent,
                p_sgst_percent: payload.sgst_percent,
                p_igst_percent: payload.igst_percent,
                p_items: payload.items,
            }
        );

        if (error) throw error;

        return data as string;
    },

    async getInvoices() {
        const { data, error } = await supabase
            .from("invoices")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return data ?? [];
    },

    async getInvoiceById(invoiceId: string) {
        const { data: invoice, error: invoiceError } = await supabase
            .from("invoices")
            .select("*")
            .eq("id", invoiceId)
            .single();

        if (invoiceError) throw invoiceError;

        const { data: items, error: itemsError } = await (supabase as any)
            .from("invoice_items")
            .select("*")
            .eq("invoice_id", invoiceId);

        if (itemsError) throw itemsError;

        return {
            ...invoice,
            items: items ?? [],
        };
    },
};