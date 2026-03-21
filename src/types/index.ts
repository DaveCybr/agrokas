export interface Category {
  id: string
  nama: string
  icon: string
  urutan: number
}

export interface Product {
  id: string
  category_id: string | null
  kode: string | null
  nama: string
  satuan: string
  harga_beli: number
  harga_jual: number
  harga_grosir: number | null
  min_grosir: number | null
  stok: number
  stok_minimum: number
  no_registrasi: string | null
  expired_date: string | null
  deskripsi: string | null
  aktif: boolean
  categories?: Category
}

export interface Customer {
  id: string
  nama: string
  telp: string | null
  alamat: string | null
  desa: string | null
  kecamatan: string | null
  tipe: 'petani' | 'agen' | 'poktan'
  luas_lahan: number | null
  komoditas: string | null
  limit_kredit: number
  saldo_hutang: number
  aktif: boolean
}

export interface CartItem {
  product: Product
  qty: number
  harga_jual: number
}

export interface HeldTransaction {
  id: string
  label: string
  items: CartItem[]
  customer: Customer | null
  diskonPersen: number
  metodeBayar: MetodeBayar
  heldAt: Date
  subtotal: number
  total: number
}

export type MetodeBayar = 'Tunai' | 'Transfer' | 'QRIS' | 'DP' | 'Hutang'
export type StatusTransaksi = 'selesai' | 'ditahan' | 'batal'

export interface Transaction {
  id: string
  no_transaksi: string
  customer_id: string | null
  kasir: string
  subtotal: number
  diskon_persen: number
  diskon_nominal: number
  total: number
  metode_bayar: MetodeBayar
  uang_diterima: number
  kembalian: number
  status: StatusTransaksi
  catatan: string | null
  created_at: string
  customers?: Customer
  transaction_items?: TransactionItem[]
}

export interface TransactionItem {
  id: string
  transaction_id: string
  product_id: string | null
  nama_produk: string
  satuan: string
  harga_beli: number
  harga_jual: number
  qty: number
  subtotal: number
}

export interface Settings {
  id: string
  nama_toko: string
  alamat: string | null
  telp: string | null
  footer_nota: string | null
  paper_width: number
  printer_name: string | null
  logo_url: string | null
}

export interface DailySummary {
  tanggal: string
  jumlah_transaksi: number
  omzet: number
  total_diskon: number
  laba_kotor: number
}

export interface TopProduct {
  id: string
  nama: string
  satuan: string
  kategori: string
  total_qty_terjual: number
  total_omzet: number
}

export interface DateRange {
  from: Date
  to: Date
}

export interface Supplier {
  id: string
  nama: string
  kontak: string | null
  telp: string | null
  alamat: string | null
  kota: string | null
  produk_supply: string | null
  saldo_hutang: number
  aktif: boolean
  created_at: string
}

export type POStatus = 'draft' | 'dikirim' | 'sebagian' | 'selesai' | 'batal'

export interface PurchaseOrder {
  id: string
  no_po: string
  supplier_id: string
  status: POStatus
  total_po: number
  catatan: string | null
  tanggal_po: string
  tanggal_kirim: string | null
  created_at: string
  suppliers?: Supplier
  purchase_order_items?: POItem[]
}

export interface POItem {
  id: string
  po_id: string
  product_id: string | null
  nama_produk: string
  satuan: string
  qty_pesan: number
  qty_diterima: number
  harga_beli: number
  subtotal: number
}

export interface GoodsReceipt {
  id: string
  no_terima: string
  po_id: string | null
  supplier_id: string
  tanggal: string
  total: number
  metode_bayar: 'Tunai' | 'Transfer' | 'Hutang'
  catatan: string | null
  created_at: string
  suppliers?: Supplier
  goods_receipt_items?: GRItem[]
}

export interface GRItem {
  id: string
  gr_id: string
  product_id: string | null
  po_item_id: string | null
  nama_produk: string
  satuan: string
  qty_diterima: number
  harga_beli: number
  subtotal: number
}
