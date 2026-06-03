create extension if not exists pgcrypto;

do $$ begin
  create type user_role as enum ('customer', 'vendor');
exception
  when duplicate_object then null;
end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  role user_role not null,
  name text not null check (char_length(name) >= 2),
  email text not null unique,
  phone text not null unique,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customer_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  default_address_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists vendor_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  business_name text not null,
  slug text unique,
  description text,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  label text not null default 'Home',
  line1 text not null,
  line2 text,
  city text,
  notes text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_at timestamptz not null default now()
);

do $$ begin
  alter table customer_profiles
    add constraint customer_profiles_default_address_fk
    foreign key (default_address_id) references addresses(id)
    deferrable initially deferred;
exception
  when duplicate_object then null;
end $$;

create index if not exists users_role_idx on users(role);
create index if not exists addresses_user_id_idx on addresses(user_id);
