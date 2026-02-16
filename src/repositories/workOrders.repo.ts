import { supabase } from "@/integrations/supabase/client";
import type { WorkOrder, WorkOrderItem } from "@/types";

export async function createWorkOrder(
    workOrder: Omit<WorkOrder, "id" | "created_at" | "updated_at">
) {
    const { error, data } = await supabase.rpc(
        "create_work_order_with_items",
        {
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