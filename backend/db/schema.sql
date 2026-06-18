create extension if not exists pgcrypto;

do $$
begin
  create type auction_status as enum ('draft', 'live', 'ended', 'sold');
exception
  when duplicate_object then null;
end $$;

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  legal_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'member',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  sku text not null unique,
  part_number text not null,
  manufacturer text not null,
  title text not null,
  description text not null default '',
  quantity integer not null check (quantity >= 0),
  unit_condition text not null default 'unknown',
  location text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists auctions (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references inventory(id) on delete restrict,
  created_by_user_id uuid references users(id) on delete set null,
  title text not null,
  part_number text not null,
  manufacturer text not null,
  quantity integer not null check (quantity > 0),
  starting_price numeric(12, 2) not null check (starting_price >= 0),
  reserve_price numeric(12, 2),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status auction_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table if not exists bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references auctions(id) on delete cascade,
  bidder_company_id uuid not null references companies(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  timestamp timestamptz not null default now()
);

create index if not exists users_company_id_idx on users(company_id);
create index if not exists inventory_company_id_idx on inventory(company_id);
create index if not exists auctions_inventory_id_idx on auctions(inventory_id);
create index if not exists auctions_status_idx on auctions(status);
create index if not exists bids_auction_id_timestamp_idx on bids(auction_id, timestamp desc);
create index if not exists bids_bidder_company_id_idx on bids(bidder_company_id);
create unique index if not exists auctions_inventory_unique on auctions(inventory_id);

drop trigger if exists companies_touch_updated_at on companies;
create trigger companies_touch_updated_at
before update on companies
for each row execute function touch_updated_at();

drop trigger if exists users_touch_updated_at on users;
create trigger users_touch_updated_at
before update on users
for each row execute function touch_updated_at();

drop trigger if exists inventory_touch_updated_at on inventory;
create trigger inventory_touch_updated_at
before update on inventory
for each row execute function touch_updated_at();

drop trigger if exists auctions_touch_updated_at on auctions;
create trigger auctions_touch_updated_at
before update on auctions
for each row execute function touch_updated_at();
