# Database findings — 14 Aug 2026

Read from the live function definitions now snapshotted in
[`supabase/schema/functions.sql`](../supabase/schema/functions.sql). Nothing
here has been changed in the database; this is a record of what is deployed.

Severity is about risk to correctness and to customer data, not effort.

---

## 1. Editing a work order is broken, and possibly destructive — HIGH

`update_work_order_with_items` does this:

```sql
delete from public.work_order_items where work_order_id = p_work_order_id;

insert into public.work_order_items (
  work_order_id, job_work_type_id, job_work_type_name, quantity, pending_quantity
) select ...
```

Two problems.

**It omits `organization_id`.** That column is `NOT NULL` on `work_order_items`.
Unless the column has a default, every work order edit fails outright. This is
consistent with the "Edit Work Order" menu item being commented out in
`WorkOrderList.tsx` — the feature appears to have been disabled rather than
fixed.

**It deletes and recreates the item rows with new ids.** `dc_items.work_order_item_id`
points at those rows, and the constraint is:

```
dc_items_work_order_item_fk
  FOREIGN KEY (work_order_item_id) REFERENCES work_order_items(id) ON DELETE CASCADE
```

So the `delete` inside this function **cascades straight into `dc_items`**,
wiping the delivery challan lines for that work order.

### ⚠ The two bugs are currently cancelling each other out

The function body runs in a single transaction:

1. `update work_orders` — succeeds
2. `delete work_order_items` — succeeds, **cascades away `dc_items`**
3. `insert work_order_items` without `organization_id` — fails on `NOT NULL`
4. transaction rolls back, undoing step 2

The missing `organization_id` is the only thing preventing step 2 from
destroying challan data. **Do not fix the `organization_id` omission on its
own** — that alone would turn a loud failure into silent data loss. The
delete-and-recreate has to be replaced at the same time.

This holds only if `work_order_items.organization_id` has no column default.
Confirm with query 5 of `scripts/schema-export.sql` before touching this
function.

**Fix direction:** update items in place — match on existing id, update changed
rows, insert genuinely new ones, and refuse to delete any item that a `dc_items`
row references. Preserve `pending_quantity` relative to what has already been
delivered rather than overwriting it from the client.

---

## 2. Deleting a work order can corrupt other work orders — HIGH

`delete_work_order_with_effects` collects every challan touching this work
order and deletes those challans whole:

```sql
select array_agg(distinct dc.delivery_challan_id) into v_dc_ids
from public.dc_items dc
join public.work_order_items woi on dc.work_order_item_id = woi.id
where woi.work_order_id = p_work_order_id;

delete from public.delivery_challans where id = any(v_dc_ids);
```

A challan can carry items from several work orders — the DC form lets you pick
pending items across all of a party's work orders. So deleting work order A
deletes an entire challan that may also contain work order B's items, and
B's `pending_quantity` is **never restored**, because the restore logic lives in
`delete_delivery_challan_with_effects`, which this function does not call.

The result is silent, permanent drift: B shows less pending quantity than it
actually has, and the goods on that challan are unbilled with no record.

It also bypasses the invoiced-challan guard in
`delete_delivery_challan_with_effects`. In practice the `invoice_items.dc_item_id`
foreign key will still block the delete with a raw error, which the frontend
translates to a friendly message — so the guard is effectively there by accident.

**Fix direction:** delete challans through
`delete_delivery_challan_with_effects` so quantities are restored and the
invoice guard applies, or restrict deletion to challans that only reference the
work order being deleted.

---

## 3. Legacy pre-multi-tenant functions still deployed — HIGH, pending confirmation

Three functions exist in two versions. The app calls the newer,
organization-scoped ones; the originals were never dropped:

| Function | Legacy signature | Problem |
|---|---|---|
| `create_work_order_with_items` | 5 args, no `p_organization_id` | Inserts rows with no `organization_id` |
| `create_delivery_challan_with_effects` | 6 args, no `p_organization_id` | Same |
| `get_billable_dc_items` | 1 arg (`p_party_id`) | **No organization filter of any kind** |

The last one is the concerning one. It reads across every organization's data
and returns whatever matches the party id. Supabase exposes public functions
over PostgREST, so any authenticated user can call it directly.

**Whether this is exploitable depends entirely on the RLS policies.** These
functions are `SECURITY INVOKER` (the default), so they run with the caller's
privileges and row level security still applies. If the policies scope rows by
organization membership, nothing leaks. If they are still the original
`USING (true)` policies from the first migration — which is what
`supabase/migrations/20260212134912_*.sql` created, before multi-tenancy
existed — then this returns other customers' data.

**This needs confirming before anything else.** Run query 2 of
`scripts/schema-export.sql`.

**Fix direction:** `DROP FUNCTION` all three legacy overloads regardless — the
app does not use them, and dropping a specific overload does not affect the
current one.

---

