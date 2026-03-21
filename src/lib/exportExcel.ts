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
