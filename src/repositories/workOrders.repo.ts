import { supabase } from "@/integrations/supabase/client";
import type { WorkOrder, WorkOrderItem } from "@/types";

export async function createWorkOrder(
  workOrder: Omit<WorkOrder, "id" | "created_at" | "updated_at">,
  organizationId: string
) {
  const { error, data } = await supabase.rpc(
    "create_work_order_with_items",
    {
      p_organization_id: organizationId,
      p_work_order_number: workOrder.work_order_number,
      p_received_date: workOrder.received_date,
      p_party_id: workOrder.party_id,
      p_party_name: workOrder.party_name,
      p_items: workOrder.items.map((item: WorkOrderItem) => ({
        job_work_type_id: item.job_work_type_id,
        job_work_type_name: item.job_work_type_name,
        quantity: item.quantity,
        pending_quantity: item.pending_quantity,
      })),
    }
  );

  if (error) throw error;
  return data;
}

export async function updateWorkOrder(
  workOrder: Pick<
    WorkOrder,
    "id" | "work_order_number" | "received_date" | "party_id" | "party_name" | "items"
  >
) {
  const { error } = await supabase.rpc(
    "update_work_order_with_items",
    {
      p_work_order_id: workOrder.id,
      p_work_order_number: workOrder.work_order_number,
      p_received_date: workOrder.received_date,
      p_party_id: workOrder.party_id,
      p_party_name: workOrder.party_name,
      p_items: workOrder.items.map((item: WorkOrderItem) => ({
        job_work_type_id: item.job_work_type_id,
        job_work_type_name: item.job_work_type_name,
        quantity: item.quantity,
        pending_quantity: item.pending_quantity,
      })),
    }
  );

  if (error) throw error;
}

export async function deleteWorkOrderWithEffects(workOrderId: string) {
  const { error } = await supabase.rpc(
    "delete_work_order_with_effects",
    {
      p_work_order_id: workOrderId,
    }
  );

  if (!error) return;

  // Translate DB foreign key errors into business-friendly message
  if (
    error.message?.includes("invoice_items_dc_item_id_fkey") ||
    error.message?.includes("violates foreign key constraint")
  ) {
    throw new Error(
      "Cannot delete this work order because invoices have already been generated for it."
    );
  }

  throw new Error("Failed to delete work order.");
}