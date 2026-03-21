import { useState } from 'react'
import { useStokOpname } from '@/hooks/useProducts'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { formatRupiah } from '@/lib/utils'
import type { Product } from '@/types'

const ALASAN_OPTIONS = [
  'Koreksi hitung',
  'Barang rusak',
  'Barang hilang',
  'Retur ke supplier',
  'Lainnya',
]

interface Props {
  product: Product
  onClose: () => void
}

export function StokOpnameModal({ product, onClose }: Props) {
  const { user } = useAuthStore()
  const stokOpname = useStokOpname()
  const addToast = useToastStore((s) => s.addToast)

  const [stokBaru, setStokBaru] = useState(product.stok)
  const [alasan, setAlasan] = useState(ALASAN_OPTIONS[0])
  const [catatan, setCatatan] = useState('')

  const selisih = stokBaru - product.stok
  const isPositive = selisih > 0
  const isNegative = selisih < 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (stokBaru < 0) {
      addToast('Stok tidak boleh negatif', 'error')
      return
    }

    try {
      await stokOpname.mutateAsync({
        product_id: product.id,
        stok_lama: product.stok,
        stok_baru: stokBaru,
        alasan,
        catatan: catatan.trim() || undefined,
        kasir: user?.email ?? 'Kasir',
      })
      addToast(`Stok ${product.nama} diperbarui → ${stokBaru} ${product.satuan}`, 'success')
      onClose()
    } catch (err) {
      addToast((err as Error).message, 'error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl w-full flex flex-col"
        style={{ maxWidth: '420px', border: '1px solid #E8E6E0' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #E8E6E0' }}
        >
          <div>
            <h2 className="font-semibold text-sm" style={{ color: '#1A1A18' }}>
              Stok Opname
            </h2>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#9B9890', maxWidth: '280px' }}>
              {product.nama}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form id="opname-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Info stok saat ini */}
          <div
            className="rounded-xl p-3 flex items-center justify-between"
            style={{ backgroundColor: '#F8F8F6', border: '1px solid #E8E6E0' }}
          >
            <div>
              <p className="text-xs font-medium" style={{ color: '#6B6963' }}>Stok tercatat</p>
              <p
                className="text-xl font-bold mt-0.5"
                style={{ color: '#1A1A18', fontVariantNumeric: 'tabular-nums' }}
              >
                {product.stok}
                <span className="text-sm font-normal ml-1" style={{ color: '#9B9890' }}>
                  {product.satuan}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: '#9B9890' }}>Harga jual</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: '#3B6D11' }}>
                {formatRupiah(product.harga_jual)}
              </p>
            </div>
          </div>

          {/* Stok sebenarnya */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: '#6B6963' }}
            >
              Stok Sebenarnya *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                step={0.01}
                required
                value={stokBaru || ''}
                onChange={(e) => setStokBaru(Number(e.target.value) || 0)}
                className="input"
                autoFocus
                style={{ fontVariantNumeric: 'tabular-nums' }}
              />
              <span className="text-sm flex-shrink-0" style={{ color: '#9B9890' }}>
                {product.satuan}
              </span>
            </div>
          </div>

          {/* Selisih */}
          {selisih !== 0 && (
            <div
              className="rounded-lg px-4 py-2.5 flex items-center justify-between"
              style={{
                backgroundColor: isPositive ? '#EAF3DE' : '#FEF2F2',
                border: `1px solid ${isPositive ? '#3B6D11' : '#DC2626'}`,
              }}
            >
              <span className="text-xs font-medium" style={{ color: isPositive ? '#3B6D11' : '#DC2626' }}>
                Selisih
              </span>
              <span
                className="text-base font-bold"
                style={{
                  color: isPositive ? '#3B6D11' : '#DC2626',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {isPositive ? '+' : ''}{selisih} {product.satuan}
              </span>
            </div>
          )}
          {selisih === 0 && stokBaru === product.stok && (
            <div
              className="rounded-lg px-4 py-2.5 flex items-center justify-center"
              style={{ backgroundColor: '#F8F8F6', border: '1px solid #E8E6E0' }}
            >
              <span className="text-xs" style={{ color: '#9B9890' }}>Tidak ada perubahan stok</span>
            </div>
          )}

          {/* Alasan */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: '#6B6963' }}
            >
              Alasan *
            </label>
            <select
              required
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              className="input"
              style={{ height: '36px' }}
            >
              {ALASAN_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Catatan */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: '#6B6963' }}
            >
              Catatan
            </label>
            <textarea
              rows={2}
              placeholder="Opsional"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="input h-auto"
              style={{ height: 'auto', padding: '8px 12px', resize: 'none' }}
            />
          </div>
        </form>

        {/* Footer */}
        <div
          className="flex justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid #E8E6E0' }}
        >
          <button type="button" className="btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            form="opname-form"
            disabled={stokOpname.isPending || selisih === 0}
            className="btn-primary"
          >
            {stokOpname.isPending ? 'Menyimpan...' : 'Simpan Opname'}
          </button>
        </div>
      </div>
    </div>
  )
}
