export interface Party {
  id: string;
  name: string;
  created_at: string;
}

export interface JobWorkType {
  id: string;
  name: string;
  active: boolean;
}

export interface WorkOrderItem {
  id: string;
  work_order_id: string;
  job_work_type_id: string;
  job_work_type_name: string;
  quantity: number;
  pending_quantity: number;
}

export type WorkOrderStatus = "Not Yet Started" | "In Progress" | "Completed";

export interface WorkOrder {
  id: string;
  work_order_number: string;
  received_date: string;
  party_id: string;
  party_name: string;
  items: WorkOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface DeliveryChallan {
  id: string;
  dc_number: string;
  generated_date: string;
  party_id: string;
  party_name: string;
  party_gstin?: string | null;
  transporter_name: string | null;
  items: DCItem[];
  linked_work_order_ids: string[] | null;
  created_at?: string;
}

export interface DCItem {
  id: string;
  delivery_challan_id?: string;
  work_order_item_id: string;
  job_work_type_name: string;
  quantity: number;
  invoiced_quantity?: number;
  remaining_billable_quantity?: number;
}

export type InvoiceGSTType = "cgst_sgst" | "igst" | "none";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  dc_item_id: string;
  work_order_id: string;
  wo_number: string;
  dc_number: string;
  particulars: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  party_id: string;
  party_name: string;
  party_gstin?: string | null;
  gst_type: InvoiceGSTType;
  cgst_percent: number;
  sgst_percent: number;
  igst_percent: number;
  subtotal: number;
  tax_amount: number;
  grand_total: number;
  created_at?: string;
  items?: InvoiceItem[];
}

// Derived helpers
export function getWorkOrderTotals(wo: WorkOrder) {
  const total_quantity = wo.items.reduce((s, i) => s + i.quantity, 0);
  const total_pending = wo.items.reduce((s, i) => s + i.pending_quantity, 0);
  return { total_quantity, total_pending };
}

export function getWorkOrderStatus(wo: WorkOrder): WorkOrderStatus {
  const { total_quantity, total_pending } = getWorkOrderTotals(wo);
  if (total_pending === 0) return "Completed";
  if (total_pending < total_quantity) return "In Progress";
  return "Not Yet Started";
}
