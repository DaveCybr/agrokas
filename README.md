# AgroKas — POS Toko Pertanian

Sistem kasir khusus toko pertanian (pupuk, pestisida, benih, alat tani) berbasis web.

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS v3
- **State**: Zustand (cart & auth)
- **Server state**: TanStack Query v5
- **Database & Auth**: Supabase (PostgreSQL + RLS)
- **Print**: QZ Tray (ESC/POS via USB)
- **Router**: React Router v7

## Setup

### 1. Clone & install

```bash
npm install
```

### 2. Environment variables

Buat file `.env` dari template:

```bash
cp .env.example .env
```

Isi dengan kredensial Supabase kamu:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Setup database

Jalankan file `agrokas_schema.sql` di **Supabase Dashboard → SQL Editor**.
File ini berisi:
- 8 tabel lengkap dengan trigger & RLS
- 4 view untuk laporan
- Seed data (17 produk, 5 pelanggan)

### 4. Buat akun kasir

Di Supabase Dashboard → **Authentication → Users → Invite user**,
buat akun email untuk kasir.

### 5. Jalankan dev server

```bash
npm run dev
```

Buka `http://localhost:5173`, login dengan akun kasir.

## Build & Deploy ke cPanel

```bash
npm run build
```

Upload seluruh isi folder `dist/` ke `public_html/` (atau subdirectory).

Tambahkan file `.htaccess` untuk SPA routing:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QR,L]
```

## Print Struk (QZ Tray)

1. Download & install QZ Tray: https://qz.io/download
2. Pastikan QZ Tray berjalan di background (lihat system tray)
3. Aktifkan tag script di `index.html`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.js"></script>
   ```
4. Set nama printer di **Pengaturan → Konfigurasi Printer**

Jika QZ Tray tidak aktif, struk otomatis fallback ke `window.print()`.

## Struktur Project

```
src/
├── components/
│   ├── kasir/
│   │   ├── ProductGrid.tsx   # Grid produk + filter kategori + search
│   │   └── CartPanel.tsx     # Keranjang + pembayaran + kembalian
│   ├── layout/
│   │   ├── AppLayout.tsx     # Layout utama dengan sidebar
│   │   └── Sidebar.tsx       # Navigasi sidebar
│   └── ui/
│       ├── Badge.tsx
│       ├── EmptyState.tsx
│       └── Spinner.tsx
├── hooks/
│   ├── useProducts.ts        # Fetch produk & kategori dari Supabase
│   ├── useCustomers.ts       # Fetch pelanggan & hutang
│   └── useSettings.ts        # Fetch konfigurasi toko
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── printer.ts            # QZ Tray ESC/POS + fallback print
│   └── utils.ts              # formatRupiah, getInitials, dll
├── pages/
│   ├── KasirPage.tsx         # Halaman kasir utama
│   ├── ProdukPage.tsx        # Manajemen produk
│   ├── PelangganPage.tsx     # Manajemen pelanggan
│   ├── LaporanPage.tsx       # Laporan & dashboard
│   ├── PengaturanPage.tsx    # Pengaturan toko & printer
│   └── LoginPage.tsx         # Halaman login
├── store/
│   ├── authStore.ts          # Zustand: auth state
│   └── cartStore.ts          # Zustand: cart, diskon, pembayaran
└── types/
    └── index.ts              # TypeScript interfaces
```

## Fitur Utama

- **Kasir**: product grid, cart, multi-metode bayar, kembalian otomatis, nominal cepat
- **Print**: ESC/POS thermal via QZ Tray, fallback window.print()
- **Stok**: berkurang otomatis saat transaksi via Supabase trigger
- **Hutang**: saldo otomatis naik/turun via trigger DB
- **Laporan**: v_daily_summary, v_top_products, v_low_stock, v_outstanding_debt
