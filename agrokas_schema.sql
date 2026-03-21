-- ============================================================
--  AgroKas POS — Database Schema
--  Supabase / PostgreSQL
--  Jalankan di: Supabase Dashboard > SQL Editor
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Helper: updated_at auto-update ──────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ==============================================================
--  1. SETTINGS — konfigurasi toko
-- ==============================================================
create table settings (
  id               uuid primary key default uuid_generate_v4(),
  nama_toko        text not null default 'Toko Tani Makmur',
  alamat           text,
  telp             text,
  footer_nota      text default 'Terima kasih atas kunjungan Anda',
  paper_width      smallint default 58,        -- 58 atau 80 (mm)
  printer_name     text,                        -- nama printer di QZ Tray
  logo_url         text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create trigger trg_settings_updated_at
  before update on settings
  for each row execute function set_updated_at();

-- ─── seed ─────────────────────────────────────────────────────
insert into settings (nama_toko, alamat, telp, footer_nota)
values (
  'Toko Tani Makmur',
  'Jl. Raya Sukowono No. 12, Jember',
  '0812-3456-7890',
  'Terima kasih! Barang yang sudah dibeli tidak dapat dikembalikan.'
);

-- ==============================================================
--  2. CATEGORIES — kategori produk
-- ==============================================================
create table categories (
  id          uuid primary key default uuid_generate_v4(),
  nama        text not null,
  icon        text,                             -- emoji atau nama icon
  urutan      smallint default 0,
  created_at  timestamptz default now()
);

-- ─── seed ─────────────────────────────────────────────────────
insert into categories (nama, icon, urutan) values
  ('Pupuk',     '🌾', 1),
  ('Pestisida', '🧪', 2),
  ('Benih',     '🌱', 3),
  ('Alat Tani', '⚒️',  4),
  ('Lainnya',   '📦', 5);

-- ==============================================================
--  3. PRODUCTS — master produk
-- ==============================================================
create table products (
  id                 uuid primary key default uuid_generate_v4(),
  category_id        uuid references categories(id) on delete set null,
  kode               text unique,               -- kode/barcode produk
  nama               text not null,
  satuan             text not null default 'pcs', -- kg, liter, sachet, karung, botol, pcs
  harga_beli         numeric(12,2) default 0,   -- HPP
  harga_jual         numeric(12,2) not null,     -- harga eceran
  harga_grosir       numeric(12,2),              -- harga grosir (opsional)
  min_grosir         integer,                    -- min qty untuk harga grosir
  stok               numeric(12,2) default 0,
  stok_minimum       numeric(12,2) default 5,   -- threshold alert stok kritis
  no_registrasi      text,                       -- nomor izin Kementan (pestisida)
  expired_date       date,                       -- untuk pestisida & benih
  deskripsi          text,
  aktif              boolean default true,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create index idx_products_category on products(category_id);
create index idx_products_kode on products(kode);
create index idx_products_aktif on products(aktif);

create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ─── seed produk ──────────────────────────────────────────────
do $$
declare
  cat_pupuk     uuid;
  cat_pest      uuid;
  cat_benih     uuid;
  cat_alat      uuid;
begin
  select id into cat_pupuk  from categories where nama = 'Pupuk'     limit 1;
  select id into cat_pest   from categories where nama = 'Pestisida' limit 1;
  select id into cat_benih  from categories where nama = 'Benih'     limit 1;
  select id into cat_alat   from categories where nama = 'Alat Tani' limit 1;

  insert into products
    (category_id, kode, nama, satuan, harga_beli, harga_jual, harga_grosir, min_grosir, stok, stok_minimum)
  values
    -- Pupuk
    (cat_pupuk, 'PUP-001', 'Urea Pusri 50kg',      'karung', 255000, 285000, 270000, 10, 42, 5),
    (cat_pupuk, 'PUP-002', 'NPK Phonska 50kg',     'karung', 290000, 320000, 305000, 10, 28, 5),
    (cat_pupuk, 'PUP-003', 'ZA 50kg',              'karung', 155000, 175000, null,   null, 3,  5),
    (cat_pupuk, 'PUP-004', 'Petroganik 40kg',      'karung',  38000,  45000, null,   null, 60, 10),
    (cat_pupuk, 'PUP-005', 'SP-36 50kg',           'karung', 230000, 260000, null,   null, 15, 5),
    -- Pestisida
    (cat_pest,  'PST-001', 'Dithane M-45',         'kg',      82000,  95000, null,   null, 15, 3),
    (cat_pest,  'PST-002', 'Roundup 1L',           'botol',   60000,  72000, null,   null, 22, 5),
    (cat_pest,  'PST-003', 'Decis 25EC 100ml',     'botol',   58000,  68000, null,   null,  8, 3),
    (cat_pest,  'PST-004', 'Curater 3G 1kg',       'kg',      48000,  56000, null,   null,  2, 3),
    (cat_pest,  'PST-005', 'Regent 50SC 100ml',    'botol',   45000,  55000, null,   null, 12, 3),
    -- Benih
    (cat_benih, 'BNH-001', 'Benih Padi IR-64',    'kg',      12000,  14500, 13500,  50, 120, 20),
    (cat_benih, 'BNH-002', 'Benih Jagung NK-22',  'sachet',  42000,  48000, null,   null,  35, 5),
    (cat_benih, 'BNH-003', 'Benih Cabai TM-999',  'sachet',  56000,  65000, null,   null,  18, 5),
    (cat_benih, 'BNH-004', 'Benih Tomat Servo',   'sachet',  48000,  55000, null,   null,  10, 3),
    -- Alat Tani
    (cat_alat,  'ALT-001', 'Cangkul Tajam',       'pcs',     70000,  85000, null,   null,   7, 2),
    (cat_alat,  'ALT-002', 'Sprayer Elektrik 16L','pcs',     285000, 320000, null,   null,   4, 1),
    (cat_alat,  'ALT-003', 'Sabit Bergerigi',     'pcs',      28000,  35000, null,   null,  15, 3);
end $$;

-- ==============================================================
--  4. CUSTOMERS — master pelanggan
-- ==============================================================
create table customers (
  id              uuid primary key default uuid_generate_v4(),
  nama            text not null,
  telp            text,
  alamat          text,
  desa            text,
  kecamatan       text,
  tipe            text default 'petani'   -- petani | agen | poktan
                    check (tipe in ('petani','agen','poktan')),
  luas_lahan      numeric(8,2),           -- hektar (opsional)
  komoditas       text,                   -- padi, jagung, cabai, dll
  limit_kredit    numeric(12,2) default 0,
  saldo_hutang    numeric(12,2) default 0, -- hutang berjalan (+ = hutang)
  aktif           boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_customers_nama on customers(nama);
create index idx_customers_tipe on customers(tipe);

create trigger trg_customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

-- ─── seed pelanggan ───────────────────────────────────────────
insert into customers (nama, telp, desa, kecamatan, tipe, luas_lahan, komoditas, limit_kredit, saldo_hutang)
values
  ('Pak Karno',      '081234560001', 'Sukowono',  'Sukowono',  'petani', 2.0,  'Padi',  5000000, 1450000),
  ('Bu Hartini',     '081234560002', 'Ledokombo', 'Ledokombo', 'petani', 1.5,  'Jagung',3000000, 0),
  ('Pak Slamet',     '081234560003', 'Kalisat',   'Kalisat',   'petani', 0.75, 'Cabai', 2000000, 750000),
  ('Poktan Makmur',  '081234560004', 'Sukowono',  'Sukowono',  'poktan', 12.0, 'Padi', 20000000, 3200000),
  ('CV Agro Jaya',   '081234560005', 'Jember',    'Patrang',   'agen',   null,  null,  50000000, 0);

-- ==============================================================
--  5. TRANSACTIONS — header transaksi penjualan
-- ==============================================================
create table transactions (
  id              uuid primary key default uuid_generate_v4(),
  no_transaksi    text unique not null,         -- TRX-250601-1234
  customer_id     uuid references customers(id) on delete set null,
  kasir           text not null default 'Kasir',
  subtotal        numeric(12,2) not null default 0,
  diskon_persen   numeric(5,2) default 0,       -- 0–100
  diskon_nominal  numeric(12,2) default 0,
  total           numeric(12,2) not null default 0,
  metode_bayar    text not null default 'Tunai'
                    check (metode_bayar in ('Tunai','Transfer','QRIS','DP','Hutang')),
  uang_diterima   numeric(12,2) default 0,
  kembalian       numeric(12,2) default 0,
  status          text default 'selesai'
                    check (status in ('selesai','ditahan','batal')),
  catatan         text,
  created_at      timestamptz default now()
);

create index idx_transactions_customer   on transactions(customer_id);
create index idx_transactions_created_at on transactions(created_at);
create index idx_transactions_status     on transactions(status);
create index idx_transactions_no         on transactions(no_transaksi);

-- ─── Auto-generate no_transaksi ───────────────────────────────
create or replace function generate_no_transaksi()
returns trigger as $$
declare
  tgl  text;
  seq  integer;
  kode text;
begin
  tgl := to_char(now(), 'YYMMDD');
  select count(*) + 1 into seq
    from transactions
    where no_transaksi like 'TRX-' || tgl || '-%';
  kode := 'TRX-' || tgl || '-' || lpad(seq::text, 4, '0');
  new.no_transaksi := kode;
  return new;
end;
$$ language plpgsql;

create trigger trg_auto_no_transaksi
  before insert on transactions
  for each row
  when (new.no_transaksi is null or new.no_transaksi = '')
  execute function generate_no_transaksi();

-- ==============================================================
--  6. TRANSACTION_ITEMS — detail item per transaksi
-- ==============================================================
create table transaction_items (
  id              uuid primary key default uuid_generate_v4(),
  transaction_id  uuid not null references transactions(id) on delete cascade,
  product_id      uuid references products(id) on delete set null,
  nama_produk     text not null,               -- snapshot nama saat transaksi
  satuan          text not null,
  harga_beli      numeric(12,2) default 0,     -- snapshot HPP
  harga_jual      numeric(12,2) not null,      -- snapshot harga jual
  qty             numeric(12,2) not null,
  subtotal        numeric(12,2) not null,      -- qty * harga_jual
  created_at      timestamptz default now()
);

create index idx_trx_items_transaction on transaction_items(transaction_id);
create index idx_trx_items_product     on transaction_items(product_id);

-- ─── Trigger: update stok & saldo hutang setelah transaksi ───
create or replace function after_transaction_insert()
returns trigger as $$
begin
  -- Kurangi stok setiap item
  update products
    set stok = stok - i.qty
    from transaction_items i
    where i.transaction_id = new.id
      and products.id = i.product_id;

  -- Tambah saldo hutang jika metode = Hutang
  if new.metode_bayar = 'Hutang' and new.customer_id is not null then
    update customers
      set saldo_hutang = saldo_hutang + new.total
      where id = new.customer_id;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_after_transaction_insert
  after insert on transactions
  for each row execute function after_transaction_insert();

-- ==============================================================
--  7. DEBT_PAYMENTS — pembayaran hutang pelanggan
-- ==============================================================
create table debt_payments (
  id           uuid primary key default uuid_generate_v4(),
  customer_id  uuid not null references customers(id) on delete cascade,
  jumlah       numeric(12,2) not null,
  metode       text default 'Tunai'
                 check (metode in ('Tunai','Transfer','QRIS')),
  catatan      text,
  kasir        text,
  created_at   timestamptz default now()
);

create index idx_debt_payments_customer on debt_payments(customer_id);

-- ─── Trigger: kurangi saldo hutang saat pembayaran ────────────
create or replace function after_debt_payment_insert()
returns trigger as $$
begin
  update customers
    set saldo_hutang = greatest(0, saldo_hutang - new.jumlah)
    where id = new.customer_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_after_debt_payment
  after insert on debt_payments
  for each row execute function after_debt_payment_insert();

-- ==============================================================
--  8. STOCK_ADJUSTMENTS — stok opname & koreksi manual
-- ==============================================================
create table stock_adjustments (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete cascade,
  stok_lama   numeric(12,2) not null,
  stok_baru   numeric(12,2) not null,
  selisih     numeric(12,2) generated always as (stok_baru - stok_lama) stored,
  alasan      text,          -- rusak | hilang | koreksi | retur
  kasir       text,
  created_at  timestamptz default now()
);

-- ─── Trigger: terapkan stok baru ke products ─────────────────
create or replace function after_stock_adjustment()
returns trigger as $$
begin
  update products set stok = new.stok_baru
    where id = new.product_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_after_stock_adjustment
  after insert on stock_adjustments
  for each row execute function after_stock_adjustment();

-- ==============================================================
--  9. VIEWS — untuk laporan & dashboard
-- ==============================================================

-- Ringkasan penjualan harian
create or replace view v_daily_summary as
select
  date_trunc('day', created_at)::date  as tanggal,
  count(*)                              as jumlah_transaksi,
  sum(total)                            as omzet,
  sum(diskon_nominal)                   as total_diskon,
  sum(
    (select sum(ti.qty * (ti.harga_jual - ti.harga_beli))
     from transaction_items ti
     where ti.transaction_id = t.id)
  )                                     as laba_kotor
from transactions t
where status = 'selesai'
group by date_trunc('day', created_at)::date
order by tanggal desc;

-- Produk terlaris
create or replace view v_top_products as
select
  p.id,
  p.nama,
  p.satuan,
  c.nama        as kategori,
  sum(ti.qty)   as total_qty_terjual,
  sum(ti.subtotal) as total_omzet
from transaction_items ti
join products p on p.id = ti.product_id
left join categories c on c.id = p.category_id
join transactions t on t.id = ti.transaction_id
where t.status = 'selesai'
group by p.id, p.nama, p.satuan, c.nama
order by total_qty_terjual desc;

-- Stok kritis (di bawah stok_minimum)
create or replace view v_low_stock as
select
  p.id,
  p.kode,
  p.nama,
  p.satuan,
  p.stok,
  p.stok_minimum,
  c.nama as kategori
from products p
left join categories c on c.id = p.category_id
where p.stok <= p.stok_minimum
  and p.aktif = true
order by p.stok asc;

-- Hutang pelanggan aktif
create or replace view v_outstanding_debt as
select
  c.id,
  c.nama,
  c.telp,
  c.desa,
  c.tipe,
  c.saldo_hutang,
  c.limit_kredit,
  (c.limit_kredit - c.saldo_hutang) as sisa_limit,
  (select max(t.created_at)
   from transactions t
   where t.customer_id = c.id
     and t.metode_bayar = 'Hutang') as hutang_terakhir
from customers c
where c.saldo_hutang > 0
  and c.aktif = true
order by c.saldo_hutang desc;

-- ==============================================================
--  10. ROW LEVEL SECURITY
-- ==============================================================

alter table settings          enable row level security;
alter table categories        enable row level security;
alter table products          enable row level security;
alter table customers         enable row level security;
alter table transactions      enable row level security;
alter table transaction_items enable row level security;
alter table debt_payments     enable row level security;
alter table stock_adjustments enable row level security;

-- Policy: semua authenticated user bisa baca & tulis
-- (single-tenant — semua kasir di toko yang sama)
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'settings','categories','products','customers',
    'transactions','transaction_items','debt_payments','stock_adjustments'
  ] loop
    execute format('
      create policy "authenticated full access" on %I
        for all to authenticated using (true) with check (true);
    ', tbl);
  end loop;
end $$;
