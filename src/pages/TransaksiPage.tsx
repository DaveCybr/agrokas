import { useState, useMemo } from 'react'
import { formatRupiah } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import { useToastStore } from '@/store/toastStore'
import { useTransactions, useVoidTransaction } from '@/hooks/useTransactions'
import { useDebounce } from '@/hooks/useDebounce'
import type { Transaction } from '@/types'

// ── Icons ─────────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Void Modal ────────────────────────────────────────────────────────────────
interface VoidModalProps {
  trx: Transaction
  onClose: () => void
  onConfirm: (alasan: string) => void
  loading: boolean
}

function VoidModal({ trx, onClose, onConfirm, loading }: VoidModalProps) {
  const [alasan, setAlasan] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(26,26,24,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E8E6E0' }}>
          <div>
            <h2 className="font-semibold text-sm" style={{ color: '#1A1A18' }}>Batalkan Transaksi</h2>
            <p className="text-xs mt-0.5" style={{ color: '#9B9890' }}>{trx.no_transaksi}</p>
          </div>
          <button onClick={onClose} style={{ color: '#9B9890' }}><XIcon /></button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Summary */}
          <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#6B6963' }}>Pelanggan</span>
              <span className="font-medium" style={{ color: '#1A1A18' }}>{trx.customers?.nama ?? 'Tamu Umum'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#6B6963' }}>Total</span>
              <span className="font-bold" style={{ color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(Number(trx.total))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#6B6963' }}>Metode</span>
              <span className="font-medium" style={{ color: '#1A1A18' }}>{trx.metode_bayar}</span>
            </div>
          </div>

          {trx.metode_bayar === 'Hutang' && (
            <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}>
              Saldo hutang pelanggan akan dikurangi {formatRupiah(Number(trx.total))} secara otomatis.
            </div>
          )}

          <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}>
            Stok produk akan dikembalikan sesuai qty transaksi ini.
          </div>

          {/* Alasan */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B6963' }}>
              Alasan pembatalan <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <textarea
              className="input resize-none"
              style={{ height: '80px' }}
              placeholder="Contoh: Salah input produk, pelanggan membatalkan pesanan..."
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4" style={{ borderTop: '1px solid #E8E6E0' }}>
          <button className="btn-ghost text-sm" onClick={onClose} disabled={loading}>Tutup</button>
          <button
            className="text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
            style={{
              backgroundColor: alasan.trim() ? '#DC2626' : '#F0EEE8',
              color: alasan.trim() ? 'white' : '#9B9890',
              fontFamily: 'inherit',
              cursor: alasan.trim() && !loading ? 'pointer' : 'not-allowed',
            }}
            disabled={!alasan.trim() || loading}
            onClick={() => onConfirm(alasan.trim())}
          >
            {loading ? 'Membatalkan...' : 'Batalkan Transaksi'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Detail Row ────────────────────────────────────────────────────────────────
function DetailRow({ trx }: { trx: Transaction }) {
  return (
    <tr style={{ backgroundColor: '#FAFAF8' }}>
      <td colSpan={7} className="px-5 py-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold mb-2" style={{ color: '#6B6963' }}>Detail Item</p>
          <table className="w-full text-xs">
            <thead>
              <tr>
                {['Produk', 'Qty', 'Harga', 'Subtotal'].map((h) => (
                  <th key={h} className="text-left pb-1.5 font-medium" style={{ color: '#9B9890' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trx.transaction_items?.map((item) => (
                <tr key={item.id}>
                  <td className="py-1" style={{ color: '#1A1A18' }}>{item.nama_produk}</td>
                  <td className="py-1" style={{ color: '#6B6963' }}>{item.qty} {item.satuan}</td>
                  <td className="py-1" style={{ color: '#6B6963', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(item.harga_jual)}</td>
                  <td className="py-1 font-medium" style={{ color: '#1A1A18', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {trx.catatan && (
            <p className="text-xs mt-2 pt-2" style={{ borderTop: '1px solid #E8E6E0', color: '#6B6963' }}>
              Alasan batal: <span style={{ color: '#DC2626' }}>{trx.catatan}</span>
            </p>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function TransaksiPage() {
  const addToast = useToastStore((s) => s.addToast)
  const voidMutation = useVoidTransaction()

  const today = toISO(new Date())
  const [from, setFrom] = useState(today)
  const [to, setTo]     = useState(today)
  const [search, setSearch]   = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [voidTarget, setVoidTarget] = useState<Transaction | null>(null)

  const debouncedSearch = useDebounce(search, 300)
  const { data: transactions, isLoading } = useTransactions(from, to, debouncedSearch)

  const stats = useMemo(() => {
    const selesai = (transactions ?? []).filter((t) => t.status === 'selesai')
    const batal   = (transactions ?? []).filter((t) => t.status === 'batal')
    return {
      total: selesai.reduce((s, t) => s + Number(t.total), 0),
      count: selesai.length,
      batal: batal.length,
    }
  }, [transactions])

  async function handleVoid(alasan: string) {
    if (!voidTarget) return
    try {
      await voidMutation.mutateAsync({ id: voidTarget.id, alasan })
      addToast(`Transaksi ${voidTarget.no_transaksi} berhasil dibatalkan`, 'success')
      setVoidTarget(null)
    } catch (err) {
      addToast('Gagal membatalkan: ' + (err as Error).message, 'error')
    }
  }

  return (
    <div className="px-8 py-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-lg font-semibold" style={{ color: '#1A1A18' }}>Riwayat Transaksi</h1>
        <p className="text-xs mt-0.5" style={{ color: '#9B9890' }}>Cari, lihat detail, dan batalkan transaksi penjualan</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <input
            type="date" value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-xs border rounded-lg px-2 py-1.5 outline-none"
            style={{ borderColor: '#D5D3CD', color: '#1A1A18' }}
          />
          <span className="text-xs" style={{ color: '#9B9890' }}>—</span>
          <input
            type="date" value={to} min={from}
            onChange={(e) => setTo(e.target.value)}
            className="text-xs border rounded-lg px-2 py-1.5 outline-none"
            style={{ borderColor: '#D5D3CD', color: '#1A1A18' }}
          />
        </div>

        {/* Quick presets */}
        {([
          ['Hari ini', today, today],
          ['7 hari', toISO(new Date(Date.now() - 6 * 86400000)), today],
          ['Bulan ini', toISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), today],
        ] as [string, string, string][]).map(([label, f, t]) => (
          <button
            key={label}
            onClick={() => { setFrom(f); setTo(t) }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={
              from === f && to === t
                ? { backgroundColor: '#3B6D11', color: '#fff' }
                : { backgroundColor: '#F0EEE8', color: '#6B6963' }
            }
          >
            {label}
          </button>
        ))}

        {/* Search */}
        <div className="relative ml-auto">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#9B9890' }}>
            <SearchIcon />
          </span>
          <input
            className="input text-xs pl-8"
            style={{ width: '220px', height: '34px' }}
            placeholder="No. transaksi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: '#9B9890' }}
              onClick={() => setSearch('')}
            >
              <XIcon />
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9B9890' }}>Omzet</p>
            <p className="text-xl font-bold mt-1" style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(stats.total)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9B9890' }}>Transaksi Selesai</p>
            <p className="text-xl font-bold mt-1" style={{ color: '#1A1A18' }}>{stats.count} transaksi</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9B9890' }}>Dibatalkan</p>
            <p className="text-xl font-bold mt-1" style={{ color: stats.batal > 0 ? '#DC2626' : '#9B9890' }}>{stats.batal} transaksi</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: '#F8F8F6' }}>
              <tr>
                {['', 'No. Transaksi', 'Waktu', 'Pelanggan', 'Metode', 'Total', 'Status', 'Aksi'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9B9890' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions?.map((trx) => {
                const isExpanded = expandedId === trx.id
                const isBatal = trx.status === 'batal'
                return (
                  <>
                    <tr
                      key={trx.id}
                      style={{ borderBottom: isExpanded ? 'none' : '1px solid #F0EEE8', opacity: isBatal ? 0.6 : 1 }}
                      onMouseEnter={(e) => !isExpanded && (e.currentTarget.style.backgroundColor = '#F8F8F6')}
                      onMouseLeave={(e) => !isExpanded && (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Expand toggle */}
                      <td className="pl-4 pr-1 py-3 w-6">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : trx.id)}
                          style={{ color: '#9B9890' }}
                        >
                          <ChevronIcon open={isExpanded} />
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-medium" style={{ color: '#1A1A18' }}>
                        {trx.no_transaksi}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B6963' }}>
                        {formatDateTime(trx.created_at)}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#1A1A18' }}>
                        {trx.customers?.nama ?? 'Tamu Umum'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: trx.metode_bayar === 'Hutang' ? '#FEF2F2' : '#F0F7E8',
                            color: trx.metode_bayar === 'Hutang' ? '#DC2626' : '#3B6D11',
                          }}
                        >
                          {trx.metode_bayar}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: '#1A1A18', fontVariantNumeric: 'tabular-nums' }}>
                        {formatRupiah(Number(trx.total))}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={
                            trx.status === 'selesai'
                              ? { backgroundColor: '#EAF3DE', color: '#3B6D11' }
                              : trx.status === 'batal'
                              ? { backgroundColor: '#FEF2F2', color: '#DC2626' }
                              : { backgroundColor: '#FFFBEB', color: '#D97706' }
                          }
                        >
                          {trx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {trx.status === 'selesai' && (
                          <button
                            onClick={() => setVoidTarget(trx)}
                            className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
                            style={{
                              border: '1px solid #FECACA',
                              color: '#DC2626',
                              backgroundColor: 'white',
                              fontFamily: 'inherit',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white' }}
                          >
                            Batalkan
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && <DetailRow key={`detail-${trx.id}`} trx={trx} />}
                  </>
                )
              })}
              {!transactions?.length && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-sm" style={{ color: '#9B9890' }}>
                    Tidak ada transaksi pada periode ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Void Modal */}
      {voidTarget && (
        <VoidModal
          trx={voidTarget}
          onClose={() => setVoidTarget(null)}
          onConfirm={handleVoid}
          loading={voidMutation.isPending}
        />
      )}
    </div>
  )
}
