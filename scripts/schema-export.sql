-- ============================================================================
-- Schema export queries — run these in the Supabase Dashboard SQL Editor
-- ============================================================================
--
--   Dashboard -> SQL Editor -> New query -> paste ONE query -> Run
--   -> click "Download CSV" on the results -> save the file
--
-- Every query here is READ-ONLY. They only read Postgres' own catalog; none of
-- them create, alter or delete anything.
--
-- Query 1 is the important one — it is the actual source code of the business
-- logic. If you only manage one, make it that. The rest are useful context.
-- ============================================================================


-- ── 1. FUNCTION DEFINITIONS  (the critical one) ─────────────────────────────
-- The full source of every RPC: create_delivery_challan_with_effects,
-- get_billable_dc_items, create_invoice_with_effects, the dashboard functions,
-- and so on. Extension-owned functions are excluded to keep the output clean.

select
    p.proname                as function_name,
    pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
left join pg_depend d on d.objid = p.oid and d.deptype = 'e'
where n.nspname = 'public'
  and d.objid is null
order by p.proname;


-- ── 2. ROW LEVEL SECURITY POLICIES ──────────────────────────────────────────
-- Who is allowed to read and write each table. Needed to know whether a new
-- column or table will be reachable by the app at all.

select
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual        as using_expression,
    with_check  as with_check_expression
from pg_policies
where schemaname = 'public'
order by tablename, policyname;


-- ── 3. CONSTRAINTS ──────────────────────────────────────────────────────────
-- Primary keys, foreign keys, unique and check constraints. This tells me
-- whether dc_items.work_order_item_id is genuinely optional, which decides
-- whether a free-form challan is possible without altering the table.

select
    conrelid::regclass::text  as table_name,
    conname                   as constraint_name,
    pg_get_constraintdef(oid) as definition
from pg_constraint
where connamespace = 'public'::regnamespace
order by 1, 2;


-- ── 4. TRIGGERS ─────────────────────────────────────────────────────────────
-- Anything that fires automatically on insert/update/delete.

select
    tgrelid::regclass::text as table_name,
    tgname                  as trigger_name,
    pg_get_triggerdef(oid)  as definition
from pg_trigger
where not tgisinternal
  and tgrelid in (
      select oid from pg_class where relnamespace = 'public'::regnamespace
  )
order by 1, 2;


-- ── 5. COLUMNS, DEFAULTS AND NULLABILITY ────────────────────────────────────
-- Exact column types, defaults and NOT NULL flags.

select
    table_name,
    ordinal_position,
    column_name,
    data_type,
    is_nullable,
    column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;


-- ── 6. INDEXES ──────────────────────────────────────────────────────────────
-- Useful for spotting missing indexes behind slow screens.

select
    tablename,
    indexname,
    indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;
