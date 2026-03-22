import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DailySummary, TopProduct } from '@/types'

export function usePembelian(from: string, to: string) {
  return useQuery({
    queryKey: ['laporan-pembelian', from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goods_receipts')
        .select('*, suppliers(id,nama), goods_receipt_items(qty_diterima, harga_beli, subtotal, nama_produk)')
        .gte('tanggal', from)
        .lte('tanggal', to)
        .order('tanggal', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
  })
}

export function useArusKas(from: string, to: string) {
  return useQuery({
    queryKey: ['laporan-arus-kas', from, to],
    queryFn: async () => {
      const [trxRes, grRes, payRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('created_at, total, metode_bayar')
          .gte('created_at', from)
          .lte('created_at', to + 'T23:59:59')
          .eq('status', 'selesai')
          .order('created_at'),
        supabase
          .from('goods_receipts')
          .select('tanggal, total, metode_bayar')
          .gte('tanggal', from)
          .lte('tanggal', to)
          .order('tanggal'),
        supabase
          .from('supplier_payments')
          .select('created_at, jumlah, metode')
          .gte('created_at', from)
          .lte('created_at', to + 'T23:59:59')
          .order('created_at'),
      ])
      if (trxRes.error) throw trxRes.error
      if (grRes.error) throw grRes.error
      if (payRes.error) throw payRes.error
      return {
        penjualan: trxRes.data ?? [],
        pembelian: grRes.data ?? [],
        pembayaranHutang: payRes.data ?? [],
      }
    },
    staleTime: 60_000,
  })
}

export function useMarginProduk() {
  return useQuery({
    queryKey: ['laporan-margin-produk'],
    queryFn: async () => {
      // Fetch transaction_items joined with product info to compute margin
      const { data, error } = await supabase
        .from('transaction_items')
        .select('nama_produk, qty, harga_jual, harga_beli, subtotal, transactions!inner(status)')
        .eq('transactions.status', 'selesai')
      if (error) throw error

      // Aggregate per product
      const map: Record<string, { nama: string; qty: number; omzet: number; hpp: number }> = {}
      for (const item of data ?? []) {
        const key = item.nama_produk
        if (!map[key]) map[key] = { nama: item.nama_produk, qty: 0, omzet: 0, hpp: 0 }
        map[key].qty   += Number(item.qty)
        map[key].omzet += Number(item.subtotal)
        map[key].hpp   += Number(item.harga_beli) * Number(item.qty)
      }
      return Object.values(map).sort((a, b) => b.omzet - a.omzet)
    },
    staleTime: 60_000,
  })
}

export function useStokFlow(from: string, to: string) {
  return useQuery({
    queryKey: ['laporan-stok-flow', from, to],
    queryFn: async () => {
      const [grItemsRes, trxItemsRes] = await Promise.all([
        supabase
          .from('goods_receipt_items')
          .select('nama_produk, qty_diterima, harga_beli, subtotal, goods_receipts!inner(tanggal)')
          .gte('goods_receipts.tanggal', from)
          .lte('goods_receipts.tanggal', to),
        supabase
          .from('transaction_items')
          .select('nama_produk, qty, harga_jual, subtotal, transactions!inner(created_at, status)')
          .gte('transactions.created_at', from)
          .lte('transactions.created_at', to + 'T23:59:59')
          .eq('transactions.status', 'selesai'),
      ])
      if (grItemsRes.error) throw grItemsRes.error
      if (trxItemsRes.error) throw trxItemsRes.error

      // Aggregate by product name
      const masuk: Record<string, { qty: number; nilai: number }> = {}
      const keluar: Record<string, { qty: number; nilai: number }> = {}

      for (const r of grItemsRes.data ?? []) {
        if (!masuk[r.nama_produk]) masuk[r.nama_produk] = { qty: 0, nilai: 0 }
        masuk[r.nama_produk].qty += Number(r.qty_diterima)
        masuk[r.nama_produk].nilai += Number(r.subtotal)
      }
      for (const r of trxItemsRes.data ?? []) {
        if (!keluar[r.nama_produk]) keluar[r.nama_produk] = { qty: 0, nilai: 0 }
        keluar[r.nama_produk].qty += Number(r.qty)
        keluar[r.nama_produk].nilai += Number(r.subtotal)
      }

      const allNames = Array.from(new Set([...Object.keys(masuk), ...Object.keys(keluar)]))
      return allNames.map((nama) => ({
        nama,
        masuk_qty:  masuk[nama]?.qty ?? 0,
        masuk_nilai: masuk[nama]?.nilai ?? 0,
        keluar_qty:  keluar[nama]?.qty ?? 0,
        keluar_nilai: keluar[nama]?.nilai ?? 0,
      })).sort((a, b) => (b.keluar_qty - a.keluar_qty))
    },
    staleTime: 60_000,
  })
}

export function useLabaRugi(from: string, to: string) {
  return useQuery({
    queryKey: ['laporan-laba-rugi', from, to],
    queryFn: async () => {
      const [trxRes, grRes, paySupRes] = await Promise.all([
        supabase
          .from('v_daily_summary')
          .select('omzet, laba_kotor, total_diskon, jumlah_transaksi')
          .gte('tanggal', from)
          .lte('tanggal', to),
        supabase
          .from('goods_receipts')
          .select('total, metode_bayar')
          .gte('tanggal', from)
          .lte('tanggal', to),
        supabase
          .from('supplier_payments')
          .select('jumlah')
          .gte('created_at', from)
          .lte('created_at', to + 'T23:59:59'),
      ])
      if (trxRes.error) throw trxRes.error
      if (grRes.error) throw grRes.error
      if (paySupRes.error) throw paySupRes.error

      const omzet     = (trxRes.data ?? []).reduce((s, r) => s + Number(r.omzet), 0)
      const labaKotor = (trxRes.data ?? []).reduce((s, r) => s + Number(r.laba_kotor), 0)
      const diskon    = (trxRes.data ?? []).reduce((s, r) => s + Number(r.total_diskon), 0)
      const transaksi = (trxRes.data ?? []).reduce((s, r) => s + Number(r.jumlah_transaksi), 0)
      const totalBeli = (grRes.data ?? []).reduce((s, r) => s + Number(r.total), 0)
      const totalBayarHutang = (paySupRes.data ?? []).reduce((s, r) => s + Number(r.jumlah), 0)

      return { omzet, labaKotor, diskon, transaksi, totalBeli, totalBayarHutang }
    },
    staleTime: 60_000,
  })
}

export function useDailySummary(from: string, to: string) {
  return useQuery<DailySummary[]>({
    queryKey: ['daily-summary', from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_daily_summary')
        .select('*')
        .gte('tanggal', from)
        .lte('tanggal', to)
        .order('tanggal', { ascending: false })
      if (error) throw error
      return data as DailySummary[]
    },
    staleTime: 60_000,
  })
}

export function useTopProducts(limit = 10) {
  return useQuery<TopProduct[]>({
    queryKey: ['top-products', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_top_products')
        .select('*')
        .limit(limit)
      if (error) throw error
      return data as TopProduct[]
    },
    staleTime: 60_000,
  })
}

export function usePeriodSummary(from: string, to: string) {
  const { data } = useDailySummary(from, to)
  return {
    totalOmzet:     data?.reduce((s, r) => s + Number(r.omzet), 0) ?? 0,
    totalTransaksi: data?.reduce((s, r) => s + Number(r.jumlah_transaksi), 0) ?? 0,
    totalLaba:      data?.reduce((s, r) => s + Number(r.laba_kotor), 0) ?? 0,
    totalDiskon:    data?.reduce((s, r) => s + Number(r.total_diskon), 0) ?? 0,
  }
}
