create extension if not exists pgcrypto with schema extensions;

create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  daycare_id uuid not null references public.daycares (id),
  role public.user_role not null default 'parent',
  status public.user_status not null default 'active',
  full_name text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_daycare_id_idx on public.users (daycare_id);

alter table public.users enable row level security;

create policy "users_select_own" on public.users
  for select to authenticated
  using (auth.uid() = id);

create policy "users_update_own" on public.users
  for update to authenticated
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, daycare_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'daycare_id')::uuid,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'parent'),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
(
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@opendaycare.com',
  extensions.crypt('Staff2026!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'role', 'admin',
    'full_name', 'Nadia García',
    'daycare_id', (select id from public.daycares where name = 'Guardería Sala Soles')
  ),
  now(),
  now()
),
(
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'staff@opendaycare.com',
  extensions.crypt('Staff2026!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'role', 'staff',
    'full_name', 'Luis Pérez',
    'daycare_id', (select id from public.daycares where name = 'Guardería Sala Soles')
  ),
  now(),
  now()
);
