import { useState, useEffect } from 'react'
import { useCategories, useTambahProduk, useUpdateProduk } from '@/hooks/useProducts'
import { useToastStore } from '@/store/toastStore'
import type { Product } from '@/types'
import { SATUAN_OPTIONS } from '@/lib/constants'

interface FormState {
  nama: string
  category_id: string
  satuan: string
  harga_beli: number
  harga_jual: number
  harga_grosir: string
  min_grosir: string
  stok: number
  stok_minimum: number
  kode: string
  no_registrasi: string
  expired_date: string
  deskripsi: string
  aktif: boolean
}

const EMPTY_FORM: FormState = {
  nama: '',
  category_id: '',
  satuan: 'pcs',
  harga_beli: 0,
  harga_jual: 0,
  harga_grosir: '',
  min_grosir: '',
  stok: 0,
  stok_minimum: 5,
  kode: '',
  no_registrasi: '',
  expired_date: '',
  deskripsi: '',
  aktif: true,
}

interface Props {
  product?: Product | null
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

function RpInput({
  value,
  onChange,
  placeholder = '0',
  required,
}: {
  value: number
  onChange: (v: number) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div
      className="flex items-center overflow-hidden rounded-lg"
      style={{ border: '1px solid #E8E6E0' }}
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
        required={required}
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        placeholder={placeholder}
        className="flex-1 h-9 px-3 text-sm focus:outline-none"
        style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'inherit' }}
      />
    </div>
  )
}

