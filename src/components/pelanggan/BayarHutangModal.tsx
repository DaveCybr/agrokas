import { useState } from 'react'
import { useBayarHutang } from '@/hooks/useCustomers'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { formatRupiah } from '@/lib/utils'
import type { Customer } from '@/types'

type Metode = 'Tunai' | 'Transfer' | 'QRIS'

interface Props {
  customer: Customer
  onClose: () => void
}

export function BayarHutangModal({ customer, onClose }: Props) {
  const { user } = useAuthStore()
  const bayar = useBayarHutang()
  const addToast = useToastStore((s) => s.addToast)

  const [jumlah, setJumlah] = useState(0)
  const [metode, setMetode] = useState<Metode>('Tunai')
  const [catatan, setCatatan] = useState('')

  const sisaHutang = customer.saldo_hutang - jumlah

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (jumlah <= 0) { addToast('Jumlah bayar harus lebih dari 0', 'error'); return }
    if (jumlah > customer.saldo_hutang) { addToast('Tidak boleh melebihi saldo hutang', 'error'); return }

    try {
      await bayar.mutateAsync({
        customer_id: customer.id,
        jumlah,
        metode,
        catatan: catatan.trim() || undefined,
        kasir: user?.email ?? 'Kasir',
      })
      addToast(`Pembayaran ${formatRupiah(jumlah)} berhasil dicatat`, 'success')
      onClose()
    } catch (err) {
      addToast((err as Error).message, 'error')
    }
  }

  const QUICK = [100_000, 200_000, 500_000]
  const metodeBase: React.CSSProperties = {
    height: '34px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
    fontFamily: 'inherit', cursor: 'pointer', transition: 'all 150ms',
    border: '1px solid #E8E6E0', flex: 1,
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
              Catat Pembayaran Hutang
            </h2>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#9B9890', maxWidth: '280px' }}>
              {customer.nama}
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
        <form id="bayar-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Info hutang */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: '#9B9890' }}>Saldo Hutang</p>
            <p className="text-2xl font-bold" style={{ color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
              {formatRupiah(customer.saldo_hutang)}
            </p>
            <p className="text-xs mt-1" style={{ color: '#9B9890' }}>
              Limit: {formatRupiah(customer.limit_kredit)}
            </p>
          </div>

          {/* Jumlah bayar */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: '#6B6963' }}
            >
              Jumlah Bayar *
            </label>
            <div
              className="flex items-center overflow-hidden rounded-lg"
              style={{ border: '1px solid #E8E6E0' }}
            >
              <span
                className="px-3 h-9 flex items-center text-sm flex-shrink-0"
                style={{ backgroundColor: '#F8F8F6', color: '#9B9890', borderRight: '1px solid #E8E6E0' }}
              >
                Rp
              </span>
              <input
                type="number"
                min={1}
                max={customer.saldo_hutang}
                required
                value={jumlah || ''}
                onChange={(e) => setJumlah(Number(e.target.value) || 0)}
                placeholder="0"
                className="flex-1 h-9 px-3 text-sm focus:outline-none"
                style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'inherit' }}
                autoFocus
              />
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2 mt-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setJumlah(q)}
                  className="flex-1 text-xs font-medium rounded-lg transition-colors"
                  style={{
                    height: '28px',
                    border: `1px solid ${jumlah === q ? '#3B6D11' : '#E8E6E0'}`,
                    backgroundColor: jumlah === q ? '#EAF3DE' : 'white',
                    color: jumlah === q ? '#3B6D11' : '#6B6963',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  {q >= 1_000_000 ? `${q / 1_000_000}jt` : `${q / 1_000}rb`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setJumlah(customer.saldo_hutang)}
                className="flex-1 text-xs font-medium rounded-lg transition-colors"
                style={{
                  height: '28px',
                  border: `1px solid ${jumlah === customer.saldo_hutang ? '#3B6D11' : '#E8E6E0'}`,
                  backgroundColor: jumlah === customer.saldo_hutang ? '#EAF3DE' : 'white',
                  color: jumlah === customer.saldo_hutang ? '#3B6D11' : '#6B6963',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                Lunas
              </button>
            </div>
          </div>

          {/* Metode */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
              style={{ color: '#6B6963' }}
            >
              Metode Pembayaran *
            </label>
            <div className="flex gap-2">
              {(['Tunai', 'Transfer', 'QRIS'] as Metode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetode(m)}
                  style={{
                    ...metodeBase,
                    backgroundColor: metode === m ? '#EAF3DE' : 'white',
                    borderColor: metode === m ? '#3B6D11' : '#E8E6E0',
                    color: metode === m ? '#3B6D11' : '#6B6963',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
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
              placeholder="No. transfer, keterangan, dll"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="input h-auto"
              style={{ height: 'auto', padding: '8px 12px', resize: 'none' }}
            />
          </div>

          {/* Preview */}
          {jumlah > 0 && (
            <div
              className="rounded-xl p-4 space-y-2"
              style={{ backgroundColor: '#F8F8F6', border: '1px solid #E8E6E0' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9B9890' }}>
                Setelah pembayaran
              </p>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6B6963' }}>Saldo lama</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: '#1A1A18' }}>
                  {formatRupiah(customer.saldo_hutang)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: '#6B6963' }}>Dibayar</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: '#DC2626', fontWeight: 600 }}>
                  − {formatRupiah(jumlah)}
                </span>
              </div>
              <div
                className="flex justify-between text-sm font-semibold pt-2"
                style={{ borderTop: '1px solid #E8E6E0' }}
              >
                <span style={{ color: '#1A1A18' }}>Sisa hutang</span>
                <span
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    color: sisaHutang <= 0 ? '#3B6D11' : '#DC2626',
                  }}
                >
                  {formatRupiah(Math.max(0, sisaHutang))}
                </span>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div
          className="flex justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid #E8E6E0' }}
        >
          <button type="button" className="btn-ghost" onClick={onClose}>Batal</button>
          <button
            type="submit"
            form="bayar-form"
            disabled={bayar.isPending || jumlah <= 0 || jumlah > customer.saldo_hutang}
            className="btn-primary"
          >
            {bayar.isPending ? 'Menyimpan...' : 'Catat Pembayaran'}
          </button>
        </div>
      </div>
    </div>
  )
}
