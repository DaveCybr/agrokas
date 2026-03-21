import { useState } from 'react'
import type { Supplier } from '@/types'
import { useBayarHutangSupplier } from '@/hooks/useSupplier'
import { formatRupiah } from '@/lib/utils'

interface Props {
  supplier: Supplier
  onClose: () => void
}

const METODE = ['Tunai', 'Transfer', 'Giro'] as const

export function BayarHutangSupplierModal({ supplier, onClose }: Props) {
  const bayar = useBayarHutangSupplier()
  const [jumlah, setJumlah] = useState('')
  const [metode, setMetode] = useState<'Tunai' | 'Transfer' | 'Giro'>('Transfer')
  const [catatan, setCatatan] = useState('')
  const [error, setError] = useState('')

  const saldo = Number(supplier.saldo_hutang)
  const jml = Number(jumlah.replace(/\D/g, '')) || 0
  const sisaHutang = Math.max(0, saldo - jml)

  function setQuick(v: number) {
    setJumlah(v === 0 ? String(saldo) : String(v))
    setError('')
  }

  async function handleSubmit() {
    if (!jml || jml <= 0) { setError('Jumlah bayar harus > 0'); return }
    try {
      await bayar.mutateAsync({ supplier_id: supplier.id, jumlah: jml, metode, catatan: catatan || undefined })
      onClose()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md" style={{ border: '1px solid #E5E0D5' }} onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #E8E6E0' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#1A1A18' }}>Bayar Hutang — {supplier.nama}</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Saldo info */}
          <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
            <p className="text-xs" style={{ color: '#9B9890' }}>Saldo Hutang</p>
            <p className="text-xl font-bold" style={{ color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
              {formatRupiah(saldo)}
            </p>
          </div>

          {/* Quick amounts */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: '#6B6963' }}>Jumlah Bayar</p>
            <div className="flex gap-2 flex-wrap mb-2">
              {[500_000, 1_000_000, 2_000_000].map(v => (
                <button key={v} onClick={() => setQuick(v)}
                  className="px-3 py-1.5 text-xs rounded-lg" style={{ backgroundColor: '#F0EEE8', color: '#6B6963' }}>
                  {formatRupiah(v)}
                </button>
              ))}
              <button onClick={() => setQuick(0)} disabled={saldo <= 0}
                className="px-3 py-1.5 text-xs rounded-lg font-medium"
                style={{ backgroundColor: saldo > 0 ? '#EAF3DE' : '#F0EEE8', color: saldo > 0 ? '#3B6D11' : '#9B9890', cursor: saldo > 0 ? 'pointer' : 'not-allowed' }}>
                Lunas
              </button>
            </div>
            <input
              value={jumlah}
              onChange={e => { setJumlah(e.target.value.replace(/\D/g, '')); setError('') }}
              placeholder="0"
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
              style={{ borderColor: error ? '#DC2626' : '#D5D3CD', color: '#1A1A18', fontVariantNumeric: 'tabular-nums' }}
            />
          </div>

          {/* Metode */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: '#6B6963' }}>Metode Pembayaran</p>
            <div className="flex gap-2">
              {METODE.map(m => (
                <button key={m} onClick={() => setMetode(m)}
                  className="flex-1 py-2 text-sm rounded-lg font-medium transition-colors"
                  style={metode === m
                    ? { backgroundColor: '#3B6D11', color: '#fff' }
                    : { backgroundColor: '#F0EEE8', color: '#6B6963' }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#6B6963' }}>Catatan</label>
            <input value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Opsional"
              className="w-full px-3 py-2 text-sm rounded-lg border outline-none" style={{ borderColor: '#D5D3CD', color: '#1A1A18' }} />
          </div>

          {/* Preview sisa */}
          {jml > 0 && (
            <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: '#F8F8F6', border: '1px solid #E8E6E0' }}>
              <p className="text-xs" style={{ color: '#9B9890' }}>Sisa hutang setelah bayar</p>
              <p className="text-lg font-bold" style={{ color: sisaHutang > 0 ? '#D97706' : '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>
                {formatRupiah(sisaHutang)}
              </p>
            </div>
          )}

          {error && <p className="text-xs" style={{ color: '#DC2626' }}>{error}</p>}
        </div>

        <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: '1px solid #E8E6E0' }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{ backgroundColor: '#F0EEE8', color: '#6B6963' }}>Batal</button>
          <button onClick={handleSubmit} disabled={bayar.isPending}
            className="px-4 py-2 text-sm font-medium rounded-lg" style={{ backgroundColor: '#3B6D11', color: '#fff' }}>
            {bayar.isPending ? 'Menyimpan...' : 'Bayar'}
          </button>
        </div>
      </div>
    </div>
  )
}
