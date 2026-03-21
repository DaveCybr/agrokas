// AgroKas — ESC/POS Printer via QZ Tray
// Docs: https://qz.io

declare const qz: any

const W = 32 // karakter per baris (58mm = 32, 80mm = 48)

function fmt(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

function line(char = '-') {
  return char.repeat(W) + '\n'
}

function center(text: string) {
  const pad = Math.max(0, Math.floor((W - text.length) / 2))
  return ' '.repeat(pad) + text + '\n'
}

function row(left: string, right: string) {
  const gap = W - left.length - right.length
  if (gap <= 0) return left.slice(0, W - right.length - 1) + ' ' + right + '\n'
  return left + ' '.repeat(gap) + right + '\n'
}

export async function connectQZ() {
  if (typeof qz === 'undefined') {
    throw new Error('QZ Tray script belum dimuat. Aktifkan tag script di index.html.')
  }
  if (qz.websocket.isActive()) return
  qz.security.setCertificatePromise((resolve: any) => resolve(''))
  qz.security.setSignatureAlgorithm('SHA512')
  qz.security.setSignaturePromise((_toSign: string) => (resolve: any) => resolve(''))
  await qz.websocket.connect()
}

export async function getPrinterList(): Promise<string[]> {
  await connectQZ()
  return await qz.printers.find()
}

export interface PrintPayload {
  namaToko: string
  alamat: string
  telp: string
  footerNota: string
  noTransaksi: string
  kasir: string
  pelanggan: string
  items: { nama: string; qty: number; satuan: string; harga: number }[]
  subtotal: number
  diskonPersen: number
  diskonNominal: number
  total: number
  metodeBayar: string
  uangDiterima: number
  kembalian: number
  printerName?: string
}

export async function printStruk(payload: PrintPayload): Promise<void> {
  await connectQZ()

  const printer = payload.printerName || (await qz.printers.getDefault())

  const ESC = '\x1B'
  const GS = '\x1D'
  const INIT = ESC + '@'
  const BOLD_ON = ESC + 'E\x01'
  const BOLD_OFF = ESC + 'E\x00'
  const CENTER = ESC + 'a\x01'
  const LEFT = ESC + 'a\x00'
  const DBL_ON = GS + '!\x01'
  const DBL_OFF = GS + '!\x00'
  const CUT = GS + 'V\x42\x05'

  let d = ''
  d += INIT
  d += CENTER + BOLD_ON + DBL_ON
  d += payload.namaToko + '\n'
  d += DBL_OFF + BOLD_OFF
  d += payload.alamat + '\n'
  d += 'Telp: ' + payload.telp + '\n'
  d += LEFT + line()
  d += row('No:', payload.noTransaksi)
  d += row('Kasir:', payload.kasir)
  d += row('Pelanggan:', payload.pelanggan)
  d += row('Tgl:', new Date().toLocaleString('id-ID'))
  d += line()

  for (const item of payload.items) {
    d += item.nama.slice(0, W) + '\n'
    d += row(`  ${item.qty} ${item.satuan} x ${fmt(item.harga)}`, fmt(item.qty * item.harga))
  }

  d += line()
  d += row('Subtotal', fmt(payload.subtotal))
  if (payload.diskonPersen > 0) {
    d += row(`Diskon ${payload.diskonPersen}%`, '-' + fmt(payload.diskonNominal))
  }
  d += BOLD_ON + row('TOTAL', fmt(payload.total)) + BOLD_OFF
  d += line()
  d += row('Metode', payload.metodeBayar)
  if (payload.metodeBayar === 'Tunai') {
    d += row('Diterima', fmt(payload.uangDiterima))
    d += BOLD_ON + row('Kembalian', fmt(payload.kembalian)) + BOLD_OFF
  }
  d += line()
  d += CENTER + payload.footerNota + '\n'
  d += '\n\n\n'
  d += CUT

  const config = qz.configs.create(printer, { raw: true, encoding: 'Cp1252' })
  await qz.print(config, [{ type: 'raw', format: 'plain', data: d }])
}

// Fallback: cetak via window.print() jika QZ Tray tidak ada
export function printFallback(payload: PrintPayload) {
  const items = payload.items
    .map(
      (i) =>
        `<tr><td>${i.nama}</td><td style="text-align:right">${i.qty} ${i.satuan}</td><td style="text-align:right">Rp ${Math.round(i.qty * i.harga).toLocaleString('id-ID')}</td></tr>`
    )
    .join('')

  const html = `<html><head><title>Struk</title>
  <style>
    @page{size:58mm auto;margin:4mm}
    *{box-sizing:border-box}
    body{font-family:monospace;font-size:10px;width:50mm}
    h2{font-size:12px;text-align:center;margin:0 0 2px}
    .center{text-align:center}
    .row{display:flex;justify-content:space-between}
    .bold{font-weight:bold}
    hr{border:none;border-top:1px dashed #000;margin:4px 0}
    table{width:100%;border-collapse:collapse}
    td{padding:1px 0;vertical-align:top}
  </style></head><body>
  <h2>${payload.namaToko}</h2>
  <div class="center">${payload.alamat}</div>
  <div class="center">Telp: ${payload.telp}</div>
  <hr>
  <div class="row"><span>No</span><span>${payload.noTransaksi}</span></div>
  <div class="row"><span>Kasir</span><span>${payload.kasir}</span></div>
  <div class="row"><span>Pelanggan</span><span>${payload.pelanggan}</span></div>
  <hr>
  <table>${items}</table>
  <hr>
  <div class="row"><span>Subtotal</span><span>Rp ${Math.round(payload.subtotal).toLocaleString('id-ID')}</span></div>
  ${payload.diskonPersen > 0 ? `<div class="row"><span>Diskon ${payload.diskonPersen}%</span><span>-Rp ${Math.round(payload.diskonNominal).toLocaleString('id-ID')}</span></div>` : ''}
  <div class="row bold"><span>TOTAL</span><span>Rp ${Math.round(payload.total).toLocaleString('id-ID')}</span></div>
  <hr>
  <div class="row"><span>Metode</span><span>${payload.metodeBayar}</span></div>
  ${payload.metodeBayar === 'Tunai' ? `<div class="row"><span>Diterima</span><span>Rp ${Math.round(payload.uangDiterima).toLocaleString('id-ID')}</span></div><div class="row bold"><span>Kembalian</span><span>Rp ${Math.round(payload.kembalian).toLocaleString('id-ID')}</span></div>` : ''}
  <hr>
  <div class="center">${payload.footerNota}</div>
  </body></html>`

  const w = window.open('', '_blank', 'width=260,height=700')
  if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); w.close() }
}
