-- Standalone application schema derived from the supplied Supabase migrations.
-- Supabase Auth, Realtime, Storage, roles, and RLS are intentionally omitted:
-- access control is enforced by the Node API.

create extension if not exists pgcrypto;

create type rider_availability as enum ('available', 'on_delivery', 'offline');
create type delivery_order_status as enum ('pending_dispatch', 'dispatched', 'delivered', 'cancelled');

create table grocery_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table grocery_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references grocery_categories(id),
  sku text not null unique check (sku ~ '^[A-Z0-9-]+$'),
  name text not null,
  description text not null,
  unit text not null,
  price_cents integer not null check (price_cents >= 0),
  image_path text not null unique,
  image_url text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table inventory (
  grocery_item_id uuid primary key references grocery_items(id) on delete cascade,
  quantity_available integer not null check (quantity_available >= 0),
  reorder_level integer not null default 5 check (reorder_level >= 0),
  updated_at timestamptz not null default now()
);

create table delivery_riders (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  vehicle_type text not null check (vehicle_type in ('bicycle', 'motorbike', 'scooter', 'van')),
  service_area text not null,
  availability rider_availability not null default 'offline',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_quotes (
  id uuid primary key default gen_random_uuid(),
  grocery_item_id uuid not null references grocery_items(id),
  quantity integer not null check (quantity between 1 and 100),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  available_quantity integer not null check (available_quantity >= 0),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (consumed_at is null or consumed_at >= created_at)
);

create table delivery_orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null unique,
  quote_id uuid unique references order_quotes(id),
  grocery_item_id uuid not null references grocery_items(id),
  rider_id uuid references delivery_riders(id),
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  customer_name text not null,
  delivery_address text not null,
  customer_note text,
  status delivery_order_status not null default 'pending_dispatch',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz,
  check ((status = 'delivered') = (delivered_at is not null)),
  check ((status in ('dispatched', 'delivered')) = (rider_id is not null))
);

create index delivery_orders_status_created_at_idx on delivery_orders (status, created_at desc);
create index delivery_orders_grocery_item_id_idx on delivery_orders (grocery_item_id);
create index delivery_orders_rider_id_idx on delivery_orders (rider_id);
create index order_quotes_expires_at_idx on order_quotes (expires_at) where consumed_at is null;
create index order_quotes_grocery_item_id_idx on order_quotes (grocery_item_id);

create function set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger grocery_items_set_updated_at
before update on grocery_items for each row execute function set_updated_at();
create trigger inventory_set_updated_at
before update on inventory for each row execute function set_updated_at();
create trigger delivery_riders_set_updated_at
before update on delivery_riders for each row execute function set_updated_at();
create trigger delivery_orders_set_updated_at
before update on delivery_orders for each row execute function set_updated_at();
