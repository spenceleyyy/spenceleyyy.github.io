-- Run this in your Supabase project: SQL Editor → New query → paste → Run

-- Initiatives (projects)
create table if not exists initiatives (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner       text,
  start_date  date,
  end_date    date,
  status      text,
  notes       text,
  created_at  timestamptz default now()
);

-- Features (tasks within a project)
create table if not exists features (
  id              uuid primary key default gen_random_uuid(),
  initiative_id   uuid references initiatives(id) on delete cascade,
  name            text not null,
  priority        text,
  progress        text,
  type            text,
  milestone       text,
  start_date      date,
  end_date        date,
  created_at      timestamptz default now()
);

-- Subtasks (with deadlines and status)
create table if not exists subtasks (
  id          uuid primary key default gen_random_uuid(),
  feature_id  uuid references features(id) on delete cascade,
  name        text not null,
  owner       text,
  deadline    date,
  status      text default 'Not started',
  notes       text,
  created_at  timestamptz default now()
);

-- Enable Row Level Security (open for now — single user app)
alter table initiatives enable row level security;
alter table features enable row level security;
alter table subtasks enable row level security;

create policy "Allow all" on initiatives for all using (true) with check (true);
create policy "Allow all" on features for all using (true) with check (true);
create policy "Allow all" on subtasks for all using (true) with check (true);
