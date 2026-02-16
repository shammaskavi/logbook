import { Party, JobWorkType, WorkOrder, DeliveryChallan } from "@/types";

const PARTIES_KEY = "wo_parties";
const JOB_TYPES_KEY = "wo_job_types";
const WORK_ORDERS_KEY = "wo_work_orders";
const DCS_KEY = "wo_dcs";

function get<T>(key: string, fallback: T): T {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Parties
export function getParties(): Party[] {
  return get<Party[]>(PARTIES_KEY, defaultParties);
}
export function saveParties(p: Party[]) { set(PARTIES_KEY, p); }
export function addParty(name: string): Party {
  const parties = getParties();
  const p: Party = { id: crypto.randomUUID(), name, created_at: new Date().toISOString() };
  parties.push(p);
  saveParties(parties);
  return p;
}

// Job Work Types
export function getJobWorkTypes(): JobWorkType[] {
  return get<JobWorkType[]>(JOB_TYPES_KEY, defaultJobTypes);
}
export function saveJobWorkTypes(j: JobWorkType[]) { set(JOB_TYPES_KEY, j); }
export function addJobWorkType(name: string): JobWorkType {
  const types = getJobWorkTypes();
  const j: JobWorkType = { id: crypto.randomUUID(), name, active: true };
  types.push(j);
  saveJobWorkTypes(types);
  return j;
}

// Work Orders
export function getWorkOrders(): WorkOrder[] {
  return get<WorkOrder[]>(WORK_ORDERS_KEY, defaultWorkOrders);
}
export function saveWorkOrders(w: WorkOrder[]) { set(WORK_ORDERS_KEY, w); }
export function addWorkOrder(wo: WorkOrder) {
  const orders = getWorkOrders();
  orders.unshift(wo);
  saveWorkOrders(orders);
}
export function updateWorkOrder(wo: WorkOrder) {
  const orders = getWorkOrders().map(o => o.id === wo.id ? wo : o);
  saveWorkOrders(orders);
}
export function deleteWorkOrder(id: string) {
  saveWorkOrders(getWorkOrders().filter(o => o.id !== id));
}
export function deleteWorkOrders(ids: string[]) {
  saveWorkOrders(getWorkOrders().filter(o => !ids.includes(o.id)));
}

// Delivery Challans
export function getDeliveryChallans(): DeliveryChallan[] {
  return get<DeliveryChallan[]>(DCS_KEY, defaultDCs);
}
export function saveDeliveryChallans(d: DeliveryChallan[]) { set(DCS_KEY, d); }
export function addDeliveryChallan(dc: DeliveryChallan) {
  const dcs = getDeliveryChallans();
  dcs.unshift(dc);
  saveDeliveryChallans(dcs);
}
export function updateDeliveryChallan(dc: DeliveryChallan) {
  const dcs = getDeliveryChallans().map(d => d.id === dc.id ? dc : d);
  saveDeliveryChallans(dcs);
}
export function deleteDeliveryChallan(id: string) {
  saveDeliveryChallans(getDeliveryChallans().filter(d => d.id !== id));
}
export function deleteDeliveryChallans(ids: string[]) {
  saveDeliveryChallans(getDeliveryChallans().filter(d => !ids.includes(d.id)));
}

// Seed data
const defaultParties: Party[] = [
  { id: "p1", name: "Pati Saare Mandir", created_at: "2020-01-01" },
  { id: "p2", name: "Roja Silks", created_at: "2020-01-01" },
  { id: "p3", name: "Rathi International", created_at: "2020-01-01" },
];

const defaultJobTypes: JobWorkType[] = [
  { id: "j1", name: "Handloom", active: true },
  { id: "j2", name: "Polish", active: true },
  { id: "j3", name: "Lattan", active: true },
  { id: "j4", name: "Folding", active: true },
  { id: "j5", name: "Faal", active: true },
  { id: "j6", name: "Latkan", active: true },
];

const defaultWorkOrders: WorkOrder[] = [
  {
    id: "wo1", work_order_number: "0135", received_date: "2020-12-01",
    party_id: "p1", party_name: "Pati Saare Mandir",
    items: [
      { id: "i1", work_order_id: "wo1", job_work_type_id: "j1", job_work_type_name: "Handloom", quantity: 3, pending_quantity: 0 },
      { id: "i2", work_order_id: "wo1", job_work_type_id: "j2", job_work_type_name: "Polish", quantity: 3, pending_quantity: 0 },
      { id: "i3", work_order_id: "wo1", job_work_type_id: "j3", job_work_type_name: "Lattan", quantity: 2, pending_quantity: 0 },
      { id: "i4", work_order_id: "wo1", job_work_type_id: "j4", job_work_type_name: "Folding", quantity: 2, pending_quantity: 0 },
    ],
    created_at: "2020-12-01", updated_at: "2020-12-01",
  },
  {
    id: "wo2", work_order_number: "0134", received_date: "2020-11-30",
    party_id: "p1", party_name: "Pati Saare Mandir",
    items: [
      { id: "i5", work_order_id: "wo2", job_work_type_id: "j1", job_work_type_name: "Handloom", quantity: 8, pending_quantity: 4 },
      { id: "i6", work_order_id: "wo2", job_work_type_id: "j5", job_work_type_name: "Faal", quantity: 6, pending_quantity: 3 },
      { id: "i7", work_order_id: "wo2", job_work_type_id: "j6", job_work_type_name: "Latkan", quantity: 6, pending_quantity: 3 },
    ],
    created_at: "2020-11-30", updated_at: "2020-11-30",
  },
  {
    id: "wo3", work_order_number: "2424", received_date: "2020-11-29",
    party_id: "p2", party_name: "Roja Silks",
    items: [
      { id: "i8", work_order_id: "wo3", job_work_type_id: "j1", job_work_type_name: "Handloom", quantity: 3, pending_quantity: 0 },
      { id: "i9", work_order_id: "wo3", job_work_type_id: "j5", job_work_type_name: "Faal", quantity: 4, pending_quantity: 4 },
      { id: "i10", work_order_id: "wo3", job_work_type_id: "j6", job_work_type_name: "Latkan", quantity: 3, pending_quantity: 1 },
    ],
    created_at: "2020-11-29", updated_at: "2020-11-29",
  },
  {
    id: "wo4", work_order_number: "3385", received_date: "2020-11-28",
    party_id: "p3", party_name: "Rathi International",
    items: [
      { id: "i11", work_order_id: "wo4", job_work_type_id: "j1", job_work_type_name: "Handloom", quantity: 10, pending_quantity: 0 },
      { id: "i12", work_order_id: "wo4", job_work_type_id: "j2", job_work_type_name: "Polish", quantity: 10, pending_quantity: 0 },
      { id: "i13", work_order_id: "wo4", job_work_type_id: "j3", job_work_type_name: "Lattan", quantity: 10, pending_quantity: 0 },
      { id: "i14", work_order_id: "wo4", job_work_type_id: "j4", job_work_type_name: "Folding", quantity: 10, pending_quantity: 0 },
      { id: "i15", work_order_id: "wo4", job_work_type_id: "j5", job_work_type_name: "Faal", quantity: 10, pending_quantity: 0 },
    ],
    created_at: "2020-11-28", updated_at: "2020-11-28",
  },
  {
    id: "wo5", work_order_number: "2423", received_date: "2020-11-28",
    party_id: "p2", party_name: "Roja Silks",
    items: [
      { id: "i16", work_order_id: "wo5", job_work_type_id: "j1", job_work_type_name: "Handloom", quantity: 2, pending_quantity: 2 },
      { id: "i17", work_order_id: "wo5", job_work_type_id: "j2", job_work_type_name: "Polish", quantity: 2, pending_quantity: 2 },
      { id: "i18", work_order_id: "wo5", job_work_type_id: "j3", job_work_type_name: "Lattan", quantity: 2, pending_quantity: 2 },
      { id: "i19", work_order_id: "wo5", job_work_type_id: "j4", job_work_type_name: "Folding", quantity: 2, pending_quantity: 2 },
      { id: "i20", work_order_id: "wo5", job_work_type_id: "j5", job_work_type_name: "Faal", quantity: 1, pending_quantity: 1 },
      { id: "i21", work_order_id: "wo5", job_work_type_id: "j6", job_work_type_name: "Latkan", quantity: 1, pending_quantity: 1 },
    ],
    created_at: "2020-11-28", updated_at: "2020-11-28",
  },
  {
    id: "wo6", work_order_number: "2422", received_date: "2020-11-27",
    party_id: "p2", party_name: "Roja Silks",
    items: [
      { id: "i22", work_order_id: "wo6", job_work_type_id: "j1", job_work_type_name: "Handloom", quantity: 15, pending_quantity: 5 },
      { id: "i23", work_order_id: "wo6", job_work_type_id: "j2", job_work_type_name: "Polish", quantity: 15, pending_quantity: 5 },
    ],
    created_at: "2020-11-27", updated_at: "2020-11-27",
  },
  {
    id: "wo7", work_order_number: "3384", received_date: "2020-11-27",
    party_id: "p3", party_name: "Rathi International",
    items: [
      { id: "i24", work_order_id: "wo7", job_work_type_id: "j1", job_work_type_name: "Handloom", quantity: 10, pending_quantity: 10 },
    ],
    created_at: "2020-11-27", updated_at: "2020-11-27",
  },
];

const defaultDCs: DeliveryChallan[] = [
  {
    id: "dc1", dc_number: "0134", generated_date: "2020-11-30",
    party_id: "p1", party_name: "Pati Saare Mandir", transporter_name: "Saleem Bhai",
    items: [
      { id: "di1", job_work_type_name: "Handloom", quantity: 4 },
      { id: "di2", job_work_type_name: "Faal", quantity: 3 },
      { id: "di3", job_work_type_name: "Latkan", quantity: 3 },
    ],
    linked_work_order_ids: ["wo2"],
  },
  {
    id: "dc2", dc_number: "2424", generated_date: "2020-11-29",
    party_id: "p2", party_name: "Roja Silks", transporter_name: "Ahmed Bhai",
    items: [
      { id: "di4", job_work_type_name: "Handloom", quantity: 3 },
      { id: "di5", job_work_type_name: "Latkan", quantity: 2 },
    ],
    linked_work_order_ids: ["wo3"],
  },
  {
    id: "dc3", dc_number: "2422", generated_date: "2020-11-27",
    party_id: "p2", party_name: "Roja Silks", transporter_name: "Maqbool Miya",
    items: [
      { id: "di6", job_work_type_name: "Handloom", quantity: 10 },
      { id: "di7", job_work_type_name: "Polish", quantity: 10 },
    ],
    linked_work_order_ids: ["wo6"],
  },
];
