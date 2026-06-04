do $$ begin
  create type order_status as enum ('Pending', 'Cooking', 'Ready', 'Collected', 'Delivered');
exception
  when duplicate_object then null;
end $$;

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  vendor_user_id uuid not null references vendor_profiles(user_id) on delete cascade,
  name text not null,
  description text not null default '',
  image text not null default '🍽️',
  price numeric(10, 2) not null check (price >= 0),
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default ('KV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  customer_user_id uuid not null references users(id) on delete cascade,
  vendor_user_id uuid references vendor_profiles(user_id) on delete set null,
  vendor_name text not null,
  delivery_address text not null,
  payment_method text not null default 'cash',
  status order_status not null default 'Pending',
  total numeric(10, 2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  name text not null,
  qty integer not null check (qty > 0),
  price numeric(10, 2) not null check (price >= 0)
);

create index if not exists menu_items_vendor_user_id_idx on menu_items(vendor_user_id);
create index if not exists orders_customer_user_id_idx on orders(customer_user_id);
create index if not exists orders_vendor_user_id_idx on orders(vendor_user_id);
create index if not exists order_items_order_id_idx on order_items(order_id);
