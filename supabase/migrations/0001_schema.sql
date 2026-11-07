-- Vynt — schema, RLS e funções de pedido
-- Valores monetários sempre em centavos (integer).

create extension if not exists pgcrypto;

-- ───────────────────────── Perfis e papéis ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Impede o próprio usuário de se promover a admin
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'role não pode ser alterado';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ───────────────────────── Catálogo ─────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  sort int not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category_id uuid not null references public.categories (id),
  short_description text not null default '',
  story text not null default '',
  care text not null default '',
  price_cents int not null check (price_cents > 0),
  compare_at_cents int check (compare_at_cents is null or compare_at_cents > price_cents),
  badge text check (badge in ('novo', 'mais_vendido')),
  featured boolean not null default false,
  sold_count int not null default 0,
  images text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id) where active;

create table public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color text not null,
  color_hex text not null check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  size int not null check (size between 30 and 48),
  sku text not null unique,
  stock int not null default 0 check (stock >= 0),
  unique (product_id, color, size)
);
create index variants_product_idx on public.variants (product_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  author text not null,
  city text,
  rating int not null check (rating between 1 and 5),
  body text not null,
  photo_url text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_product_idx on public.reviews (product_id) where approved;

create table public.coupons (
  code text primary key check (code = upper(code)),
  kind text not null check (kind in ('percent', 'fixed')),
  value int not null check (value > 0),
  min_subtotal_cents int not null default 0,
  active boolean not null default true,
  expires_at timestamptz
);

create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  city text not null unique,           -- nome normalizado (sem acento, minúsculo)
  label text not null,                 -- nome para exibir
  price_cents int not null check (price_cents >= 0),
  eta text not null
);

-- ───────────────────────── Clientes ─────────────────────────
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null default 'Casa',
  cep text not null check (cep ~ '^[0-9]{8}$'),
  street text not null,
  number text not null,
  complement text,
  district text not null,
  city text not null,
  uf text not null check (uf ~ '^[A-Z]{2}$'),
  created_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);

-- ───────────────────────── Pedidos ─────────────────────────
create type public.order_status as enum (
  'aguardando_pagamento', 'pago', 'separando', 'em_rota', 'pronto_retirada', 'entregue', 'cancelado'
);

create sequence public.order_code_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code int not null unique default nextval('public.order_code_seq'),
  access_token uuid not null default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  phone text not null,
  email text,
  delivery_method text not null check (delivery_method in ('motoboy', 'correios', 'retirada')),
  shipping_service text,
  address jsonb,
  payment_method text not null check (payment_method in ('pix', 'cartao_link', 'whatsapp')),
  status public.order_status not null default 'aguardando_pagamento',
  subtotal_cents int not null,
  discount_cents int not null default 0,
  pix_discount_cents int not null default 0,
  shipping_cents int not null default 0,
  total_cents int not null,
  coupon_code text references public.coupons (code),
  notes text,
  tracking_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id uuid references public.variants (id) on delete set null,
  product_name text not null,
  product_slug text not null,
  image text,
  color text not null,
  size int not null,
  unit_cents int not null,
  qty int not null check (qty between 1 and 10)
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  note text,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);

-- Registra evento a cada mudança de status e devolve estoque ao cancelar
create or replace function public.on_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_events (order_id, status) values (new.id, new.status);
  end if;
  if tg_op = 'UPDATE' and new.status = 'cancelado' and old.status <> 'cancelado' then
    update public.variants v
       set stock = v.stock + i.qty
      from public.order_items i
     where i.order_id = new.id and i.variant_id = v.id;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- BEFORE para poder setar updated_at; o evento de INSERT é gravado no AFTER
create trigger orders_status_before
  before update on public.orders
  for each row execute function public.on_order_status_change();

create or replace function public.on_order_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.order_events (order_id, status) values (new.id, new.status);
  return new;
end;
$$;

create trigger orders_created_after
  after insert on public.orders
  for each row execute function public.on_order_created();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- ───────────────────────── place_order ─────────────────────────
