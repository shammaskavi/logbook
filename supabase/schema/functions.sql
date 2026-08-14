-- ============================================================================
-- SNAPSHOT of public schema functions as deployed on project
-- pwdadqeyjansfkmxzgtu ("aamir jamal"), captured 2026-08-14.
--
-- This is a record of what is CURRENTLY LIVE, not a desired-state migration.
-- It exists so the business logic is under version control and recoverable.
--
-- ⚠ Includes two pre-multi-tenant duplicates that are still deployed and
--   callable. They are marked LEGACY below and should be dropped — see
--   docs/schema-findings.md.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- LEGACY — no organization_id. Superseded by the 7-argument version below.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_delivery_challan_with_effects(p_dc_number text, p_generated_date date, p_party_id uuid, p_party_name text, p_transporter_name text, p_items jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
  v_dc_id uuid;
  v_item jsonb;
  v_pending int;
  v_work_order_id uuid;
  v_party_gstin text;
begin
  select gstin into v_party_gstin from public.parties where id = p_party_id;

  insert into public.delivery_challans (
    dc_number, generated_date, party_id, party_name, party_gstin, transporter_name
  )
  values (
    p_dc_number, p_generated_date, p_party_id, p_party_name, v_party_gstin, p_transporter_name
  )
  returning id into v_dc_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select pending_quantity, work_order_id
    into v_pending, v_work_order_id
    from public.work_order_items
    where id = (v_item->>'work_order_item_id')::uuid
    for update;

    if not found then
      raise exception 'Work order item not found';
    end if;

    if not exists (
      select 1 from public.work_orders
      where id = v_work_order_id and party_id = p_party_id
    ) then
      raise exception 'Work order does not belong to selected party';
    end if;

    if (v_item->>'dc_quantity')::int <= 0 then
      raise exception 'DC quantity must be greater than zero';
    end if;

    if (v_item->>'dc_quantity')::int > v_pending then
      raise exception 'DC quantity exceeds pending quantity';
    end if;

    insert into public.dc_items (
      delivery_challan_id, work_order_item_id, job_work_type_name, quantity
    )
    values (
      v_dc_id, (v_item->>'work_order_item_id')::uuid,
      v_item->>'job_work_type_name', (v_item->>'dc_quantity')::int
    );

    update public.work_order_items
    set pending_quantity = pending_quantity - (v_item->>'dc_quantity')::int
    where id = (v_item->>'work_order_item_id')::uuid;
  end loop;

  return v_dc_id;
end;
$function$;


-- ────────────────────────────────────────────────────────────────────────────
-- CURRENT — used by the app.
-- Note: every item must resolve to a work_order_item, so this cannot create a
-- free-form challan (raises 'Work order item not found' on a null link).
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_delivery_challan_with_effects(p_organization_id uuid, p_dc_number text, p_generated_date date, p_party_id uuid, p_party_name text, p_transporter_name text, p_items jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
    v_dc_id uuid;
    v_item jsonb;
    v_pending int;
    v_work_order_id uuid;
    v_party_gstin text;
begin
    select gstin into v_party_gstin
    from public.parties
    where id = p_party_id and organization_id = p_organization_id;

    insert into public.delivery_challans (
        organization_id, dc_number, generated_date, party_id,
        party_name, party_gstin, transporter_name
    )
    values (
        p_organization_id, p_dc_number, p_generated_date, p_party_id,
        p_party_name, v_party_gstin, p_transporter_name
    )
    returning id into v_dc_id;

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        select pending_quantity, work_order_id
        into v_pending, v_work_order_id
        from public.work_order_items
        where id = (v_item->>'work_order_item_id')::uuid
          and organization_id = p_organization_id
        for update;

        if not found then
            raise exception 'Work order item not found';
        end if;

        if not exists (
            select 1 from public.work_orders
            where id = v_work_order_id
              and party_id = p_party_id
              and organization_id = p_organization_id
        ) then
            raise exception 'Work order does not belong to selected party';
        end if;

        if (v_item->>'dc_quantity')::int <= 0 then
            raise exception 'DC quantity must be greater than zero';
        end if;

        if (v_item->>'dc_quantity')::int > v_pending then
            raise exception 'DC quantity exceeds pending quantity';
        end if;

        insert into public.dc_items (
            organization_id, delivery_challan_id, work_order_item_id,
            job_work_type_name, quantity
        )
        values (
            p_organization_id, v_dc_id, (v_item->>'work_order_item_id')::uuid,
            v_item->>'job_work_type_name', (v_item->>'dc_quantity')::int
        );

        update public.work_order_items
        set pending_quantity = pending_quantity - (v_item->>'dc_quantity')::int
        where id = (v_item->>'work_order_item_id')::uuid
          and organization_id = p_organization_id;
    end loop;

    return v_dc_id;
end;
$function$;


CREATE OR REPLACE FUNCTION public.create_invoice_with_effects(p_organization_id uuid, p_invoice_number text, p_invoice_date date, p_party_id uuid, p_party_name text, p_party_gstin text, p_gst_type text, p_cgst_percent numeric, p_sgst_percent numeric, p_igst_percent numeric, p_items jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
    v_invoice_id uuid;
    v_item jsonb;
    v_remaining int;
    v_subtotal numeric := 0;
    v_tax numeric := 0;
    v_total numeric := 0;
    v_amount numeric;
begin
    insert into public.invoices (
        organization_id, invoice_number, invoice_date, party_id, party_name,
        party_gstin, gst_type, cgst_percent, sgst_percent, igst_percent
    )
    values (
        p_organization_id, p_invoice_number, p_invoice_date, p_party_id, p_party_name,
        p_party_gstin, p_gst_type, p_cgst_percent, p_sgst_percent, p_igst_percent
    )
    returning id into v_invoice_id;

    for v_item in select * from jsonb_array_elements(p_items)
    loop
        select (quantity - coalesce(invoiced_quantity, 0))
        into v_remaining
        from public.dc_items
        where id = (v_item->>'dc_item_id')::uuid
          and organization_id = p_organization_id
        for update;

        if not found then
            raise exception 'DC item not found';
        end if;

        if (v_item->>'quantity')::int <= 0 then
            raise exception 'Invoice quantity must be greater than zero';
        end if;

        if (v_item->>'quantity')::int > v_remaining then
            raise exception 'Invoice quantity exceeds remaining billable quantity';
        end if;

        v_amount := (v_item->>'quantity')::numeric * (v_item->>'rate')::numeric;
        v_subtotal := v_subtotal + v_amount;

        insert into public.invoice_items (
            organization_id, invoice_id, dc_item_id, work_order_id, wo_number,
            dc_number, particulars, quantity, rate, amount
        )
        values (
            p_organization_id, v_invoice_id, (v_item->>'dc_item_id')::uuid,
            (v_item->>'work_order_id')::uuid, v_item->>'wo_number',
            v_item->>'dc_number', v_item->>'particulars',
            (v_item->>'quantity')::int, (v_item->>'rate')::numeric, v_amount
        );

        update public.dc_items
        set invoiced_quantity = coalesce(invoiced_quantity, 0) + (v_item->>'quantity')::int
        where id = (v_item->>'dc_item_id')::uuid
          and organization_id = p_organization_id;
    end loop;

    if p_gst_type = 'cgst_sgst' then
        v_tax := v_subtotal * ((p_cgst_percent + p_sgst_percent) / 100);
    elsif p_gst_type = 'igst' then
        v_tax := v_subtotal * (p_igst_percent / 100);
    else
        v_tax := 0;
    end if;

    v_total := v_subtotal + v_tax;

    update public.invoices
    set subtotal = v_subtotal, tax_amount = v_tax, grand_total = v_total
    where id = v_invoice_id;

    return v_invoice_id;
end;
$function$;


CREATE OR REPLACE FUNCTION public.create_work_order_with_items(p_organization_id uuid, p_work_order_number text, p_received_date date, p_party_id uuid, p_party_name text, p_items jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
    v_work_order_id uuid;
begin
    insert into public.work_orders (
        organization_id, work_order_number, received_date, party_id, party_name
    )
    values (
        p_organization_id, p_work_order_number, p_received_date, p_party_id, p_party_name
    )
    returning id into v_work_order_id;

    insert into public.work_order_items (
        organization_id, work_order_id, job_work_type_id,
        job_work_type_name, quantity, pending_quantity
    )
    select
        p_organization_id, v_work_order_id, (item->>'job_work_type_id')::uuid,
        item->>'job_work_type_name', (item->>'quantity')::int,
        (item->>'pending_quantity')::int
    from jsonb_array_elements(p_items) as item;

    return v_work_order_id;
end;
$function$;


-- ────────────────────────────────────────────────────────────────────────────
-- LEGACY — no organization_id. Superseded by the 6-argument version above.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_work_order_with_items(p_work_order_number text, p_received_date date, p_party_id uuid, p_party_name text, p_items jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
  v_work_order_id uuid;
begin
  insert into public.work_orders (
    work_order_number, received_date, party_id, party_name
  )
  values (
    p_work_order_number, p_received_date, p_party_id, p_party_name
  )
  returning id into v_work_order_id;

  insert into public.work_order_items (
    work_order_id, job_work_type_id, job_work_type_name, quantity, pending_quantity
  )
  select
    v_work_order_id, (item->>'job_work_type_id')::uuid,
    item->>'job_work_type_name', (item->>'quantity')::int,
    (item->>'pending_quantity')::int
  from jsonb_array_elements(p_items) as item;

  return v_work_order_id;
end;
$function$;


CREATE OR REPLACE FUNCTION public.delete_delivery_challan_with_effects(p_dc_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.invoice_items ii
        JOIN public.dc_items dci ON dci.id = ii.dc_item_id
        WHERE dci.delivery_challan_id = p_dc_id
    ) THEN
        RAISE EXCEPTION
            'This delivery challan has already been used in an invoice and cannot be deleted.';
    END IF;

    UPDATE public.work_order_items woi
    SET pending_quantity =
        COALESCE(woi.pending_quantity, 0) + COALESCE(dci.quantity, 0)
    FROM public.dc_items dci
    WHERE dci.delivery_challan_id = p_dc_id
      AND dci.work_order_item_id = woi.id;

    DELETE FROM public.delivery_challans WHERE id = p_dc_id;

    RETURN p_dc_id;
END;
$function$;


-- ⚠ See docs/schema-findings.md — deletes whole challans that may contain
--   items belonging to OTHER work orders, without restoring their pending
--   quantities, and bypasses the invoiced-challan guard above.
CREATE OR REPLACE FUNCTION public.delete_work_order_with_effects(p_work_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  v_dc_ids uuid[];
begin
  select array_agg(distinct dc.delivery_challan_id)
  into v_dc_ids
  from public.dc_items dc
  join public.work_order_items woi on dc.work_order_item_id = woi.id
  where woi.work_order_id = p_work_order_id;

  if v_dc_ids is not null then
    delete from public.delivery_challans where id = any(v_dc_ids);
  end if;

  delete from public.work_orders where id = p_work_order_id;
end;
$function$;


-- ────────────────────────────────────────────────────────────────────────────
-- LEGACY — ⚠ NO ORGANIZATION FILTER AT ALL. See docs/schema-findings.md.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_billable_dc_items(p_party_id uuid)
 RETURNS TABLE(dc_item_id uuid, work_order_id uuid, wo_number text, dc_id uuid, dc_number text, job_work_type_name text, delivered_qty integer, invoiced_qty integer, remaining_qty integer)
 LANGUAGE sql
AS $function$
  select
    dci.id as dc_item_id,
    woi.work_order_id,
    wo.work_order_number as wo_number,
    dc.id as dc_id,
    dc.dc_number,
    dci.job_work_type_name,
    dci.quantity as delivered_qty,
    coalesce(dci.invoiced_quantity, 0) as invoiced_qty,
    (dci.quantity - coalesce(dci.invoiced_quantity, 0)) as remaining_qty
  from dc_items dci
  join delivery_challans dc on dc.id = dci.delivery_challan_id
  join work_order_items woi on woi.id = dci.work_order_item_id
  join work_orders wo on wo.id = woi.work_order_id
  where dc.party_id = p_party_id
    and (dci.quantity - coalesce(dci.invoiced_quantity, 0)) > 0
  order by wo.work_order_number, dc.dc_number;
$function$;


-- CURRENT — used by the app.
-- Note the INNER JOINs through work_order_items: a dc_item with a null
-- work_order_item_id is silently excluded and can never be invoiced.
CREATE OR REPLACE FUNCTION public.get_billable_dc_items(p_organization_id uuid, p_party_id uuid)
 RETURNS TABLE(dc_item_id uuid, work_order_id uuid, wo_number text, dc_id uuid, dc_number text, job_work_type_name text, delivered_qty integer, invoiced_qty integer, remaining_qty integer)
 LANGUAGE sql
AS $function$
    select
        dci.id as dc_item_id,
        woi.work_order_id,
        wo.work_order_number as wo_number,
        dc.id as dc_id,
        dc.dc_number,
        dci.job_work_type_name,
        dci.quantity as delivered_qty,
        coalesce(dci.invoiced_quantity, 0) as invoiced_qty,
        dci.quantity - coalesce(dci.invoiced_quantity, 0) as remaining_qty
    from public.dc_items dci
    join public.delivery_challans dc on dc.id = dci.delivery_challan_id
    join public.work_order_items woi on woi.id = dci.work_order_item_id
    join public.work_orders wo on wo.id = woi.work_order_id
    where dc.party_id = p_party_id
      and dc.organization_id = p_organization_id
      and dci.organization_id = p_organization_id
      and wo.organization_id = p_organization_id
      and (dci.quantity - coalesce(dci.invoiced_quantity, 0)) > 0
    order by dc.generated_date desc, dc.dc_number desc;
$function$;


CREATE OR REPLACE FUNCTION public.get_dashboard_summary(p_organization_id uuid)
 RETURNS TABLE(revenue_this_month numeric, pending_quantity bigint, unbilled_amount numeric, active_customers bigint, invoice_count bigint, work_order_count bigint)
 LANGUAGE sql
 STABLE
AS $function$
with current_month_invoices as (
    select * from public.invoices
    where organization_id = p_organization_id
      and date_trunc('month', invoice_date) = date_trunc('month', current_date)
),
current_month_work_orders as (
    select * from public.work_orders
    where organization_id = p_organization_id
      and date_trunc('month', received_date) = date_trunc('month', current_date)
)
select
    coalesce((select sum(grand_total) from current_month_invoices), 0) as revenue_this_month,

    coalesce((
        select sum(woi.pending_quantity)
        from public.work_order_items woi
        join public.work_orders wo on wo.id = woi.work_order_id
        where wo.organization_id = p_organization_id
    ), 0) as pending_quantity,

    -- Despite the name, this is a QUANTITY, not an amount.
    coalesce((
        select sum(dci.quantity - coalesce(dci.invoiced_quantity, 0))
        from public.dc_items dci
        join public.delivery_challans dc on dc.id = dci.delivery_challan_id
        where dc.organization_id = p_organization_id
          and (dci.quantity - coalesce(dci.invoiced_quantity, 0)) > 0
    ), 0) as unbilled_amount,

    -- All-time distinct invoiced parties, not "active this month".
    coalesce((
        select count(distinct party_id) from public.invoices
        where organization_id = p_organization_id
    ), 0) as active_customers,

    coalesce((select count(*) from current_month_invoices), 0) as invoice_count,
    coalesce((select count(*) from current_month_work_orders), 0) as work_order_count;
$function$;


CREATE OR REPLACE FUNCTION public.get_job_work_type_breakdown(p_organization_id uuid)
 RETURNS TABLE(job_work_type_name text, total_quantity bigint)
 LANGUAGE sql
 STABLE
AS $function$
select
    woi.job_work_type_name,
    coalesce(sum(woi.quantity), 0)::bigint as total_quantity
from public.work_order_items woi
join public.work_orders wo on wo.id = woi.work_order_id
where wo.organization_id = p_organization_id
group by woi.job_work_type_name
order by total_quantity desc, woi.job_work_type_name;
$function$;


CREATE OR REPLACE FUNCTION public.get_monthly_quantity_trend(p_organization_id uuid)
 RETURNS TABLE(month date, total_quantity bigint)
 LANGUAGE sql
 STABLE
AS $function$
select
    date_trunc('month', wo.received_date)::date as month,
    coalesce(sum(woi.quantity), 0)::bigint as total_quantity
from public.work_order_items woi
join public.work_orders wo on wo.id = woi.work_order_id
where wo.organization_id = p_organization_id
group by 1
order by 1;
$function$;


CREATE OR REPLACE FUNCTION public.get_party_ledger_summary(p_organization_id uuid, p_party_id uuid)
 RETURNS TABLE(total_work_orders bigint, total_quantity bigint, total_invoiced numeric, outstanding_amount numeric)
 LANGUAGE sql
 STABLE
AS $function$
select
    coalesce((
        select count(*) from public.work_orders
        where organization_id = p_organization_id and party_id = p_party_id
    ), 0) as total_work_orders,

    coalesce((
        select sum(woi.quantity)
        from public.work_order_items woi
        join public.work_orders wo on wo.id = woi.work_order_id
        where wo.organization_id = p_organization_id and wo.party_id = p_party_id
    ), 0) as total_quantity,

    coalesce((
        select sum(grand_total) from public.invoices
        where organization_id = p_organization_id and party_id = p_party_id
    ), 0) as total_invoiced,

    -- Identical to total_invoiced until payment tracking exists.
    coalesce((
        select sum(grand_total) from public.invoices
        where organization_id = p_organization_id and party_id = p_party_id
    ), 0) as outstanding_amount;
$function$;


CREATE OR REPLACE FUNCTION public.get_pending_work_by_party(p_organization_id uuid)
 RETURNS TABLE(party_id uuid, party_name text, pending_quantity bigint)
 LANGUAGE sql
 STABLE
AS $function$
    SELECT
        wo.party_id,
        wo.party_name,
        SUM(woi.pending_quantity)::bigint AS pending_quantity
    FROM work_orders wo
    INNER JOIN work_order_items woi ON woi.work_order_id = wo.id
    WHERE wo.organization_id = p_organization_id
      AND woi.pending_quantity > 0
    GROUP BY wo.party_id, wo.party_name
    HAVING SUM(woi.pending_quantity) > 0
    ORDER BY pending_quantity DESC
    LIMIT 10;
$function$;


CREATE OR REPLACE FUNCTION public.get_top_parties_by_quantity(p_organization_id uuid)
 RETURNS TABLE(party_name text, total_quantity bigint)
 LANGUAGE sql
 STABLE
AS $function$
select
    wo.party_name,
    coalesce(sum(woi.quantity), 0)::bigint as total_quantity
from public.work_order_items woi
join public.work_orders wo on wo.id = woi.work_order_id
where wo.organization_id = p_organization_id
group by wo.party_name
order by total_quantity desc, wo.party_name;
$function$;


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$;


-- ⚠ See docs/schema-findings.md — deletes and recreates work_order_items with
--   new ids (breaking dc_items references) and omits organization_id on the
--   re-inserted rows.
CREATE OR REPLACE FUNCTION public.update_work_order_with_items(p_work_order_id uuid, p_work_order_number text, p_received_date date, p_party_id uuid, p_party_name text, p_items jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
begin
  update public.work_orders
  set
    work_order_number = p_work_order_number,
    received_date = p_received_date,
    party_id = p_party_id,
    party_name = p_party_name,
    updated_at = now()
  where id = p_work_order_id;

  if not found then
    raise exception 'Work order not found';
  end if;

  delete from public.work_order_items
  where work_order_id = p_work_order_id;

  insert into public.work_order_items (
    work_order_id, job_work_type_id, job_work_type_name, quantity, pending_quantity
  )
  select
    p_work_order_id, (item->>'job_work_type_id')::uuid,
    item->>'job_work_type_name', (item->>'quantity')::int,
    (item->>'pending_quantity')::int
  from jsonb_array_elements(p_items) as item;

end;
$function$;
