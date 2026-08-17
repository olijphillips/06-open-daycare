create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;

create policy "daycares_select_authenticated" on public.daycares
  for select to authenticated
  using (true);

insert into public.daycares (name) values ('Guardería Sala Soles');
