import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createWorkOrder, updateWorkOrder, deleteWorkOrderWithEffects } from "@/repositories/workOrders.repo";
import {
  createDeliveryChallanWithEffects,
  deleteDeliveryChallanWithEffects,
} from "@/repositories/deliveryChallans.repo";
import { invoicesRepo, BillableDCItem, CreateInvoicePayload } from "@/repositories/invoices.repo";
import {
  Party,
  JobWorkType,
  WorkOrder,
  WorkOrderItem,
  DeliveryChallan,
  DCItem,
} from "@/types";

import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

export interface BusinessSettings {
  organization_id: string;

  business_name: string;
  business_address: string | null;
  gstin: string | null;
  pan: string | null;
  phone: string | null;
  email: string | null;

  bank_name: string | null;
  bank_branch: string | null;
  account_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;

  work_order_prefix: string;
  dc_prefix: string;
  invoice_prefix: string;

  created_at?: string;
  updated_at?: string;
}

// ── Parties ──
export function useParties() {
  const { organizationId, isLoading: organizationLoading } =
    useCurrentOrganization();

  return useQuery({
    queryKey: ["parties", organizationId],
    enabled: !organizationLoading && !!organizationId,
    queryFn: async (): Promise<Party[]> => {
      const { data, error } = await supabase
        .from("parties")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("name");

      if (error) throw error;

      return data.map((p) => ({
        id: p.id,
        name: p.name,
        phone_number: p.phone_number,
        gstin: p.gstin,
        created_at: p.created_at,
      }));
    },
  });
}

export function useAddParty() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      phone_number?: string | null;
      gstin?: string | null;
    }): Promise<Party> => {
      if (!organizationId) {
        throw new Error("No organization found for the current user.");
      }

      const { data, error } = await supabase
        .from("parties")
        .insert({
          name: payload.name.trim(),
          phone_number: payload.phone_number || null,
          gstin: payload.gstin || null,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        phone_number: data.phone_number,
        gstin: data.gstin,
        created_at: data.created_at,
      } as Party;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["parties", organizationId],
      });
    },
  });
}

// ── Job Work Types ──
export function useJobWorkTypes() {
  const { organizationId, isLoading: organizationLoading } =
    useCurrentOrganization();

  return useQuery({
    queryKey: ["job_work_types", organizationId],
    enabled: !organizationLoading && !!organizationId,
    queryFn: async (): Promise<JobWorkType[]> => {
      const { data, error } = await supabase
        .from("job_work_types")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("name");

      if (error) throw error;

      return data.map((j) => ({
        id: j.id,
        name: j.name,
        active: j.active,
      }));
    },
  });
}

// ── Work Orders ──
export function useWorkOrders() {
  const { organizationId, isLoading: organizationLoading } =
    useCurrentOrganization();

  return useQuery({
    queryKey: ["work_orders", organizationId],
    enabled: !organizationLoading && !!organizationId,
    queryFn: async (): Promise<WorkOrder[]> => {
      const { data: orders, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("received_date", { ascending: false });

      if (error) throw error;

      const { data: items, error: itemsErr } = await supabase
        .from("work_order_items")
        .select("*")
        .eq("organization_id", organizationId!);

      if (itemsErr) throw itemsErr;

      return orders.map((o) => ({
        id: o.id,
        work_order_number: o.work_order_number,
        received_date: o.received_date,
        party_id: o.party_id,
        party_name: o.party_name,
        items: items
          .filter((i) => i.work_order_id === o.id)
          .map((i) => ({
            id: i.id,
            work_order_id: i.work_order_id,
            job_work_type_id: i.job_work_type_id,
            job_work_type_name: i.job_work_type_name,
            quantity: i.quantity,
            pending_quantity: i.pending_quantity,
          })),
        created_at: o.created_at,
        updated_at: o.updated_at,
      }));
    },
  });
}

export function useAddWorkOrder() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (payload: any) => {
      if (!organizationId) {
        throw new Error("No organization found for the current user.");
      }

      return createWorkOrder(payload, organizationId);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["work_orders", organizationId],
      });
    },
  });
}

