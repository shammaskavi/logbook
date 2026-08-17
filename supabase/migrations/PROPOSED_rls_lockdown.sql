-- ============================================================================
-- PROPOSED — review before running. Nothing here has been executed.
--
-- Closes the anonymous read access to your business data. Filename is
-- deliberately not a timestamp so `supabase db push` will not pick it up until
-- you rename it.
--
-- Split into three stages, ordered by (value / risk). Stage A and B together
-- close the public data hole and neither touches the signup flow. Stage C is
-- the one that needs care.
-- ============================================================================


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ STAGE A — one line, run now.                                             ║
-- ║                                                                          ║
-- ║ Stops ANONYMOUS reads of business_settings, which holds bank account     ║
-- ║ numbers, IFSC, GSTIN and PAN. The `{public}` role in that policy         ║
-- ║ includes unauthenticated callers.                                        ║
-- ║                                                                          ║
-- ║ Zero risk: a second policy already grants this table to `authenticated`, ║
-- ║ which is what the app actually uses.                                     ║
-- ║                                                                          ║
-- ║ Partial fix only — it does not touch the eight tables below.             ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

drop policy if exists "Allow all access to business_settings for now"
  on public.business_settings;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ STAGE B — the real fix for the public data hole.                         ║
-- ║                                                                          ║
-- ║ These eight tables currently have NO policies, and row level security is ║
-- ║ off, so anyone holding the anon key (which ships in your JS bundle) can  ║
-- ║ read and write every organization's rows.                                ║
-- ║                                                                          ║
-- ║ Does NOT touch signup. Signup writes only to organizations,              ║
-- ║ organization_members and business_settings — none of which are here.     ║
-- ║                                                                          ║
-- ║ Should be transparent to the app: it already filters every query by      ║
-- ║ organization_id, so a legitimate user sees exactly what they see today.  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Membership test used by the policies.
--
-- SECURITY DEFINER matters: it lets this read organization_members without
-- being subject to that table's own RLS, which would otherwise recurse when a
-- policy on organization_members calls it.
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

-- ── Verify Stage B ──────────────────────────────────────────────────────────
-- Re-run the anonymous probe; every one of the eight should return 0 rows.
-- Then log in and confirm work orders, challans and invoices all still load.


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ STAGE C — tightens the org/membership tables. TEST SIGNUP AFTER.          ║
-- ║                                                                          ║
-- ║ Fixes a privilege escalation: the current organization_members policy is ║
-- ║ ALL / authenticated / USING true, so anyone who can create an account    ║
-- ║ can insert themselves into any organization and read its data.           ║
-- ║                                                                          ║
-- ║ This stage changes signup, so it needs the client change below and a     ║
-- ║ real signup test.                                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

drop policy if exists "Authenticated users can manage organizations"
  on public.organizations;

create policy "members access their organization" on public.organizations
  for all
  to authenticated
  using (public.is_org_member(id))
  with check (public.is_org_member(id));

drop policy if exists "Authenticated users can manage organization members"
  on public.organization_members;

create policy "read memberships of own organizations"
  on public.organization_members
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_org_member(organization_id));

-- No insert policy on either table: new organizations are created only through
-- the function below. Joining an existing organization needs an invite flow,
-- which does not exist yet — leaving inserts closed is the safe default.

drop policy if exists "Authenticated users can manage business settings"
  on public.business_settings;

create policy "org members manage business settings" on public.business_settings
  for all
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));


-- Signup, as one atomic operation.
--
-- Needed because once RLS is on, AuthContext's `.insert(...).select().single()`
-- on organizations breaks: RETURNING requires a SELECT policy, which cannot
-- pass when the user is not a member yet.
--
-- This also fixes an existing bug — today the three inserts are separate, so a
-- failure part-way leaves a user with an account, no organization, and an app
-- that silently shows nothing.

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

-- Matching client change in src/context/AuthContext.tsx — replace the three
-- inserts with:
--
--   const { error } = await supabase.rpc("create_organization_with_owner", {
--     p_name: businessName,
--     p_slug: slug,
--   });


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ STAGE D — drop the superseded pre-multi-tenant function overloads.       ║
-- ║ The app calls none of these. Dropping a specific overload leaves the     ║
-- ║ current one untouched.                                                   ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

drop function if exists public.get_billable_dc_items(uuid);
drop function if exists public.create_work_order_with_items(text, date, uuid, text, jsonb);
drop function if exists public.create_delivery_challan_with_effects(text, date, uuid, text, text, jsonb);