-- Única porta de criação de pedido. Recalcula preço, cupom e estoque no banco.
-- O frete chega já calculado pelo servidor (Server Action com service role);
-- por isso a função só pode ser executada pelo service_role.
create or replace function public.place_order(payload jsonb)
returns table (order_id uuid, order_code int, access_token uuid, total_cents int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_variant record;
  v_subtotal int := 0;
  v_discount int := 0;
  v_pix int := 0;
  v_shipping int := coalesce((payload ->> 'shipping_cents')::int, 0);
  v_coupon public.coupons;
  v_coupon_code text := nullif(upper(trim(payload ->> 'coupon_code')), '');
  v_order public.orders;
  v_pix_pct int := coalesce((payload ->> 'pix_discount_pct')::int, 0);
  v_qty int;
begin
  if jsonb_typeof(payload -> 'items') <> 'array' or jsonb_array_length(payload -> 'items') = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if jsonb_array_length(payload -> 'items') > 20 then
    raise exception 'CART_TOO_LARGE';
  end if;

  -- trava as variações na ordem do id para evitar deadlock
  perform 1 from public.variants
   where id in (select (e ->> 'variant_id')::uuid from jsonb_array_elements(payload -> 'items') e)
   order by id
   for update;

  for v_item in select * from jsonb_array_elements(payload -> 'items') loop
    v_qty := (v_item ->> 'qty')::int;
    if v_qty is null or v_qty < 1 or v_qty > 10 then
      raise exception 'INVALID_QTY';
    end if;

    select v.id, v.stock, v.size, v.color, p.price_cents, p.name, p.slug, p.images[1] as image
      into v_variant
      from public.variants v
      join public.products p on p.id = v.product_id
     where v.id = (v_item ->> 'variant_id')::uuid and p.active;

    if not found then
      raise exception 'VARIANT_NOT_FOUND';
    end if;
    if v_variant.stock < v_qty then
      raise exception 'OUT_OF_STOCK:%', v_variant.id;
    end if;
    v_subtotal := v_subtotal + v_variant.price_cents * v_qty;
  end loop;

  if v_coupon_code is not null then
    select * into v_coupon from public.coupons c
     where c.code = v_coupon_code and c.active
       and (c.expires_at is null or c.expires_at > now());
    if not found or v_subtotal < v_coupon.min_subtotal_cents then
      raise exception 'INVALID_COUPON';
    end if;
    v_discount := case v_coupon.kind
      when 'percent' then (v_subtotal * least(v_coupon.value, 90)) / 100
      else least(v_coupon.value, v_subtotal) end;
  end if;

  if payload ->> 'payment_method' = 'pix' and v_pix_pct between 1 and 20 then
    v_pix := ((v_subtotal - v_discount) * v_pix_pct) / 100;
  end if;

  insert into public.orders (
    user_id, customer_name, phone, email, delivery_method, shipping_service, address,
    payment_method, subtotal_cents, discount_cents, pix_discount_cents, shipping_cents,
    total_cents, coupon_code, notes
  ) values (
    nullif(payload ->> 'user_id', '')::uuid,
    left(payload ->> 'customer_name', 120),
    left(payload ->> 'phone', 20),
    nullif(left(payload ->> 'email', 160), ''),
    payload ->> 'delivery_method',
    nullif(payload ->> 'shipping_service', ''),
    payload -> 'address',
    payload ->> 'payment_method',
    v_subtotal, v_discount, v_pix, v_shipping,
    v_subtotal - v_discount - v_pix + v_shipping,
    case when v_coupon_code is not null then v_coupon_code end,
    nullif(left(payload ->> 'notes', 500), '')
  ) returning * into v_order;

  for v_item in select * from jsonb_array_elements(payload -> 'items') loop
    v_qty := (v_item ->> 'qty')::int;
    update public.variants set stock = stock - v_qty
     where id = (v_item ->> 'variant_id')::uuid;

    insert into public.order_items (order_id, variant_id, product_name, product_slug, image, color, size, unit_cents, qty)
    select v_order.id, v.id, p.name, p.slug, p.images[1], v.color, v.size, p.price_cents, v_qty
      from public.variants v join public.products p on p.id = v.product_id
     where v.id = (v_item ->> 'variant_id')::uuid;

    update public.products p set sold_count = sold_count + v_qty
      from public.variants v
     where v.id = (v_item ->> 'variant_id')::uuid and p.id = v.product_id;
  end loop;

  return query select v_order.id, v_order.code, v_order.access_token, v_order.total_cents;
end;
$$;

revoke all on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;

-- ───────────────────────── RLS ─────────────────────────
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.variants enable row level security;
alter table public.reviews enable row level security;
alter table public.coupons enable row level security;
alter table public.shipping_zones enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

-- perfis
create policy "perfil: dono lê" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "perfil: dono edita" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- catálogo público (só ativo), admin tudo
create policy "categorias: leitura pública" on public.categories for select using (true);
create policy "categorias: admin" on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "produtos: leitura pública" on public.products for select
  using (active or (select public.is_admin()));
create policy "produtos: admin" on public.products for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "variações: leitura pública" on public.variants for select using (true);
create policy "variações: admin" on public.variants for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "avaliações: aprovadas públicas" on public.reviews for select
  using (approved or (select public.is_admin()));
create policy "avaliações: admin" on public.reviews for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "cupons: admin" on public.coupons for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "frete: leitura pública" on public.shipping_zones for select using (true);
create policy "frete: admin" on public.shipping_zones for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- endereços: só o dono
create policy "endereços: dono" on public.addresses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- pedidos: dono lê, admin lê e atualiza; criação só via place_order (service_role)
create policy "pedidos: dono lê" on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "pedidos: admin atualiza" on public.orders for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "itens: dono lê" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.user_id = (select auth.uid()) or (select public.is_admin()))));

create policy "eventos: dono lê" on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and (o.user_id = (select auth.uid()) or (select public.is_admin()))));

-- Realtime para o status do pedido (respeita RLS)
alter publication supabase_realtime add table public.orders, public.order_events;

-- Storage: fotos de produto (leitura pública, escrita admin)
insert into storage.buckets (id, name, public) values ('produtos', 'produtos', true)
  on conflict (id) do nothing;
create policy "fotos: admin escreve" on storage.objects for insert to authenticated
  with check (bucket_id = 'produtos' and (select public.is_admin()));
create policy "fotos: admin atualiza" on storage.objects for update to authenticated
  using (bucket_id = 'produtos' and (select public.is_admin()));
create policy "fotos: admin apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'produtos' and (select public.is_admin()));
