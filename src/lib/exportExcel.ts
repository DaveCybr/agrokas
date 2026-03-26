import * as XLSX from 'xlsx'
import { formatDate } from './utils'
import type { DailySummary, TopProduct } from '@/types'

export function exportLaporanHarian(data: DailySummary[], periode: string) {
  const rows = data.map((r) => ({
    'Tanggal':          formatDate(r.tanggal),
    'Jumlah Transaksi': Number(r.jumlah_transaksi),
    'Omzet':            Number(r.omzet),
    'Diskon':           Number(r.total_diskon),
    'Laba Kotor':       Number(r.laba_kotor),
  }))

  rows.push({
    'Tanggal':          'TOTAL',
    'Jumlah Transaksi': rows.reduce((s, r) => s + r['Jumlah Transaksi'], 0),
    'Omzet':            rows.reduce((s, r) => s + r['Omzet'], 0),
    'Diskon':           rows.reduce((s, r) => s + r['Diskon'], 0),
    'Laba Kotor':       rows.reduce((s, r) => s + r['Laba Kotor'], 0),
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 18 }]

  const range = XLSX.utils.decode_range(ws['!ref']!)
  for (let R = 1; R <= range.e.r; R++) {
    for (const col of [2, 3, 4]) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: col })]
      if (cell) cell.z = '#,##0'
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Harian')
  XLSX.writeFile(wb, `AgroKas_Laporan_${periode}.xlsx`)
}

export function exportProdukTerlaris(data: TopProduct[]) {
  const rows = data.map((p, i) => ({
    'No':           i + 1,
    'Nama Produk':  p.nama,
    'Kategori':     p.kategori,
    'Satuan':       p.satuan,
    'Qty Terjual':  Number(p.total_qty_terjual),
    'Total Omzet':  Number(p.total_omzet),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 18 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Produk Terlaris')
  XLSX.writeFile(wb, `AgroKas_ProdukTerlaris.xlsx`)
}

export function exportHutangOutstanding(data: any[]) {
  const rows = data.map((c) => ({
    'Nama Pelanggan':  c.nama,
    'Desa':            c.desa ?? '',
    'Tipe':            c.tipe,
    'Saldo Hutang':    Number(c.saldo_hutang),
    'Limit Kredit':    Number(c.limit_kredit),
    'Hutang Terakhir': c.hutang_terakhir ? formatDate(c.hutang_terakhir) : '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 18 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Hutang Outstanding')
  XLSX.writeFile(wb, `AgroKas_HutangOutstanding.xlsx`)
}

export function exportPembelian(data: any[], periode: string) {
  const rows = data.map((gr) => ({
    'Tanggal':    formatDate(gr.tanggal),
    'No. Terima': gr.no_terima ?? '',
    'Supplier':   gr.suppliers?.nama ?? '',
    'Metode':     gr.metode_bayar,
    'Total':      Number(gr.total),
  }))
  rows.push({ 'Tanggal': 'TOTAL', 'No. Terima': '', 'Supplier': '', 'Metode': '',
    'Total': rows.reduce((s, r) => s + r['Total'], 0) })

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 25 }, { wch: 12 }, { wch: 18 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pembelian')
  XLSX.writeFile(wb, `AgroKas_Pembelian_${periode}.xlsx`)
}

export function exportArusKas(rows: any[], periode: string) {
  const data = rows.map((r) => ({
    'Tanggal':    r.tanggal,
    'Jenis':      r.jenis,
    'Keterangan': r.ket,
    'Jumlah':     r.jumlah,
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 14 }, { wch: 8 }, { wch: 35 }, { wch: 18 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Arus Kas')
  XLSX.writeFile(wb, `AgroKas_ArusKas_${periode}.xlsx`)
}

export function exportMarginProduk(data: any[]) {
  const rows = data.map((p, i) => ({
    'No':         i + 1,
    'Produk':     p.nama,
    'Qty Terjual': p.qty,
    'Omzet':      p.omzet,
    'HPP Total':  p.hpp,
    'Laba Kotor': p.omzet - p.hpp,
    'Margin %':   p.omzet > 0 ? +((p.omzet - p.hpp) / p.omzet * 100).toFixed(1) : 0,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 10 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Margin Produk')
  XLSX.writeFile(wb, `AgroKas_MarginProduk.xlsx`)
}

export function exportStokFlow(data: any[], periode: string) {
  const rows = data.map((r) => ({
    'Produk':       r.nama,
    'Masuk Qty':    r.masuk_qty,
    'Masuk Nilai':  r.masuk_nilai,
    'Keluar Qty':   r.keluar_qty,
    'Keluar Nilai': r.keluar_nilai,
    'Selisih':      r.masuk_qty - r.keluar_qty,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 12 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Stok Flow')
  XLSX.writeFile(wb, `AgroKas_StokFlow_${periode}.xlsx`)
}

export function exportLabaRugi(data: { omzet: number; diskon: number; labaKotor: number; totalBeli: number; transaksi: number }, periode: string) {
  const hpp = data.omzet - data.diskon - data.labaKotor
  const rows = [
    { 'Keterangan': 'Omzet Penjualan',             'Jumlah': data.omzet },
    { 'Keterangan': 'Total Diskon',                 'Jumlah': -data.diskon },
    { 'Keterangan': 'Penjualan Bersih',             'Jumlah': data.omzet - data.diskon },
    { 'Keterangan': 'HPP (Harga Pokok Penjualan)',  'Jumlah': -hpp },
    { 'Keterangan': 'Laba Kotor',                   'Jumlah': data.labaKotor },
    { 'Keterangan': '---',                          'Jumlah': 0 },
    { 'Keterangan': 'Total Pembelian (incl. Hutang)','Jumlah': data.totalBeli },
    { 'Keterangan': 'Jumlah Transaksi',             'Jumlah': data.transaksi },
  ]

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 35 }, { wch: 20 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Laba Rugi')
  XLSX.writeFile(wb, `AgroKas_LabaRugi_${periode}.xlsx`)
}
