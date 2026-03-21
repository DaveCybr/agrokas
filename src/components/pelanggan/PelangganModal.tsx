import { useState, useEffect } from 'react'
import { useTambahPelanggan, useUpdatePelanggan } from '@/hooks/useCustomers'
import { useToastStore } from '@/store/toastStore'
import type { Customer } from '@/types'

interface FormState {
  nama: string
  telp: string
  tipe: Customer['tipe']
  desa: string
  kecamatan: string
  alamat: string
  komoditas: string
  luas_lahan: string
  limit_kredit: number
  aktif: boolean
}

const EMPTY_FORM: FormState = {
  nama: '',
  telp: '',
  tipe: 'petani',
  desa: '',
  kecamatan: '',
  alamat: '',
  komoditas: '',
  luas_lahan: '',
  limit_kredit: 0,
  aktif: true,
}

interface Props {
  customer?: Customer | null
  onClose: () => void
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
      style={{ color: '#6B6963' }}
    >
      {children}
    </label>
  )
}

export function PelangganModal({ customer, onClose }: Props) {
  const isEdit = !!customer
  const tambah = useTambahPelanggan()
  const update = useUpdatePelanggan()
  const addToast = useToastStore((s) => s.addToast)

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  useEffect(() => {
    if (customer) {
      setForm({
        nama: customer.nama,
        telp: customer.telp ?? '',
        tipe: customer.tipe,
        desa: customer.desa ?? '',
        kecamatan: customer.kecamatan ?? '',
        alamat: customer.alamat ?? '',
        komoditas: customer.komoditas ?? '',
        luas_lahan: customer.luas_lahan?.toString() ?? '',
        limit_kredit: customer.limit_kredit,
        aktif: customer.aktif,
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
  }, [customer])

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.nama.trim()) errs.nama = 'Wajib diisi'
    if (!form.tipe) errs.tipe = 'Wajib dipilih'
    if (form.limit_kredit < 0) errs.limit_kredit = 'Tidak boleh negatif'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      nama: form.nama.trim(),
      telp: form.telp.trim() || null,
      tipe: form.tipe,
      desa: form.desa.trim() || null,
      kecamatan: form.kecamatan.trim() || null,
      alamat: form.alamat.trim() || null,
      komoditas: form.komoditas.trim() || null,
      luas_lahan: form.luas_lahan ? Number(form.luas_lahan) : null,
      limit_kredit: form.limit_kredit,
      aktif: form.aktif,
    }

    try {
      if (isEdit && customer) {
        await update.mutateAsync({ id: customer.id, ...payload })
        addToast(`${form.nama} berhasil diperbarui`, 'success')
      } else {
        await tambah.mutateAsync(payload)
        addToast(`${form.nama} berhasil ditambahkan`, 'success')
      }
      onClose()
    } catch (err) {
      addToast((err as Error).message, 'error')
    }
  }

  const isPending = tambah.isPending || update.isPending
  const inputCls = (key: keyof FormState) => `input ${errors[key] ? 'border-red-400' : ''}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl w-full overflow-hidden flex flex-col"
        style={{ maxWidth: '520px', maxHeight: '90vh', border: '1px solid #E8E6E0' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #E8E6E0' }}
        >
          <h2 className="font-semibold text-sm" style={{ color: '#1A1A18' }}>
            {isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form
          id="pelanggan-form"
          onSubmit={handleSubmit}
          className="overflow-y-auto px-6 py-5 space-y-4 flex-1"
        >
          {/* Nama */}
          <div>
            <Label>Nama Pelanggan *</Label>
            <input
              className={inputCls('nama')}
              placeholder="Contoh: Budi Santoso"
              value={form.nama}
              onChange={(e) => set('nama', e.target.value)}
              autoFocus
            />
            {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
          </div>

          {/* HP + Tipe */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nomor HP</Label>
              <input
                className="input"
                placeholder="0812..."
                value={form.telp}
                onChange={(e) => set('telp', e.target.value)}
              />
            </div>
            <div>
              <Label>Tipe Pelanggan *</Label>
              <select
                className={inputCls('tipe')}
                value={form.tipe}
                onChange={(e) => set('tipe', e.target.value as Customer['tipe'])}
                style={{ height: '36px' }}
              >
                <option value="petani">Petani</option>
                <option value="agen">Agen</option>
                <option value="poktan">Poktan (Kelompok Tani)</option>
              </select>
              {errors.tipe && <p className="text-xs text-red-500 mt-1">{errors.tipe}</p>}
            </div>
          </div>

          {/* Desa + Kecamatan */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Desa</Label>
              <input
                className="input"
                placeholder="Nama desa"
                value={form.desa}
                onChange={(e) => set('desa', e.target.value)}
              />
            </div>
            <div>
              <Label>Kecamatan</Label>
              <input
                className="input"
                placeholder="Nama kecamatan"
                value={form.kecamatan}
                onChange={(e) => set('kecamatan', e.target.value)}
              />
            </div>
          </div>

          {/* Alamat */}
          <div>
            <Label>Alamat Lengkap</Label>
            <textarea
              rows={2}
              placeholder="Opsional"
              value={form.alamat}
              onChange={(e) => set('alamat', e.target.value)}
              className="input h-auto"
              style={{ height: 'auto', padding: '8px 12px', resize: 'none' }}
            />
          </div>

          {/* Komoditas + Luas Lahan */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Komoditas Utama</Label>
              <input
                className="input"
                placeholder="padi, jagung, cabai..."
                value={form.komoditas}
                onChange={(e) => set('komoditas', e.target.value)}
              />
            </div>
            <div>
              <Label>Luas Lahan</Label>
              <div
                className="flex items-center overflow-hidden rounded-lg"
                style={{ border: '1px solid #E8E6E0' }}
              >
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder="0"
                  value={form.luas_lahan}
                  onChange={(e) => set('luas_lahan', e.target.value)}
                  className="flex-1 h-9 px-3 text-sm focus:outline-none"
                  style={{ fontFamily: 'inherit' }}
                />
                <span
                  className="px-3 h-9 flex items-center text-sm flex-shrink-0"
                  style={{
                    backgroundColor: '#F8F8F6',
                    color: '#9B9890',
                    borderLeft: '1px solid #E8E6E0',
                  }}
                >
                  ha
                </span>
              </div>
            </div>
          </div>

          {/* Limit Kredit */}
          <div>
            <Label>Limit Kredit *</Label>
            <div
              className="flex items-center overflow-hidden rounded-lg"
              style={{ border: errors.limit_kredit ? '1px solid #F87171' : '1px solid #E8E6E0' }}
            >
              <span
                className="px-3 h-9 flex items-center text-sm flex-shrink-0"
                style={{
                  backgroundColor: '#F8F8F6',
                  color: '#9B9890',
                  borderRight: '1px solid #E8E6E0',
                }}
              >
                Rp
              </span>
              <input
                type="number"
                min={0}
                value={form.limit_kredit || ''}
                onChange={(e) => set('limit_kredit', Number(e.target.value) || 0)}
                placeholder="0"
                className="flex-1 h-9 px-3 text-sm focus:outline-none"
                style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'inherit' }}
              />
            </div>
            {errors.limit_kredit
              ? <p className="text-xs text-red-500 mt-1">{errors.limit_kredit}</p>
              : <p className="text-[11px] mt-1" style={{ color: '#9B9890' }}>Batas maksimal hutang pelanggan ini</p>
            }
          </div>

          {/* Toggle Aktif */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                className="relative rounded-full transition-colors duration-200 flex-shrink-0"
                style={{ width: '36px', height: '20px', backgroundColor: form.aktif ? '#3B6D11' : '#D0CEC8' }}
                onClick={() => set('aktif', !form.aktif)}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                  style={{ transform: form.aktif ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </div>
              <span className="text-sm font-medium" style={{ color: '#1A1A18' }}>
                Pelanggan aktif
              </span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div
          className="flex justify-end gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid #E8E6E0' }}
        >
          <button type="button" className="btn-ghost" onClick={onClose}>Batal</button>
          <button type="submit" form="pelanggan-form" disabled={isPending} className="btn-primary">
            {isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
          </button>
        </div>
      </div>
    </div>
  )
}
