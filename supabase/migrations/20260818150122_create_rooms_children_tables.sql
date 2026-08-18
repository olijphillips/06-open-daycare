create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  name text not null,
  created_at timestamptz not null default now()
);
create index rooms_daycare_id_idx on public.rooms (daycare_id);
alter table public.rooms enable row level security;
create policy "rooms_select_authenticated" on public.rooms
  for select to authenticated
  using (true);
create policy "rooms_insert_staff" on public.rooms
  for insert to authenticated
  with check (exists (select 1 from public.users
    where users.id = auth.uid() and users.role in ('admin', 'staff')));
create policy "rooms_update_staff" on public.rooms
  for update to authenticated
  using (exists (select 1 from public.users
    where users.id = auth.uid() and users.role in ('admin', 'staff')));

create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id),
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null default current_date,
  medical_notes text,
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index children_room_id_idx on public.children (room_id);
alter table public.children enable row level security;
create policy "children_select_authenticated" on public.children
  for select to authenticated
  using (true);
create policy "children_insert_staff" on public.children
  for insert to authenticated
  with check (exists (select 1 from public.users
    where users.id = auth.uid() and users.role in ('admin', 'staff')));
create policy "children_update_staff" on public.children
  for update to authenticated
  using (exists (select 1 from public.users
    where users.id = auth.uid() and users.role in ('admin', 'staff')));

-- Seed salas: Sol, Tierra y Luna para la guardería demo.
insert into public.rooms (daycare_id, name)
select d.id, room_name
from public.daycares d,
  unnest(array['Sol', 'Tierra', 'Luna']) as room_name
where d.name = 'Guardería Sala Soles';

-- Seed niños: los 8 del mock (SPEC 02/04), todos en la sala Sol.
-- Fechas convertidas del formato corto del mock a ISO.
insert into public.children (room_id, full_name, birth_date, enrolled_at, allergy_tags, medical_notes)
select
  (select r.id from public.rooms r where r.name = 'Sol'),
  x.full_name, x.birth_date::date, x.enrolled_at::date, x.allergy_tags, x.medical_notes
from (values
  ('Mateo Fernández', '2022-03-12', '2025-02-01', array['peanut'],
   'Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.'),
  ('Sofía Méndez',   '2023-07-05', '2025-01-01', array[]::text[], null),
  ('Benjamín Ruiz',  '2022-11-22', '2025-03-01', array[]::text[], null),
  ('Valentina Soto', '2023-02-18', '2025-04-01', array[]::text[], null),
  ('Tomás Díaz',     '2022-09-09', '2025-02-01', array['lactose'], null),
  ('Emma Castro',    '2023-04-14', '2025-03-01', array[]::text[], null),
  ('Lucas Romero',   '2022-05-30', '2025-01-01', array[]::text[], null),
  ('Olivia Vega',    '2023-10-02', '2025-04-01', array[]::text[], null)
) as x(full_name, birth_date, enrolled_at, allergy_tags, medical_notes);
