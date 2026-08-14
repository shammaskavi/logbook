-- ============================================================================
-- PROPOSED — review before running. Nothing here has been executed.
--
-- Closes the anonymous read access to every business table. Filename is
-- deliberately not a timestamp so it is not picked up by `supabase db push`
-- until you rename it.
--
-- Run in STAGES. Stage 1 is safe to run immediately. Stage 2 changes how the
-- app authorises every query and must be tested.
-- ============================================================================


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ STAGE 1 — run now. Stops anonymous access to bank details.               ║
-- ║ Zero risk to the running app: a second policy already grants the same    ║
-- ║ table to `authenticated`, which is what the app actually uses.           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

drop policy if exists "Allow all access to business_settings for now"
  on public.business_settings;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ STAGE 2 — the real fix. Test before running against production.          ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Membership test used by every policy below.
--
-- SECURITY DEFINER matters: it lets this read organization_members without
-- being subject to that table's own RLS, which would otherwise recurse
-- infinitely when the policy on organization_members calls it.
create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = auth.uid()
  );
$$;

revoke execute on function public.is_org_member(uuid) from anon;


-- ── The eight unprotected tables ────────────────────────────────────────────
-- Each carries organization_id, so one policy shape covers all of them. The
-- app already filters by organization_id on every query, so a correctly
-- configured user sees exactly what they see today.

do $$
declare
  t text;
begin
  foreach t in array array[
    'parties',
    'job_work_types',
    'work_orders',
    'work_order_items',
    'delivery_challans',
    'dc_items',
    'invoices',
    'invoice_items'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'drop policy if exists "org members full access" on public.%I', t
    );

    execute format($f$
      create policy "org members full access" on public.%I
        for all
        to authenticated
        using (public.is_org_member(organization_id))
        with check (public.is_org_member(organization_id))
    $f$, t);
  end loop;
end
$$;


-- ── organizations ───────────────────────────────────────────────────────────
-- Currently: any authenticated user can read, rename or delete ANY
-- organization. Replaced with membership-scoped access, plus an insert path so
-- signup can still create one.

drop policy if exists "Authenticated users can manage organizations"
  on public.organizations;

create policy "members access their organization" on public.organizations
  for all
  to authenticated
  using (public.is_org_member(id))
  with check (public.is_org_member(id));

-- Deliberately NO plain insert policy for organizations. Signup goes through
-- the function below instead — see the note on the signup flow.


-- ── organization_members ────────────────────────────────────────────────────
-- Currently: any authenticated user can add themselves to ANY organization, or
-- remove other people's memberships. That is the most serious of the policy
-- bugs, because it is a path from "has an account" to "has your data".

drop policy if exists "Authenticated users can manage organization members"
  on public.organization_members;

create policy "read memberships of own organizations"
  on public.organization_members
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_org_member(organization_id));

-- No insert policy: membership is granted only by the signup function below.
-- Joining an existing organization needs an invite flow, which does not exist
-- yet. Leaving inserts closed is the safe default until it does.


-- ── business_settings ───────────────────────────────────────────────────────

drop policy if exists "Authenticated users can manage business settings"
  on public.business_settings;

create policy "org members manage business settings" on public.business_settings
  for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));


-- ── Signup ──────────────────────────────────────────────────────────────────
-- Once RLS is on, the current signup flow breaks: AuthContext does
-- `.insert(...).select().single()` on organizations, and RETURNING requires a
-- SELECT policy, which cannot pass because the user is not a member yet.
--
-- This function replaces those three separate client-side inserts. It also
-- fixes a pre-existing bug: today, if any of the three fails, the user is left
-- with an account and no organization and the app silently shows nothing.
-- Here all three either succeed together or none do.

create or replace function public.create_organization_with_owner(
  p_name text,
  p_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_organization_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- One organization per user, matching what useCurrentOrganization assumes
  -- with its .single() lookup.
  if exists (
    select 1 from public.organization_members where user_id = v_user_id
  ) then
    raise exception 'This account already belongs to an organization';
  end if;

  insert into public.organizations (name, slug)
  values (p_name, p_slug)
  returning id into v_organization_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_organization_id, v_user_id, 'owner');

  insert into public.business_settings (organization_id, business_name)
  values (v_organization_id, p_name);

  return v_organization_id;
end;
$$;

revoke execute on function public.create_organization_with_owner(text, text) from anon;

-- Corresponding client change in src/context/AuthContext.tsx — replace the
-- three inserts with:
--
--   const { error } = await supabase.rpc("create_organization_with_owner", {
--     p_name: businessName,
--     p_slug: slug,
--   });


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ STAGE 3 — drop the superseded pre-multi-tenant functions.                ║
-- ║ The app calls none of these. Dropping a specific overload leaves the      ║
-- ║ current one untouched.                                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

drop function if exists public.get_billable_dc_items(uuid);
drop function if exists public.create_work_order_with_items(text, date, uuid, text, jsonb);
drop function if exists public.create_delivery_challan_with_effects(text, date, uuid, text, text, jsonb);


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ VERIFY — after stage 2, this should return zero rows.                    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- select c.relname, c.relrowsecurity
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public'
--   and c.relkind = 'r'
--   and c.relrowsecurity = false;
--
-- And re-run the anonymous probe — every table should return 0 rows.
