-- ============================================================================
-- Free-form (manual) delivery challans — minimum required schema change.
--
-- Each challan line carries its own work order number, so one manual challan
-- can reference several work orders — matching how a work-order-based challan
-- can already draw items from more than one order.
--
-- Three statements. Two are purely additive and cannot affect anything that
-- exists today. The third replaces one function; see the note on why it is
-- behaviour-preserving for existing data.
--
-- Run in the Supabase SQL Editor.
-- ============================================================================


-- ── 1. Somewhere to put the typed-in work order number ──────────────────────
-- On the ITEM, not the challan. Additive and nullable: existing rows get NULL,
-- nothing else changes.

alter table public.dc_items
  add column if not exists manual_wo_number text;


-- ── 2. A new function to create a manual challan ────────────────────────────
-- Separate from create_delivery_challan_with_effects, which is left completely
-- untouched — the existing work-order-based flow carries no risk from this.
--
-- Items are inserted with work_order_item_id = NULL, which is what marks a
-- challan line as free-form. No pending quantity is touched, because there is
-- no work order behind these goods.

-- Harmless if it was never created; guards against leaving a stale overload
-- behind if an earlier version of this file was run.
drop function if exists public.create_manual_delivery_challan(
    uuid, text, date, uuid, text, text, text, jsonb
);

create or replace function public.create_manual_delivery_challan(
    p_organization_id uuid,
    p_dc_number text,
    p_generated_date date,
    p_party_id uuid,
    p_party_name text,
    p_transporter_name text,
    p_items jsonb          -- [{ job_work_type_name, quantity, manual_wo_number }]
)
returns uuid
language plpgsql
as $function$
declare
    v_dc_id uuid;
    v_item jsonb;
    v_party_gstin text;
begin
    if p_items is null or jsonb_array_length(p_items) = 0 then
        raise exception 'A delivery challan needs at least one item';
    end if;

    -- Snapshot the party GSTIN, same as the work-order-based function does.
    select gstin
    into v_party_gstin
    from public.parties
    where id = p_party_id
      and organization_id = p_organization_id;

    if not found then
        raise exception 'Party not found';
    end if;

    insert into public.delivery_challans (
        organization_id,
        dc_number,
        generated_date,
        party_id,
        party_name,
        party_gstin,
        transporter_name
    )
    values (
        p_organization_id,
        p_dc_number,
        p_generated_date,
        p_party_id,
        p_party_name,
        v_party_gstin,
        p_transporter_name
    )
    returning id into v_dc_id;

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        if (v_item->>'quantity')::int <= 0 then
            raise exception 'Quantity must be greater than zero';
        end if;

        insert into public.dc_items (
            organization_id,
            delivery_challan_id,
            work_order_item_id,   -- NULL: this is what makes it free-form
            job_work_type_name,
            quantity,
            manual_wo_number
        )
        values (
            p_organization_id,
            v_dc_id,
            null,
            v_item->>'job_work_type_name',
            (v_item->>'quantity')::int,
            nullif(trim(v_item->>'manual_wo_number'), '')
        );
    end loop;

    return v_dc_id;
end;
$function$;


-- ── 3. Let manual challan items reach the invoice screen ────────────────────
-- The only change to something already in use.
--
-- WHY THIS IS SAFE FOR EXISTING DATA: for any dc_item that HAS a
-- work_order_item_id, a left join returns exactly the same row an inner join
-- did — the foreign key guarantees the referenced row exists. The only rows
-- that behave differently are ones with a NULL work_order_item_id, and none
-- exist until the first manual challan is created.
--
-- The organization checks for work_order_items and work_orders move into the
-- JOIN conditions. Left in the WHERE clause they would evaluate to NULL for
-- manual items and filter them straight back out.

create or replace function public.get_billable_dc_items(
    p_organization_id uuid,
    p_party_id uuid
)
returns table(
    dc_item_id uuid,
    work_order_id uuid,
    wo_number text,
    dc_id uuid,
    dc_number text,
    job_work_type_name text,
    delivered_qty integer,
    invoiced_qty integer,
    remaining_qty integer
)
language sql
as $function$
    select
        dci.id as dc_item_id,
        woi.work_order_id,                                     -- NULL when manual
        coalesce(wo.work_order_number, dci.manual_wo_number) as wo_number,
        dc.id as dc_id,
        dc.dc_number,
        dci.job_work_type_name,
        dci.quantity as delivered_qty,
        coalesce(dci.invoiced_quantity, 0) as invoiced_qty,
        dci.quantity - coalesce(dci.invoiced_quantity, 0) as remaining_qty
    from public.dc_items dci
    join public.delivery_challans dc
        on dc.id = dci.delivery_challan_id
    left join public.work_order_items woi
        on woi.id = dci.work_order_item_id
       and woi.organization_id = p_organization_id
    left join public.work_orders wo
        on wo.id = woi.work_order_id
       and wo.organization_id = p_organization_id
    where dc.party_id = p_party_id
      and dc.organization_id = p_organization_id
      and dci.organization_id = p_organization_id
      and (dci.quantity - coalesce(dci.invoiced_quantity, 0)) > 0
    order by dc.generated_date desc, dc.dc_number desc;
$function$;