## 4. Free-form delivery challans need schema changes — blocks the feature

Two hard blockers, both confirmed:

**Creation fails.** `create_delivery_challan_with_effects` looks up every item's
`work_order_item_id` and raises `'Work order item not found'` when it does not
resolve. An item with no work order behind it cannot be created through it.

**Invoicing silently drops them.** `get_billable_dc_items` reaches the work
order through inner joins:

```sql
join public.work_order_items woi on woi.id = dci.work_order_item_id
join public.work_orders wo on wo.id = woi.work_order_id
```

A `dc_item` with a null `work_order_item_id` matches neither and disappears from
the result. The challan would save fine, look correct, print correctly — and
then never appear on the invoice screen, with no error anywhere. This is the
worst kind of failure: invisible.

**Fix direction:**

1. Additive migration: `delivery_challans.manual_wo_number text` (nullable), to
   hold the typed-in work order number.
2. New `create_manual_delivery_challan(...)` RPC that inserts the challan and
   its items with `work_order_item_id = null` and touches no pending quantity.
   Adding a new function leaves the existing one untouched, so the current
   flow carries no risk.
3. Change the inner joins in `get_billable_dc_items` to `left join`, and select
   `coalesce(wo.work_order_number, dc.manual_wo_number)` as `wo_number`.
   `invoice_items.work_order_id` is already nullable, so free-form lines store
   cleanly.

`delete_delivery_challan_with_effects` needs no change — its restore joins on
`work_order_item_id`, which matches nothing for free-form items. That is
already the correct behaviour.

---

## 5. Uniqueness is wrong in both directions — MEDIUM/HIGH

From the constraint list:

```
parties     parties_name_key             UNIQUE (name)
invoices    invoices_invoice_number_key  UNIQUE (invoice_number)

job_work_types  job_work_types_organization_id_name_key  UNIQUE (organization_id, name)
```

`job_work_types` is scoped correctly. `parties` and `invoices` are **globally
unique across every organization**, which is a multi-tenancy bug:

- Two organizations cannot both have a party named "Roja Silks". The second one
  gets a constraint violation, which `PartyFormModal` reports as "Party name
  already exists" — a confusing message about a party the user cannot see.
- Two organizations cannot both issue invoice number `INV-001`. Today this is
  masked because invoice numbers are `INV-${Date.now()}`, but it blocks any move
  to real sequential numbering using the `invoice_prefix` setting.

Both also leak a little information: you can probe whether a name exists in
another tenant by watching for the constraint error.

Meanwhile the opposite problem exists elsewhere — **no uniqueness at all** on:

- `delivery_challans.dc_number`
- `work_orders.work_order_number`

`DCForm` checks for duplicate DC numbers on the client by scanning the loaded
list, which is both racy (two users can pass the check simultaneously) and
incomplete (it only sees what the current page has loaded).

**Fix direction:** replace the two global constraints with
`UNIQUE (organization_id, name)` and `UNIQUE (organization_id, invoice_number)`,
and add `UNIQUE (organization_id, dc_number)` plus
`UNIQUE (organization_id, work_order_number)`.

Dropping and recreating a unique constraint is not risk-free on live data — the
new constraint will fail to create if existing rows violate it. Check for
duplicates first.

---

## 6. Good news for free-form challans

`dc_items.work_order_item_id` is **nullable** — the constraint list shows a
foreign key but no `NOT NULL`. So free-form challan items need no change to
`dc_items` at all. The only additive column required is
`delivery_challans.manual_wo_number`.

`invoice_items.dc_item_id` has no `ON DELETE` clause, so it defaults to
`NO ACTION` — which is what blocks deletion of an invoiced challan. That guard
is real, though it comes from the foreign key rather than from
`delete_work_order_with_effects` checking for it.

---

## 7. Roles exist in the schema but are unused

```
organization_members_role_check
  CHECK (role = ANY (ARRAY['owner','admin','accountant','operator','viewer']))
```

Five roles are defined and `useCurrentOrganization` returns the current user's
role, but nothing in the app checks it. Every member has full access to
everything. Worth knowing before more people are invited.

---

## 8. Smaller things

- **`get_dashboard_summary.unbilled_amount` is a quantity, not an amount.** The
  function comment admits it is a "quantity-based proxy". The dashboard card
  says "Unbilled Quantity", so the display is honest, but the column name will
  mislead whoever reads it next.
- **`active_customers` counts all-time distinct invoiced parties**, not
  customers active this month, despite sitting among month-scoped metrics.
- **`get_party_ledger_summary.outstanding_amount` equals `total_invoiced`.**
  There is no payment tracking, so the ledger's "Outstanding" figure is really
  "total ever invoiced". Misleading on a screen about money.
- **Most functions lack `SET search_path`.** Only
  `delete_delivery_challan_with_effects` sets it. Low risk while everything is
  `SECURITY INVOKER`, but Supabase's linter flags it and it is worth adding.
