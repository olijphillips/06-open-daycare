-- SPEC 10 — Tablas de invitaciones y vínculos padre-hijo.

create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id),
  invited_by uuid not null references public.users (id),
  full_name text not null,
  email text not null,
  relationship public.relationship_type not null,
  code text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index invitations_child_id_idx on public.invitations (child_id);
create index invitations_email_idx on public.invitations (email);
alter table public.invitations enable row level security;
create policy "invitations_select_authenticated" on public.invitations
  for select to authenticated using (true);
create policy "invitations_insert_staff" on public.invitations
  for insert to authenticated
  with check (exists (select 1 from public.users
    where users.id = auth.uid() and users.role in ('admin', 'staff')));
create policy "invitations_update_staff" on public.invitations
  for update to authenticated
  using (exists (select 1 from public.users
    where users.id = auth.uid() and users.role in ('admin', 'staff')));

create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users (id),
  child_id uuid not null references public.children (id),
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);
create index parent_children_child_id_idx on public.parent_children (child_id);
alter table public.parent_children enable row level security;
create policy "parent_children_select_authenticated" on public.parent_children
  for select to authenticated using (true);
create policy "parent_children_insert_staff" on public.parent_children
  for insert to authenticated
  with check (exists (select 1 from public.users
    where users.id = auth.uid() and users.role in ('admin', 'staff')));
create policy "parent_children_update_staff" on public.parent_children
  for update to authenticated
  using (exists (select 1 from public.users
    where users.id = auth.uid() and users.role in ('admin', 'staff')));
