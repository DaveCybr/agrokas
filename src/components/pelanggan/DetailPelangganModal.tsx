import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatRupiah, getInitials } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import type { Customer, Transaction } from '@/types'

interface DebtPayment {
  id: string
  customer_id: string
  jumlah: number
  metode: string
  catatan: string | null
  kasir: string
  created_at: string
}

interface Props {
  customer: Customer
  onEdit: () => void
  onBayar: () => void
  onClose: () => void
}

type Tab = 'ringkasan' | 'transaksi' | 'bayar-hutang'

function useTransaksiPelanggan(customerId: string) {
  return useQuery<Transaction[]>({
    queryKey: ['transactions-customer', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data as Transaction[]
    },
    staleTime: 30_000,
  })
}

function useRiwayatBayar(customerId: string) {
  return useQuery<DebtPayment[]>({
    queryKey: ['debt-payments-customer', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('debt_payments')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data as DebtPayment[]
    },
    staleTime: 30_000,
  })
}

function formatTanggal(isoStr: string) {
  return new Date(isoStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
function formatJam(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit',
  })
}
function formatBulan(isoStr: string) {
  return new Date(isoStr).toLocaleDateString('id-ID', {
    month: 'short', year: 'numeric',
  })
}

export function DetailPelangganModal({ customer, onEdit, onBayar, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('ringkasan')
  const { data: transaksi = [], isLoading: txLoading } = useTransaksiPelanggan(customer.id)
  const { data: riwayatBayar = [], isLoading: bayarLoading } = useRiwayatBayar(customer.id)

  const persen = customer.limit_kredit > 0
    ? Math.min(100, (customer.saldo_hutang / customer.limit_kredit) * 100)
    : 0

  const TAB_LIST: { key: Tab; label: string }[] = [
    { key: 'ringkasan', label: 'Ringkasan' },
    { key: 'transaksi', label: 'Riwayat Transaksi' },
    { key: 'bayar-hutang', label: 'Riwayat Bayar Hutang' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl w-full overflow-hidden flex flex-col"
        style={{ maxWidth: '560px', maxHeight: '90vh', border: '1px solid #E8E6E0' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #E8E6E0' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: '#EAF3DE', color: '#3B6D11' }}
            >
              {getInitials(customer.nama)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm" style={{ color: '#1A1A18' }}>
                  {customer.nama}
                </h2>
                <Badge variant={customer.tipe === 'poktan' ? 'blue' : customer.tipe === 'agen' ? 'amber' : 'gray'}>
                  {customer.tipe}
                </Badge>
              </div>
              <p className="text-xs mt-0.5" style={{ color: '#9B9890' }}>
                {customer.desa ? `${customer.desa}${customer.kecamatan ? `, ${customer.kecamatan}` : ''}` : 'Lokasi tidak diisi'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="btn-ghost text-xs"
              style={{ height: '30px', padding: '0 12px' }}
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex flex-shrink-0 px-6"
          style={{ borderBottom: '1px solid #E8E6E0' }}
        >
          {TAB_LIST.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
              style={{
                borderColor: tab === t.key ? '#3B6D11' : 'transparent',
                color: tab === t.key ? '#3B6D11' : '#9B9890',
                fontFamily: 'inherit',
                cursor: 'pointer',
                background: 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">

          {/* ── Tab: Ringkasan ── */}
          {tab === 'ringkasan' && (
            <div className="px-6 py-5 space-y-4">
              {/* Info grid */}
              <div
                className="rounded-xl p-4 grid grid-cols-2 gap-3"
                style={{ backgroundColor: '#F8F8F6', border: '1px solid #E8E6E0' }}
              >
                {[
                  { label: 'Nomor HP', value: customer.telp ?? '—' },
                  { label: 'Desa', value: customer.desa ?? '—' },
                  { label: 'Kecamatan', value: customer.kecamatan ?? '—' },
                  { label: 'Komoditas', value: customer.komoditas ?? '—' },
                  { label: 'Luas Lahan', value: customer.luas_lahan ? `${customer.luas_lahan} ha` : '—' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#9B9890' }}>
                      {item.label}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: '#1A1A18' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Kartu hutang */}
              <div
                className="rounded-xl p-4"
                style={{ border: '1px solid #E8E6E0' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#9B9890' }}>Saldo Hutang</p>
                    <p
                      className="text-xl font-bold mt-0.5"
                      style={{
                        color: customer.saldo_hutang > 0 ? '#DC2626' : '#3B6D11',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatRupiah(customer.saldo_hutang)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium" style={{ color: '#9B9890' }}>Limit Kredit</p>
                    <p
                      className="text-sm font-semibold mt-0.5"
                      style={{ color: '#1A1A18', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatRupiah(customer.limit_kredit)}
                    </p>
                  </div>
                </div>

                {customer.limit_kredit > 0 && (
                  <>
                    <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: '#F0EEE8' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${persen}%`,
                          backgroundColor: persen > 80 ? '#DC2626' : persen > 50 ? '#D97706' : '#3B6D11',
                        }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: '#9B9890' }}>
                      Sisa limit: {formatRupiah(Math.max(0, customer.limit_kredit - customer.saldo_hutang))}
                    </p>
                  </>
                )}

                {customer.saldo_hutang > 0 && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid #E8E6E0' }}>
                    <button
                      onClick={onBayar}
                      className="btn-primary text-xs w-full"
                      style={{ height: '32px' }}
                    >
                      Catat Pembayaran →
                    </button>
                  </div>
                )}
              </div>

              {/* Alamat jika ada */}
              {customer.alamat && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#9B9890' }}>
                    Alamat
                  </p>
                  <p className="text-sm" style={{ color: '#6B6963' }}>{customer.alamat}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Riwayat Transaksi ── */}
          {tab === 'transaksi' && (
            <div className="py-2">
              {txLoading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : transaksi.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <p className="text-sm" style={{ color: '#9B9890' }}>Belum ada transaksi</p>
                </div>
              ) : (
                transaksi.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between px-6 py-3"
                    style={{ borderBottom: '1px solid #F0EEE8' }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#1A1A18' }}>
                        {tx.no_transaksi}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#9B9890' }}>
                        {formatTanggal(tx.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={tx.status === 'selesai' ? 'green' : tx.status === 'batal' ? 'red' : 'amber'}>
                        {tx.status}
                      </Badge>
                      <Badge variant="gray">{tx.metode_bayar}</Badge>
                      <p
                        className="text-sm font-bold"
                        style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {formatRupiah(tx.total)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Tab: Riwayat Bayar Hutang ── */}
          {tab === 'bayar-hutang' && (
            <div className="py-2">
              {bayarLoading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : riwayatBayar.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <p className="text-sm" style={{ color: '#9B9890' }}>Belum ada riwayat pembayaran hutang</p>
                </div>
              ) : (
                riwayatBayar.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-6 py-3"
                    style={{ borderBottom: '1px solid #F0EEE8' }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#1A1A18' }}>
                        {formatTanggal(p.created_at)}
                        <span className="ml-2 font-normal text-xs" style={{ color: '#9B9890' }}>
                          {formatJam(p.created_at)}
                        </span>
                      </p>
                      {p.catatan && (
                        <p className="text-xs mt-0.5" style={{ color: '#9B9890' }}>{p.catatan}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="gray">{p.metode}</Badge>
                      <p
                        className="text-sm font-bold"
                        style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}
                      >
                        + {formatRupiah(p.jumlah)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
