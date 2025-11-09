-- Create table to log generated UPI links for EMI payments
create table if not exists public.upi_links (
  id uuid primary key default gen_random_uuid(),
  upi_link text not null,
  amount numeric not null,
  customer_id uuid references public.customers(id) on delete set null,
  purchase_id uuid references public.purchases(id) on delete set null,
  emi_schedule_id uuid references public.emi_schedule(id) on delete set null,
  status text not null default 'generated',
  created_at timestamptz not null default now()
);

-- Optional: enable RLS and allow admins; assuming an 'admins' role exists in policies
-- alter table public.upi_links enable row level security;
-- create policy "upi_links_admin_all" on public.upi_links for all using (true) with check (true);

