-- ============================================================================
-- Are you exposed to the work-order delete bug?  (read-only)
--
-- delete_work_order_with_effects deletes every challan that touches the work
-- order being deleted — including challans that also carry OTHER work orders'
-- items. Those other work orders never get their pending quantity restored,
-- because the restore logic lives in delete_delivery_challan_with_effects,
-- which that function never calls.
--
-- This lists the challans where that would happen. Rows returned = challans
-- that span more than one work order.
--
-- If this returns nothing, no existing challan can trigger the bug today, but
-- the next multi-work-order challan someone creates can.
-- ============================================================================

select
    dc.dc_number,
    dc.generated_date,
    dc.party_name,
    count(distinct woi.work_order_id) as work_orders_on_this_challan,
    string_agg(distinct wo.work_order_number, ', ' order by wo.work_order_number)
        as work_order_numbers,
    -- An invoiced challan is protected: the invoice_items foreign key blocks
    -- the delete. Un-invoiced ones are the dangerous ones.
    bool_or(ii.id is not null) as has_been_invoiced
from public.delivery_challans dc
join public.dc_items dci
    on dci.delivery_challan_id = dc.id
join public.work_order_items woi
    on woi.id = dci.work_order_item_id
join public.work_orders wo
    on wo.id = woi.work_order_id
left join public.invoice_items ii
    on ii.dc_item_id = dci.id
group by dc.id, dc.dc_number, dc.generated_date, dc.party_name
having count(distinct woi.work_order_id) > 1
order by dc.generated_date desc;