export function useUpdateWorkOrder() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: updateWorkOrder,
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["work_orders", organizationId],
      });
    },
  });
}

export function useDeleteWorkOrder() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: (id: string) => deleteWorkOrderWithEffects(id),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["work_orders", organizationId],
      });
      qc.invalidateQueries({
        queryKey: ["delivery_challans", organizationId],
      });
      qc.invalidateQueries({
        queryKey: ["invoices", organizationId],
      });
    },
  });
}

export function useDeleteWorkOrders() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await deleteWorkOrderWithEffects(id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["work_orders", organizationId],
      });
      qc.invalidateQueries({
        queryKey: ["delivery_challans", organizationId],
      });
      qc.invalidateQueries({
        queryKey: ["invoices", organizationId],
      });
    },
  });
}

// ── Delivery Challans ──
export function useDeliveryChallans() {
  const { organizationId, isLoading: organizationLoading } =
    useCurrentOrganization();

  return useQuery({
    queryKey: ["delivery_challans", organizationId],
    enabled: !organizationLoading && !!organizationId,
    queryFn: async (): Promise<DeliveryChallan[]> => {
      const { data: dcs, error } = await supabase
        .from("delivery_challans")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("generated_date", { ascending: false });

      if (error) throw error;

      const { data: items, error: itemsErr } = await supabase
        .from("dc_items")
        .select("*")
        .eq("organization_id", organizationId!);

      if (itemsErr) throw itemsErr;

      return dcs.map((dc) => ({
        id: dc.id,
        dc_number: dc.dc_number,
        generated_date: dc.generated_date,
        party_id: dc.party_id,
        party_name: dc.party_name,
        party_gstin: dc.party_gstin,
        transporter_name: dc.transporter_name,
        items: items
          .filter((i) => i.delivery_challan_id === dc.id)
          .map((i) => ({
            id: i.id,
            work_order_item_id: i.work_order_item_id,
            job_work_type_name: i.job_work_type_name,
            quantity: i.quantity,
            invoiced_quantity: i.invoiced_quantity ?? 0,
            remaining_billable_quantity:
              i.quantity - (i.invoiced_quantity ?? 0),
          })),
        linked_work_order_ids: dc.linked_work_order_ids || [],
      }));
    },
  });
}

export function useAddDeliveryChallan() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (payload: any) => {
      if (!organizationId) {
        throw new Error("No organization found for the current user.");
      }

      return createDeliveryChallanWithEffects(payload, organizationId);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["delivery_challans", organizationId],
      });
      qc.invalidateQueries({
        queryKey: ["work_orders", organizationId],
      });
    },
  });
}

export function useUpdateDeliveryChallan() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();
  return useMutation({
    mutationFn: async (dc: { id: string; dc_number: string; generated_date: string; party_id: string; party_name: string; transporter_name: string; items: Omit<DCItem, "id">[]; linked_work_order_ids: string[] }) => {
      const { error } = await supabase
        .from("delivery_challans")
        .update({
          dc_number: dc.dc_number,
          generated_date: dc.generated_date,
          party_id: dc.party_id,
          party_name: dc.party_name,
          transporter_name: dc.transporter_name,
          linked_work_order_ids: dc.linked_work_order_ids,
        })
        .eq("id", dc.id);
      if (error) throw error;

      await supabase.from("dc_items").delete().eq("delivery_challan_id", dc.id);
      const itemRows = dc.items.map(i => ({
        delivery_challan_id: dc.id,
        job_work_type_name: i.job_work_type_name,
        quantity: i.quantity,
      }));
      const { error: itemsErr } = await supabase.from("dc_items").insert(itemRows);
      if (itemsErr) throw itemsErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery_challans", organizationId] });
    },
  });
}

