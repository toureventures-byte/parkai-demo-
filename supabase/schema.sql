-- ParkGrid demo database: monthly parkers and their invoices.
-- Every row belongs to the signed-in user (owner_id), and row-level security
-- makes sure each account can only see and change its own rows.

create table if not exists public.parkers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  property text not null,
  parker_code text,
  name text not null,
  company text,
  email text,
  vehicle text,
  plate text,
  space_type text,
  rate numeric(10, 2),
  start_date date,
  end_date date,
  card text,
  card_status text default 'Active',
  status text not null default 'Active',
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  parker_id uuid not null references public.parkers (id) on delete cascade,
  period text,
  amount_due numeric(10, 2) not null,
  due_date date not null,
  paid_date date,
  amount_paid numeric(10, 2) not null default 0,
  method text,
  created_at timestamptz not null default now()
);

create index if not exists parkers_owner_property_idx on public.parkers (owner_id, property);
create index if not exists invoices_owner_idx on public.invoices (owner_id);
create index if not exists invoices_parker_idx on public.invoices (parker_id);

alter table public.parkers enable row level security;
alter table public.invoices enable row level security;

drop policy if exists "Owners manage their parkers" on public.parkers;
create policy "Owners manage their parkers" on public.parkers
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners manage their invoices" on public.invoices;
create policy "Owners manage their invoices" on public.invoices
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from public.parkers p where p.id = parker_id and p.owner_id = (select auth.uid()))
  );
