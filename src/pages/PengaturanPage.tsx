import { useSettings } from '@/hooks/useSettings'
import { Spinner } from '@/components/ui/Spinner'

export function PengaturanPage() {
  const { data: settings, isLoading } = useSettings()

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold mb-6">Pengaturan</h1>

      <div className="card p-5 mb-4">
        <h2 className="font-medium mb-4 text-sm text-gray-700">Informasi Toko</h2>
        <div className="space-y-3">
          {[
            { label: 'Nama Toko', value: settings?.nama_toko },
            { label: 'Alamat', value: settings?.alamat },
            { label: 'Nomor Telepon', value: settings?.telp },
            { label: 'Footer Nota', value: settings?.footer_nota },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
              <input className="input" defaultValue={f.value ?? ''} />
            </div>
          ))}
          <button className="btn-primary text-sm">Simpan Perubahan</button>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-medium mb-4 text-sm text-gray-700">Konfigurasi Printer</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nama Printer (QZ Tray)</label>
            <input className="input" defaultValue={settings?.printer_name ?? ''} placeholder="Kosongkan untuk default printer" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Lebar Kertas</label>
            <select className="input">
              <option value={58} selected={settings?.paper_width === 58}>58mm</option>
              <option value={80} selected={settings?.paper_width === 80}>80mm</option>
            </select>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
            Pastikan <strong>QZ Tray</strong> sudah terinstall dan berjalan di komputer kasir.
            Download di <a href="https://qz.io/download" target="_blank" className="underline">qz.io/download</a>
          </div>
          <button className="btn-primary text-sm">Simpan & Test Print</button>
        </div>
      </div>
    </div>
  )
}
