import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from './utils'
import type { DailySummary, TopProduct } from '@/types'

// ── Theme ─────────────────────────────────────────────────────────────────────
const GREEN  = [59, 109, 17] as [number, number, number]
const GREEN2 = [234, 243, 222] as [number, number, number]
const GRAY   = [248, 248, 246] as [number, number, number]
const DARK   = [26, 26, 24] as [number, number, number]
const TEXT2  = [107, 105, 99] as [number, number, number]

function rupiah(n: number) {
  return 'Rp ' + Number(n).toLocaleString('id-ID')
}

function header(doc: jsPDF, title: string, subtitle: string) {
  // Green accent bar
  doc.setFillColor(...GREEN)
  doc.rect(0, 0, 210, 8, 'F')

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text('AgroKas', 14, 18)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...TEXT2)
  doc.text(title, 14, 25)

  doc.setFontSize(9)
  doc.text(subtitle, 14, 31)
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 37)

  // Divider
  doc.setDrawColor(232, 230, 224)
  doc.setLineWidth(0.3)
  doc.line(14, 40, 196, 40)
}

const tableStyles = {
  headStyles: { fillColor: GREEN, textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' as const, fontSize: 9 },
  alternateRowStyles: { fillColor: GRAY },
  footStyles: { fillColor: GREEN2, textColor: DARK, fontStyle: 'bold' as const },
  styles: { fontSize: 9, cellPadding: 3 },
  margin: { left: 14, right: 14 },
}

// ── Laporan Harian ────────────────────────────────────────────────────────────
export function pdfLaporanHarian(data: DailySummary[], from: string, to: string) {
  const doc = new jsPDF()
  header(doc, 'Laporan Penjualan Harian', `Periode: ${formatDate(from)} s/d ${formatDate(to)}`)

  const totOmzet  = data.reduce((s, r) => s + Number(r.omzet), 0)
  const totDiskon = data.reduce((s, r) => s + Number(r.total_diskon), 0)
  const totLaba   = data.reduce((s, r) => s + Number(r.laba_kotor), 0)
  const totTrx    = data.reduce((s, r) => s + Number(r.jumlah_transaksi), 0)

  autoTable(doc, {
    ...tableStyles,
    startY: 45,
    head: [['Tanggal', 'Transaksi', 'Omzet', 'Diskon', 'Laba Kotor']],
    body: data.map((r) => [
      formatDate(r.tanggal),
      Number(r.jumlah_transaksi) + '×',
      rupiah(Number(r.omzet)),
      rupiah(Number(r.total_diskon)),
      rupiah(Number(r.laba_kotor)),
    ]),
    foot: [['TOTAL', totTrx + '×', rupiah(totOmzet), rupiah(totDiskon), rupiah(totLaba)]],
    columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 22, halign: 'center' } },
  })

  doc.save(`AgroKas_Harian_${from}_${to}.pdf`)
}

// ── Produk Terlaris ───────────────────────────────────────────────────────────
export function pdfProdukTerlaris(data: TopProduct[]) {
  const doc = new jsPDF()
  header(doc, 'Laporan Produk Terlaris', 'Semua waktu')

  autoTable(doc, {
    ...tableStyles,
    startY: 45,
    head: [['No', 'Nama Produk', 'Kategori', 'Satuan', 'Qty Terjual', 'Total Omzet']],
    body: data.map((p, i) => [
      i + 1,
      p.nama,
      p.kategori,
      p.satuan,
      Number(p.total_qty_terjual).toLocaleString('id-ID'),
      rupiah(Number(p.total_omzet)),
    ]),
    columnStyles: { 0: { cellWidth: 10, halign: 'center' } },
  })

  doc.save('AgroKas_ProdukTerlaris.pdf')
}