export function useDeleteDeliveryChallan() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: (id: string) =>
      deleteDeliveryChallanWithEffects(id),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["delivery_challans", organizationId],
      });
      qc.invalidateQueries({
        queryKey: ["work_orders", organizationId],
      });
      qc.invalidateQueries({
        queryKey: ["invoices", organizationId],
      });
      qc.invalidateQueries({
        queryKey: ["dashboard", organizationId],
      });
    },
  });
}

export function useDeleteDeliveryChallans() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await deleteDeliveryChallanWithEffects(id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["delivery_challans", organizationId],
      });
      qc.invalidateQueries({
        queryKey: ["work_orders", organizationId],
      });
      qc.invalidateQueries({
        queryKey: ["invoices", organizationId],
      });
      qc.invalidateQueries({
        queryKey: ["dashboard", organizationId],
      });
    },
  });
}

// ── Invoices ──

export function useBillableDCItems(partyId?: string) {
  const { organizationId, isLoading: organizationLoading } =
    useCurrentOrganization();

  return useQuery({
    queryKey: ["billable_dc_items", organizationId, partyId],
    enabled:
      !organizationLoading &&
      !!organizationId &&
      !!partyId,
    queryFn: async (): Promise<BillableDCItem[]> => {
      if (!partyId || !organizationId) return [];

      return invoicesRepo.getBillableDCItems(
        partyId,
        organizationId
      );
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (payload: CreateInvoicePayload) => {
      if (!organizationId) {
        throw new Error("No organization found for the current user.");
      }

      return invoicesRepo.createInvoice(
        payload,
        organizationId
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["invoices", organizationId],
      });
      qc.invalidateQueries({
        queryKey: ["billable_dc_items", organizationId],
      });
      qc.invalidateQueries({
        queryKey: ["delivery_challans", organizationId],
      });
    },
  });
}

export function useInvoices() {
  const { organizationId, isLoading: organizationLoading } =
    useCurrentOrganization();

  return useQuery({
    queryKey: ["invoices", organizationId],
    enabled: !organizationLoading && !!organizationId,
    queryFn: async () => {
      if (!organizationId) return [];

      const invoices = await invoicesRepo.getInvoices(
        organizationId
      );

      return invoices.map((inv: any) => ({
        ...inv,
        items:
          inv.items ||
          inv.invoice_items ||
          inv.invoiceItems ||
          [],
      }));
    },
  });
}

export function useInvoice(invoiceId?: string) {
  const { organizationId, isLoading: organizationLoading } =
    useCurrentOrganization();

  return useQuery({
    queryKey: ["invoice", organizationId, invoiceId],
    enabled:
      !organizationLoading &&
      !!organizationId &&
      !!invoiceId,
    queryFn: async () => {
      if (!invoiceId || !organizationId) {
        throw new Error("Invoice ID required");
      }

      const invoice = await invoicesRepo.getInvoiceById(
        invoiceId,
        organizationId
      );

      return {
        ...invoice,
        items:
          invoice.items ||
          invoice.invoice_items ||
          invoice.invoiceItems ||
          [],
      };
    },
  });
}

// ── Business Settings ──

export function useBusinessSettings() {
  const { organizationId, isLoading: organizationLoading } =
    useCurrentOrganization();

  return useQuery({
    queryKey: ["business_settings", organizationId],
    enabled: !organizationLoading && !!organizationId,
    queryFn: async (): Promise<BusinessSettings> => {
      const { data, error } = await supabase
        .from("business_settings")
        .select("*")
        .eq("organization_id", organizationId!)
        .single();

      if (error) {
        throw error;
      }

      return data as BusinessSettings;
    },
  });
}

export function useUpdateBusinessSettings() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (
      values: Partial<BusinessSettings>
    ): Promise<BusinessSettings> => {
      if (!organizationId) {
        throw new Error("No organization found for the current user.");
      }

      const { data, error } = await supabase
        .from("business_settings")
        .update(values)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as BusinessSettings;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["business_settings", organizationId],
      });
    },
  });
}