export function ProdukModal({ product, onClose }: Props) {
  const isEdit = !!product
  const { data: categories = [] } = useCategories()
  const tambah = useTambahProduk()
  const update = useUpdateProduk()
  const addToast = useToastStore((s) => s.addToast)

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  useEffect(() => {
    if (product) {
      setForm({
        nama: product.nama,
        category_id: product.category_id ?? '',
        satuan: product.satuan,
        harga_beli: product.harga_beli,
        harga_jual: product.harga_jual,
        harga_grosir: product.harga_grosir?.toString() ?? '',
        min_grosir: product.min_grosir?.toString() ?? '',
        stok: product.stok,
        stok_minimum: product.stok_minimum,
        kode: product.kode ?? '',
        no_registrasi: product.no_registrasi ?? '',
        expired_date: product.expired_date ?? '',
        deskripsi: product.deskripsi ?? '',
        aktif: product.aktif,
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
  }, [product])

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.nama.trim()) errs.nama = 'Wajib diisi'
    if (!form.satuan) errs.satuan = 'Wajib dipilih'
    if (form.harga_beli > 0 && form.harga_jual < form.harga_beli) errs.harga_jual = 'Harga jual tidak boleh lebih kecil dari harga beli'
    if (form.harga_jual <= 0) errs.harga_jual = 'Harus > 0'
    if (form.harga_grosir && Number(form.harga_grosir) >= form.harga_jual)
      errs.harga_grosir = 'Harus lebih kecil dari harga jual'
    if (form.harga_grosir && !form.min_grosir)
      errs.min_grosir = 'Wajib diisi jika harga grosir diisi'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      nama: form.nama.trim(),
      category_id: form.category_id || null,
      satuan: form.satuan,
      harga_beli: form.harga_beli,
      harga_jual: form.harga_jual,
      harga_grosir: form.harga_grosir ? Number(form.harga_grosir) : null,
      min_grosir: form.min_grosir ? Number(form.min_grosir) : null,
      stok: form.stok,
      stok_minimum: form.stok_minimum,
      kode: form.kode.trim() || null,
      no_registrasi: form.no_registrasi.trim() || null,
      expired_date: form.expired_date || null,
      deskripsi: form.deskripsi.trim() || null,
      aktif: form.aktif,
    }

    try {
      if (isEdit && product) {
        await update.mutateAsync({ id: product.id, ...payload })
        addToast(`${form.nama} berhasil diperbarui`, 'success')
      } else {
        await tambah.mutateAsync(payload as any)
        addToast(`${form.nama} berhasil ditambahkan`, 'success')
      }
      onClose()
    } catch (err) {
      addToast((err as Error).message, 'error')
    }
  }

  const isPending = tambah.isPending || update.isPending

  const inputCls = (key: keyof FormState) =>
    `input ${errors[key] ? 'border-red-400' : ''}`

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
            {isEdit ? 'Edit Produk' : 'Tambah Produk'}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form
          id="produk-form"
          onSubmit={handleSubmit}
          className="overflow-y-auto px-6 py-5 space-y-4 flex-1"
        >
          {/* Nama */}
          <div>
            <Label>Nama Produk *</Label>
            <input
              className={inputCls('nama')}
              placeholder="Contoh: Urea Pusri 50kg"
              value={form.nama}
              onChange={(e) => set('nama', e.target.value)}
              autoFocus
            />
            {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
          </div>

          {/* Kategori + Satuan */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Kategori</Label>
              <select
                className={inputCls('category_id')}
                value={form.category_id}
                onChange={(e) => set('category_id', e.target.value)}
                style={{ height: '36px' }}
              >
                <option value="">Pilih kategori...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.nama}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-xs text-red-500 mt-1">{errors.category_id}</p>
              )}
            </div>
            <div>
              <Label>Satuan *</Label>
              <select
                className={inputCls('satuan')}
                value={form.satuan}
                onChange={(e) => set('satuan', e.target.value)}
                style={{ height: '36px' }}
              >
                <option value="">-- Pilih --</option>
                {SATUAN_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                {form.satuan && !SATUAN_OPTIONS.includes(form.satuan) && (
                  <option value={form.satuan}>{form.satuan}</option>
                )}
              </select>
              {errors.satuan && (
                <p className="text-xs text-red-500 mt-1">{errors.satuan}</p>
              )}
            </div>
          </div>

          {/* Harga Beli + Harga Jual */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Harga Beli (HPP)</Label>
              <RpInput value={form.harga_beli} onChange={(v) => set('harga_beli', v)} />
            </div>
            <div>
              <Label>Harga Jual *</Label>
              <RpInput
                value={form.harga_jual}
                onChange={(v) => set('harga_jual', v)}
                required
              />
              {errors.harga_jual && (
                <p className="text-xs text-red-500 mt-1">{errors.harga_jual}</p>
              )}
            </div>
          </div>

          {/* Harga Grosir + Min Grosir */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Harga Grosir</Label>
              <RpInput
                value={form.harga_grosir ? Number(form.harga_grosir) : 0}
                onChange={(v) => set('harga_grosir', v ? String(v) : '')}
                placeholder="Opsional"
              />
              {errors.harga_grosir && (
                <p className="text-xs text-red-500 mt-1">{errors.harga_grosir}</p>
              )}
            </div>
            <div>
              <Label>Min. Qty Grosir</Label>
              <input
                type="number"
                min={1}
                className={inputCls('min_grosir')}
                placeholder="Min. qty untuk harga grosir"
                value={form.min_grosir}
                onChange={(e) => set('min_grosir', e.target.value)}
              />
              {errors.min_grosir && (
                <p className="text-xs text-red-500 mt-1">{errors.min_grosir}</p>
              )}
            </div>
          </div>

          {/* Stok + Stok Minimum */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Stok Saat Ini *</Label>
              <input
                type="number"
                min={0}
                step={0.01}
                className="input"
                value={form.stok || ''}
                onChange={(e) => set('stok', Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Stok Minimum *</Label>
              <input
                type="number"
                min={0}
                step={0.01}
                className="input"
                value={form.stok_minimum || ''}
                onChange={(e) => set('stok_minimum', Number(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Kode + No. Registrasi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Kode / Barcode</Label>
              <input
                className="input font-mono"
                placeholder="Opsional"
                value={form.kode}
                onChange={(e) => set('kode', e.target.value)}
              />
            </div>
            <div>
              <Label>No. Reg. Kementan</Label>
              <input
                className="input"
                placeholder="Opsional"
                value={form.no_registrasi}
                onChange={(e) => set('no_registrasi', e.target.value)}
              />
            </div>
          </div>

          {/* Expired Date */}
          <div>
            <Label>Tanggal Kadaluarsa</Label>
            <input
              type="date"
              className="input"
              value={form.expired_date}
              onChange={(e) => set('expired_date', e.target.value)}
            />
            <p className="text-[11px] mt-1" style={{ color: '#9B9890' }}>
              Opsional — untuk pestisida & benih
            </p>
          </div>

          {/* Deskripsi */}
          <div>
            <Label>Deskripsi</Label>
            <textarea
              className="input h-auto"
              rows={3}
              placeholder="Opsional"
              value={form.deskripsi}
              onChange={(e) => set('deskripsi', e.target.value)}
              style={{ height: 'auto', padding: '8px 12px', resize: 'none' }}
            />
          </div>

          {/* Toggle Aktif */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                className="relative rounded-full transition-colors duration-200 flex-shrink-0"
                style={{
                  width: '36px', height: '20px',
                  backgroundColor: form.aktif ? '#3B6D11' : '#D0CEC8',
                }}
                onClick={() => set('aktif', !form.aktif)}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                  style={{ transform: form.aktif ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </div>
              <span className="text-sm font-medium" style={{ color: '#1A1A18' }}>
                Produk aktif (tampil di kasir)
              </span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div
          className="flex justify-end gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid #E8E6E0' }}
        >
          <button type="button" className="btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            form="produk-form"
            disabled={isPending}
            className="btn-primary"
          >
            {isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
          </button>
        </div>
      </div>
    </div>
  )
}
