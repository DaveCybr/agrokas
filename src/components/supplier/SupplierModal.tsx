import { useState, useEffect } from 'react'
import type { Supplier } from '@/types'
import { useTambahSupplier, useUpdateSupplier } from '@/hooks/useSupplier'

interface Props {
  supplier?: Supplier | null
  onClose: () => void
}

export function SupplierModal({ supplier, onClose }: Props) {
  const isEdit = !!supplier
  const tambah = useTambahSupplier()
  const update = useUpdateSupplier()
  const isPending = tambah.isPending || update.isPending

  const [form, setForm] = useState({
    nama: '', kontak: '', telp: '', kota: '', alamat: '', produk_supply: '', aktif: true,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (supplier) {
      setForm({
        nama: supplier.nama,
        kontak: supplier.kontak ?? '',
        telp: supplier.telp ?? '',
        kota: supplier.kota ?? '',
        alamat: supplier.alamat ?? '',
        produk_supply: supplier.produk_supply ?? '',
        aktif: supplier.aktif,
      })
    }
  }, [supplier])

  function set(k: string, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nama.trim()) { setError('Nama supplier wajib diisi'); return }
    try {
      const payload = {
        nama: form.nama.trim(),
        kontak: form.kontak.trim() || null,
        telp: form.telp.trim() || null,
        kota: form.kota.trim() || null,
        alamat: form.alamat.trim() || null,
        produk_supply: form.produk_supply.trim() || null,
        aktif: form.aktif,
      }
      if (isEdit) await update.mutateAsync({ id: supplier!.id, ...payload })
      else await tambah.mutateAsync(payload)
      onClose()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg"
        style={{ border: '1px solid #E5E0D5' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #E8E6E0' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#1A1A18' }}>
            {isEdit ? 'Edit Supplier' : 'Tambah Supplier'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#6B6963' }}>
              Nama Supplier <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              value={form.nama}
              onChange={e => set('nama', e.target.value)}
              placeholder="cth. PT Pupuk Kujang"
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
              style={{ borderColor: error && !form.nama ? '#DC2626' : '#D5D3CD', color: '#1A1A18' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6B6963' }}>Nama Kontak</label>
              <input value={form.kontak} onChange={e => set('kontak', e.target.value)} placeholder="Bpk / Ibu ..."
                className="w-full px-3 py-2 text-sm rounded-lg border outline-none" style={{ borderColor: '#D5D3CD', color: '#1A1A18' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: '#6B6963' }}>Telepon</label>
              <input value={form.telp} onChange={e => set('telp', e.target.value)} placeholder="08xxx" type="tel"
                className="w-full px-3 py-2 text-sm rounded-lg border outline-none" style={{ borderColor: '#D5D3CD', color: '#1A1A18' }} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#6B6963' }}>Kota</label>
            <input value={form.kota} onChange={e => set('kota', e.target.value)} placeholder="cth. Jember"
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none" style={{ borderColor: '#D5D3CD', color: '#1A1A18' }} />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#6B6963' }}>Alamat</label>
            <input value={form.alamat} onChange={e => set('alamat', e.target.value)} placeholder="Jl. ..."
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none" style={{ borderColor: '#D5D3CD', color: '#1A1A18' }} />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#6B6963' }}>Produk yang Disupply</label>
            <textarea value={form.produk_supply} onChange={e => set('produk_supply', e.target.value)}
              placeholder="cth. Urea, ZA, NPK Phonska" rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none resize-none" style={{ borderColor: '#D5D3CD', color: '#1A1A18' }} />
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.aktif} onChange={e => set('aktif', e.target.checked)}
                className="w-4 h-4 rounded" style={{ accentColor: '#3B6D11' }} />
              <span className="text-sm" style={{ color: '#1A1A18' }}>Aktif</span>
            </label>
          )}

          {error && <p className="text-xs" style={{ color: '#DC2626' }}>{error}</p>}
        </form>

        <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: '1px solid #E8E6E0' }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ backgroundColor: '#F0EEE8', color: '#6B6963' }}>
            Batal
          </button>
          <button onClick={handleSubmit as any} disabled={isPending}
            className="px-4 py-2 text-sm font-medium rounded-lg" style={{ backgroundColor: '#3B6D11', color: '#fff' }}>
            {isPending ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah Supplier'}
          </button>
        </div>
      </div>
    </div>
  )
}