// ── Hutang Outstanding ────────────────────────────────────────────────────────
export function pdfHutangOutstanding(data: any[]) {
  const doc = new jsPDF()
  const totalDebt = data.reduce((s, c) => s + Number(c.saldo_hutang), 0)
  header(doc, 'Hutang Outstanding', `${data.length} pelanggan · Total: ${rupiah(totalDebt)}`)

  autoTable(doc, {
    ...tableStyles,
    startY: 45,
    head: [['Pelanggan', 'Desa', 'Tipe', 'Saldo Hutang', 'Limit Kredit', 'Utilisasi']],
    body: data.map((c) => {
      const util = c.limit_kredit > 0
        ? Math.min(100, Math.round(c.saldo_hutang / c.limit_kredit * 100)) + '%'
        : '—'
      return [c.nama, c.desa ?? '—', c.tipe, rupiah(c.saldo_hutang),
        c.limit_kredit > 0 ? rupiah(c.limit_kredit) : '—', util]
    }),
    foot: [['TOTAL', '', '', rupiah(totalDebt), '', '']],
  })

  doc.save('AgroKas_HutangOutstanding.pdf')
}

// ── Pembelian ─────────────────────────────────────────────────────────────────
export function pdfPembelian(data: any[], from: string, to: string) {
  const doc = new jsPDF()
  const total = data.reduce((s, r) => s + Number(r.total), 0)
  header(doc, 'Laporan Pembelian', `Periode: ${formatDate(from)} s/d ${formatDate(to)}`)

  autoTable(doc, {
    ...tableStyles,
    startY: 45,
    head: [['Tanggal', 'No. Terima', 'Supplier', 'Metode', 'Total']],
    body: data.map((gr) => [
      formatDate(gr.tanggal),
      gr.no_terima ?? '—',
      gr.suppliers?.nama ?? '—',
      gr.metode_bayar,
      rupiah(Number(gr.total)),
    ]),
    foot: [['TOTAL', '', '', '', rupiah(total)]],
    columnStyles: { 0: { cellWidth: 24 }, 3: { cellWidth: 20, halign: 'center' } },
  })

  doc.save(`AgroKas_Pembelian_${from}_${to}.pdf`)
}

// ── Arus Kas ──────────────────────────────────────────────────────────────────
export function pdfArusKas(rows: any[], from: string, to: string,
  summary: { totalTunai: number; totalKeluar: number; kasNet: number }) {
  const doc = new jsPDF()
  header(doc, 'Laporan Arus Kas', `Periode: ${formatDate(from)} s/d ${formatDate(to)}`)

  // Summary boxes
  let y = 45
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(...GREEN2)
  doc.roundedRect(14, y, 54, 18, 2, 2, 'F')
  doc.roundedRect(74, y, 54, 18, 2, 2, 'F')
  doc.setFillColor(254, 242, 242)
  doc.roundedRect(134, y, 54, 18, 2, 2, 'F')

  doc.setTextColor(...GREEN)
  doc.text('Kas Masuk', 17, y + 6)
  doc.text(rupiah(summary.totalTunai), 17, y + 13)

  doc.setTextColor(220, 38, 38)
  doc.text('Kas Keluar', 77, y + 6)
  doc.text(rupiah(summary.totalKeluar), 77, y + 13)

  doc.setTextColor(...(summary.kasNet >= 0 ? ([13, 148, 136] as [number,number,number]) : ([220, 38, 38] as [number,number,number])))
  doc.text('Kas Bersih', 137, y + 6)
  doc.text(rupiah(summary.kasNet), 137, y + 13)

  doc.setTextColor(...DARK)

  autoTable(doc, {
    ...tableStyles,
    startY: y + 25,
    head: [['Tanggal', 'Jenis', 'Keterangan', 'Jumlah']],
    body: rows.map((r) => [
      r.tanggal ?? '—',
      r.jenis,
      r.ket,
      (r.jumlah >= 0 ? '+' : '') + rupiah(Math.abs(r.jumlah)),
    ]),
    columnStyles: { 1: { cellWidth: 16, halign: 'center' }, 3: { halign: 'right' } },
  })

  doc.save(`AgroKas_ArusKas_${from}_${to}.pdf`)
}

