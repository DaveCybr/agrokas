import { useUpdatePelanggan } from '@/hooks/useCustomers'
import { useToastStore } from '@/store/toastStore'
import { formatRupiah } from '@/lib/utils'
import type { Customer } from '@/types'

interface Props {
  customer: Customer
  onClose: () => void
}

function WarningIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  )
}

export function HapusPelangganDialog({ customer, onClose }: Props) {
  const update = useUpdatePelanggan()
  const addToast = useToastStore((s) => s.addToast)
  const masihBerhutang = customer.saldo_hutang > 0

  async function handleNonaktifkan() {
    try {
      await update.mutateAsync({ id: customer.id, aktif: false })
      addToast(`${customer.nama} dinonaktifkan`, 'success')
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
        className="bg-white rounded-2xl w-full text-center"
        style={{ maxWidth: '360px', border: '1px solid #E8E6E0', padding: '32px 28px' }}
      >
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}
        >
          <WarningIcon />
        </div>

        {/* Title */}
        <h2 className="font-semibold text-base mb-2" style={{ color: '#1A1A18' }}>
          Nonaktifkan Pelanggan?
        </h2>

        {/* Description */}
        <p className="text-sm leading-relaxed mb-4" style={{ color: '#6B6963' }}>
          <strong style={{ color: '#1A1A18' }}>{customer.nama}</strong> tidak akan muncul
          di daftar pelanggan. Data transaksi dan riwayat hutang tetap tersimpan.
        </p>

        {/* Warning jika masih punya hutang */}
        {masihBerhutang && (
          <div
            className="rounded-xl px-4 py-3 mb-4 text-left"
            style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
          >
            <p className="text-sm" style={{ color: '#DC2626' }}>
              ⚠ Pelanggan masih memiliki hutang{' '}
              <strong>{formatRupiah(customer.saldo_hutang)}</strong>.
              Lunasi dulu sebelum menonaktifkan.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onClose}>
            Batal
          </button>
          <button
            className="btn-danger flex-1"
            disabled={update.isPending || masihBerhutang}
            onClick={handleNonaktifkan}
          >
            {update.isPending ? 'Memproses...' : 'Nonaktifkan'}
          </button>
        </div>
      </div>
    </div>
  )
}
