-- powntheday.com schema

create table profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  personality_type text not null check (personality_type in ('steady', 'athlete', 'maker', 'nurturer')),
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  label text not null,
  importance text not null default 'normal' check (importance in ('normal', 'low')),
  days boolean[] not null default array[true, true, true, true, true, true, true], -- Sun through Sat
  sort_order integer not null default 0,
  is_starter boolean not null default false,
  created_at timestamptz default now()
);

create table completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  completed_date date not null default current_date,
  created_at timestamptz default now(),
  unique(task_id, completed_date)
);

-- RLS
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table completions enable row level security;

-- Open read/write policies (no auth — profile selector model)
create policy "allow all on profiles" on profiles for all using (true) with check (true);
create policy "allow all on tasks" on tasks for all using (true) with check (true);
create policy "allow all on completions" on completions for all using (true) with check (true);

-- Indexes
create index on tasks(profile_id, sort_order);
create index on completions(task_id, completed_date);

-- Starter task seed data
-- Called after a profile is created; app inserts the appropriate rows server-side.
-- Personality type starter sets are defined in lib/starterTasks.ts, not seeded here.
