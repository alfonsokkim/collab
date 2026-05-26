-- Society registry: known UNSW societies to match against
create table if not exists society_registry (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  email_domain text,
  aliases text[] default '{}',
  created_at timestamptz default now()
);

-- Verification requests: one row per society user
create table if not exists verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  society_name text not null,
  society_type text not null,
  email text not null,
  trust_score int not null default 0,
  status text not null default 'unverified' check (status in ('unverified', 'pending', 'verified', 'rejected')),
  registry_match_id uuid references society_registry(id),
  reasons text[] default '{}',
  admin_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

-- Add verification_status to societies if not present
alter table societies add column if not exists verification_status text not null default 'unverified'
  check (verification_status in ('unverified', 'pending', 'verified', 'rejected'));

-- RLS: users can read their own verification request
alter table verification_requests enable row level security;

create policy "users_read_own_verification" on verification_requests
  for select using (auth.uid() = user_id);

create policy "users_upsert_own_verification" on verification_requests
  for insert with check (auth.uid() = user_id);

create policy "users_update_own_verification" on verification_requests
  for update using (auth.uid() = user_id);

-- RLS: anyone can read registry (needed for client-side fuzzy match)
alter table society_registry enable row level security;

create policy "public_read_registry" on society_registry
  for select using (true);

-- Seed: sample UNSW societies
insert into society_registry (name, type, email_domain, aliases) values
  ('Arc @ UNSW', 'Community', 'arc.unsw.edu.au', '{"Arc"}'),
  ('Computer Science and Engineering Society', 'Tech', 'cse.unsw.edu.au', '{"CSESoc", "CSE Society"}'),
  ('UNSW Data Science Society', 'Tech', null, '{"DataSoc", "Data Science Society"}'),
  ('UNSW Medicine Society', 'Faculty', null, '{"MedSoc", "Medicine Society"}'),
  ('UNSW Law Society', 'Faculty', null, '{"LawSoc", "Law Society"}'),
  ('UNSW Business Society', 'Business', null, '{"BizSoc", "Business Society"}'),
  ('UNSW Engineering Society', 'Faculty', null, '{"EngSoc", "Engineering Society"}'),
  ('UNSW Science Society', 'Faculty', null, '{"SciSoc", "Science Society"}'),
  ('UNSW Arts Society', 'Arts', null, '{"ArtsSoc"}'),
  ('UNSW Finance and Investment Society', 'Business', null, '{"FinSoc", "Finance Society"}'),
  ('UNSW Consulting Society', 'Professional', null, '{"ConsultSoc"}'),
  ('UNSW Robotics Society', 'Tech', null, '{"RoboSoc", "Robotics Club"}'),
  ('UNSW Environmental Society', 'Environment', null, '{"EnviroSoc"}'),
  ('UNSW Cultural Society', 'Cultural', null, '{}'),
  ('UNSW Photography Society', 'Hobby', null, '{"PhotoSoc"}'),
  ('UNSW Film Society', 'Arts', null, '{"FilmSoc"}'),
  ('UNSW Debating Society', 'Community', null, '{"DebateSoc"}'),
  ('UNSW Gaming Society', 'Hobby', null, '{"GamingSoc"}'),
  ('UNSW Music Society', 'Arts', null, '{"MusicSoc"}'),
  ('UNSW Basketball Society', 'Sports', null, '{"BasketballSoc"}'),
  ('UNSW Soccer Society', 'Sports', null, '{"SoccerSoc"}'),
  ('No Code Society', 'Tech', null, '{"NoCode"}'),
  ('Women in Engineering Society', 'Community', null, '{"WIE", "Women in Eng"}'),
  ('UNSW AI Society', 'Tech', null, '{"AISoc", "Artificial Intelligence Society"}')
on conflict do nothing;
