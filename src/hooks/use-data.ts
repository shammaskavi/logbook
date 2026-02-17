import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createWorkOrder, updateWorkOrder, deleteWorkOrderWithEffects } from "@/repositories/workOrders.repo";
import { createDeliveryChallanWithEffects } from "@/repositories/deliveryChallans.repo";
import { Party, JobWorkType, WorkOrder, WorkOrderItem, DeliveryChallan, DCItem } from "@/types";

// ── Parties ──
export function useParties() {
  return useQuery({
    queryKey: ["parties"],
    queryFn: async (): Promise<Party[]> => {
      const { data, error } = await supabase.from("parties").select("*").order("name");
      if (error) throw error;
      return data.map(p => ({ id: p.id, name: p.name, created_at: p.created_at }));
    },
  });
}

export function useAddParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<Party> => {
      const { data, error } = await supabase.from("parties").insert({ name }).select().single();
      if (error) throw error;
      return { id: data.id, name: data.name, created_at: data.created_at };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parties"] }),
  });
}

// ── Job Work Types ──
export function useJobWorkTypes() {
  return useQuery({
    queryKey: ["job_work_types"],
    queryFn: async (): Promise<JobWorkType[]> => {
      const { data, error } = await supabase.from("job_work_types").select("*").order("name");
      if (error) throw error;
      return data.map(j => ({ id: j.id, name: j.name, active: j.active }));
    },
  });
}

// ── Work Orders ──
export function useWorkOrders() {
  return useQuery({
    queryKey: ["work_orders"],
    queryFn: async (): Promise<WorkOrder[]> => {
      const { data: orders, error } = await supabase
        .from("work_orders")
        .select("*")
        .order("received_date", { ascending: false });
      if (error) throw error;

      const { data: items, error: itemsErr } = await supabase.from("work_order_items").select("*");
      if (itemsErr) throw itemsErr;

      return orders.map(o => ({
        id: o.id,
        work_order_number: o.work_order_number,
        received_date: o.received_date,
        party_id: o.party_id,
        party_name: o.party_name,
        items: items
          .filter(i => i.work_order_id === o.id)
          .map(i => ({
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

  return useMutation({
    mutationFn: createWorkOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work_orders"] });
    },
  });
}

export function useUpdateWorkOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateWorkOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work_orders"] });
    },
  });
}

export function useDeleteWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWorkOrderWithEffects(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work_orders"] });
      qc.invalidateQueries({ queryKey: ["delivery_challans"] });
    },
  });
}

export function useDeleteWorkOrders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await deleteWorkOrderWithEffects(id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work_orders"] });
      qc.invalidateQueries({ queryKey: ["delivery_challans"] });
    },
  });
}

// ── Delivery Challans ──
export function useDeliveryChallans() {
  return useQuery({
    queryKey: ["delivery_challans"],
    queryFn: async (): Promise<DeliveryChallan[]> => {
      const { data: dcs, error } = await supabase
        .from("delivery_challans")
        .select("*")
        .order("generated_date", { ascending: false });
      if (error) throw error;

      const { data: items, error: itemsErr } = await supabase.from("dc_items").select("*");
      if (itemsErr) throw itemsErr;

      return dcs.map(dc => ({
        id: dc.id,
        dc_number: dc.dc_number,
        generated_date: dc.generated_date,
        party_id: dc.party_id,
        party_name: dc.party_name,
        party_gstin: dc.party_gstin,
        transporter_name: dc.transporter_name,
        items: items
          .filter(i => i.delivery_challan_id === dc.id)
          .map(i => ({
            id: i.id,
            work_order_item_id: i.work_order_item_id,
            job_work_type_name: i.job_work_type_name,
            quantity: i.quantity,
          })),
        linked_work_order_ids: dc.linked_work_order_ids || [],
      }));
    },
  });
}

export function useAddDeliveryChallan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createDeliveryChallanWithEffects,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery_challans"] });
      qc.invalidateQueries({ queryKey: ["work_orders"] });
    },
  });
}

export function useUpdateDeliveryChallan() {
  const qc = useQueryClient();
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery_challans"] }),
  });
}

export function useDeleteDeliveryChallan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delivery_challans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery_challans"] }),
  });
}

export function useDeleteDeliveryChallans() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("delivery_challans").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery_challans"] }),
  });
}
