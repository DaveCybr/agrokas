import { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { useUpdateSettings } from '@/hooks/useSettings'
import { Spinner } from '@/components/ui/Spinner'

function BarcodeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth="1.5" stroke="currentColor" width="16" height="16">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5
           c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5Z
           M3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5
           c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z
           M13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5
           c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
    </svg>
  )
}

export function PengaturanPage() {
  const { data: settings, isLoading } = useSettings()
  const update = useUpdateSettings()

  const [barcodeEnabled, setBarcodeEnabled] = useState(
    () => localStorage.getItem('agrokas_barcode_enabled') !== 'false'
  )

  const [tokoForm, setTokoForm] = useState({
    nama_toko: '', alamat: '', telp: '', footer_nota: '',
  })
  const [printerForm, setPrinterForm] = useState({
    printer_name: '', paper_width: 80,
  })
  const [tokoMsg, setTokoMsg]       = useState<{ text: string; ok: boolean } | null>(null)
  const [printerMsg, setPrinterMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (settings) {
      setTokoForm({
        nama_toko:   settings.nama_toko ?? '',
        alamat:      settings.alamat ?? '',
        telp:        settings.telp ?? '',
        footer_nota: settings.footer_nota ?? '',
      })
      setPrinterForm({
        printer_name: settings.printer_name ?? '',
        paper_width:  settings.paper_width ?? 80,
      })
    }
  }, [settings])

  function toggleBarcode() {
    const next = !barcodeEnabled
    setBarcodeEnabled(next)
    localStorage.setItem('agrokas_barcode_enabled', String(next))
  }

  async function handleSimpanToko() {
    if (!settings) return
    setTokoMsg(null)
    try {
      await update.mutateAsync({ id: settings.id, ...tokoForm })
      setTokoMsg({ text: 'Perubahan tersimpan', ok: true })
    } catch (err) {
      setTokoMsg({ text: (err as Error).message, ok: false })
    }
  }

  async function handleSimpanPrinter() {
    if (!settings) return
    setPrinterMsg(null)
    try {
      await update.mutateAsync({ id: settings.id, ...printerForm })
      setPrinterMsg({ text: 'Konfigurasi printer tersimpan', ok: true })
    } catch (err) {
      setPrinterMsg({ text: (err as Error).message, ok: false })
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner /></div>
  }

  return (
    <div className="px-4 py-4 md:px-8 md:py-6" style={{ maxWidth: '672px' }}>
      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: '#1A1A18' }}>Pengaturan</h1>
        <p className="text-xs mt-0.5" style={{ color: '#9B9890' }}>Konfigurasi toko & printer</p>
      </div>

      {/* Informasi Toko */}
      <div className="card p-6 mb-4">
        <div className="pb-3 mb-4" style={{ borderBottom: '1px solid #E8E6E0' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#1A1A18' }}>Informasi Toko</h2>
        </div>
        <div className="space-y-4">
          {([
            { label: 'Nama Toko',    key: 'nama_toko'   },
            { label: 'Alamat',       key: 'alamat'      },
            { label: 'Nomor Telepon',key: 'telp'        },
            { label: 'Footer Nota',  key: 'footer_nota' },
          ] as { label: string; key: keyof typeof tokoForm }[]).map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B6963' }}>
                {f.label}
              </label>
              <input
                className="input"
                value={tokoForm[f.key]}
                onChange={(e) => {
                  setTokoForm(prev => ({ ...prev, [f.key]: e.target.value }))
                  setTokoMsg(null)
                }}
              />
            </div>
          ))}
          {tokoMsg && (
            <p className="text-xs" style={{ color: tokoMsg.ok ? '#3B6D11' : '#DC2626' }}>
              {tokoMsg.text}
            </p>
          )}
          <div className="pt-1">
            <button
              className="btn-primary text-sm"
              onClick={handleSimpanToko}
              disabled={update.isPending}
            >
              {update.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner */}
      <div className="card p-6 mb-4">
        <div className="pb-3 mb-4 flex items-center gap-2" style={{ borderBottom: '1px solid #E8E6E0' }}>
          <span style={{ color: '#3B6D11' }}><BarcodeIcon /></span>
          <h2 className="font-semibold text-sm" style={{ color: '#1A1A18' }}>Barcode Scanner</h2>
        </div>
        <div className="space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: '#1A1A18' }}>
                Aktifkan scan barcode otomatis
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#9B9890' }}>
                Scan produk langsung dari halaman kasir
              </p>
            </div>
            <div
              className="relative rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer"
              style={{ width: '36px', height: '20px', backgroundColor: barcodeEnabled ? '#3B6D11' : '#D0CEC8' }}
              onClick={toggleBarcode}
            >
              <div
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                style={{ transform: barcodeEnabled ? 'translateX(18px)' : 'translateX(2px)' }}
              />
            </div>
          </div>

          {/* Info box */}
          <div
            className="p-3 rounded-lg text-xs space-y-1"
            style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}
          >
            <p>Scanner USB bekerja otomatis tanpa konfigurasi tambahan.</p>
            <p>Pastikan scanner disetel ke mode <strong>HID Keyboard</strong> (default pabrik).</p>
            <p>Kode produk harus diisi di master produk agar bisa di-scan.</p>
          </div>
        </div>
      </div>

      {/* Konfigurasi Printer */}
      <div className="card p-6">
        <div className="pb-3 mb-4" style={{ borderBottom: '1px solid #E8E6E0' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#1A1A18' }}>Konfigurasi Printer</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B6963' }}>
              Nama Printer (QZ Tray)
            </label>
            <input
              className="input"
              value={printerForm.printer_name}
              onChange={(e) => {
                setPrinterForm(prev => ({ ...prev, printer_name: e.target.value }))
                setPrinterMsg(null)
              }}
              placeholder="Kosongkan untuk default printer"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B6963' }}>
              Lebar Kertas
            </label>
            <select
              className="input"
              value={printerForm.paper_width}
              onChange={(e) => {
                setPrinterForm(prev => ({ ...prev, paper_width: Number(e.target.value) }))
                setPrinterMsg(null)
              }}
            >
              <option value={58}>58mm</option>
              <option value={80}>80mm</option>
            </select>
          </div>
          <div
            className="p-3 rounded-lg text-xs"
            style={{
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#92400E',
            }}
          >
            Pastikan <strong>QZ Tray</strong> sudah terinstall dan berjalan di komputer kasir.{' '}
            <a
              href="https://qz.io/download"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              qz.io/download
            </a>
          </div>
          {printerMsg && (
            <p className="text-xs" style={{ color: printerMsg.ok ? '#3B6D11' : '#DC2626' }}>
              {printerMsg.text}
            </p>
          )}
          <div className="pt-1">
            <button
              className="btn-primary text-sm"
              onClick={handleSimpanPrinter}
              disabled={update.isPending}
            >
              {update.isPending ? 'Menyimpan...' : 'Simpan & Test Print'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