// ── Margin Produk ─────────────────────────────────────────────────────────────
export function pdfMarginProduk(data: any[]) {
  const doc = new jsPDF()
  header(doc, 'Laporan Margin & Profitabilitas Produk', 'Semua waktu')

  autoTable(doc, {
    ...tableStyles,
    startY: 45,
    head: [['No', 'Produk', 'Qty Terjual', 'Omzet', 'HPP Total', 'Laba Kotor', 'Margin']],
    body: data.map((p, i) => {
      const laba = p.omzet - p.hpp
      const pct  = p.omzet > 0 ? (laba / p.omzet * 100).toFixed(1) + '%' : '0%'
      return [i + 1, p.nama, p.qty.toLocaleString('id-ID'), rupiah(p.omzet), rupiah(p.hpp), rupiah(laba), pct]
    }),
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
    },
  })

  doc.save('AgroKas_MarginProduk.pdf')
}

// ── Stok Flow ─────────────────────────────────────────────────────────────────
export function pdfStokFlow(data: any[], from: string, to: string) {
  const doc = new jsPDF()
  header(doc, 'Laporan Pergerakan Stok', `Periode: ${formatDate(from)} s/d ${formatDate(to)}`)

  autoTable(doc, {
    ...tableStyles,
    startY: 45,
    head: [['Produk', 'Masuk Qty', 'Nilai Masuk', 'Keluar Qty', 'Nilai Keluar', 'Selisih']],
    body: data.map((r) => [
      r.nama,
      '+' + r.masuk_qty.toLocaleString('id-ID'),
      rupiah(r.masuk_nilai),
      '-' + r.keluar_qty.toLocaleString('id-ID'),
      rupiah(r.keluar_nilai),
      (r.masuk_qty - r.keluar_qty >= 0 ? '+' : '') + (r.masuk_qty - r.keluar_qty).toLocaleString('id-ID'),
    ]),
    columnStyles: { 1: { halign: 'right' }, 3: { halign: 'right' }, 5: { halign: 'right' } },
  })

  doc.save(`AgroKas_StokFlow_${from}_${to}.pdf`)
}

// ── Laba Rugi ─────────────────────────────────────────────────────────────────
export function pdfLabaRugi(
  data: { omzet: number; diskon: number; labaKotor: number; totalBeli: number; transaksi: number },
  from: string, to: string
) {
  const doc = new jsPDF()
  header(doc, 'Laporan Laba Rugi', `Periode: ${formatDate(from)} s/d ${formatDate(to)}`)

  const hpp = data.omzet - data.diskon - data.labaKotor
  const penjualanBersih = data.omzet - data.diskon

  const rows = [
    ['Omzet Penjualan', rupiah(data.omzet), ''],
    ['Total Diskon', `− ${rupiah(data.diskon)}`, ''],
    ['Penjualan Bersih', rupiah(penjualanBersih), 'subtotal'],
    ['HPP (Harga Pokok Penjualan)', `− ${rupiah(hpp)}`, ''],
    ['Laba Kotor', rupiah(data.labaKotor), 'result'],
    ['', '', ''],
    ['Total Pembelian (termasuk hutang)', rupiah(data.totalBeli), ''],
    ['Jumlah Transaksi', data.transaksi + ' transaksi', ''],
  ]

  autoTable(doc, {
    ...tableStyles,
    startY: 45,
    head: [['Keterangan', 'Jumlah']],
    body: rows.map((r) => [r[0], r[1]]),
    columnStyles: { 1: { halign: 'right', cellWidth: 50 } },
    didParseCell: (hookData) => {
      if (hookData.row.index === 2 || hookData.row.index === 4) {
        hookData.cell.styles.fontStyle = 'bold'
        hookData.cell.styles.fillColor = hookData.row.index === 4 ? GREEN2 : GRAY
      }
    },
  })

  doc.save(`AgroKas_LabaRugi_${from}_${to}.pdf`)
}
