import { useState, useMemo, Fragment } from 'react'
import { useSuppliers, useAllSuppliers, usePurchaseOrders, useGoodsReceipts, useUpdatePOStatus, useSupplierPayments, useSupplierReceipts } from '@/hooks/useSupplier'
import { SupplierModal } from '@/components/supplier/SupplierModal'
import { BayarHutangSupplierModal } from '@/components/supplier/BayarHutangSupplierModal'
import { BuatPOModal } from '@/components/supplier/BuatPOModal'
import { DetailPOModal } from '@/components/supplier/DetailPOModal'
import { TerimaBarangModal } from '@/components/supplier/TerimaBarangModal'
import type { Supplier, PurchaseOrder } from '@/types'
import { formatRupiah, formatDate } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'

type Tab = 'supplier' | 'po' | 'terima' | 'hutang'

const PO_STATUSES = [
  { key: '', label: 'Semua' },
  { key: 'draft', label: 'Draft' },
  { key: 'dikirim', label: 'Dikirim' },
  { key: 'sebagian', label: 'Sebagian' },
  { key: 'selesai', label: 'Selesai' },
  { key: 'batal', label: 'Batal' },
]
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:    { bg: '#F3F4F6', color: '#4B5563' },
  dikirim:  { bg: '#EFF6FF', color: '#1D4ED8' },
  sebagian: { bg: '#FFFBEB', color: '#B45309' },
  selesai:  { bg: '#EAF3DE', color: '#1B4332' },
  batal:    { bg: '#FEF2F2', color: '#DC2626' },
}

function SupplierInitial({ nama }: { nama: string }) {
  const initial = nama?.[0]?.toUpperCase() ?? 'S'
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
      style={{ backgroundColor: '#EAF3DE', color: '#3B6D11' }}>
      {initial}
    </div>
  )
}

// ── Hutang timeline per supplier ─────────────────────────────────────────────
function SupplierHutangDetail({ supplier }: { supplier: Supplier }) {
  const { data: payments, isLoading: lpay } = useSupplierPayments(supplier.id)
  const { data: receipts, isLoading: lrec } = useSupplierReceipts(supplier.id)

  const timeline = useMemo(() => {
    const events = [
      ...(receipts ?? []).filter((r: any) => r.metode_bayar === 'Hutang').map((r: any) => ({
        date: r.tanggal, label: `Pembelian ${r.no_terima}`, amount: Number(r.total), type: 'debit' as const,
      })),
      ...(payments ?? []).map((p: any) => ({
        date: p.created_at.slice(0, 10), label: `Bayar hutang (${p.metode})`, amount: Number(p.jumlah), type: 'kredit' as const,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date))
    return events
  }, [receipts, payments])

  if (lpay || lrec) return <div className="py-4 flex justify-center"><Spinner /></div>

  if (!timeline.length) return (
    <p className="py-4 text-center text-xs" style={{ color: '#9B9890' }}>Belum ada riwayat hutang</p>
  )

  return (
    <div className="space-y-1">
      {timeline.map((ev, i) => (
        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ backgroundColor: '#F8F8F6' }}>
          <div>
            <p className="text-xs font-medium" style={{ color: '#1A1A18' }}>{ev.label}</p>
            <p className="text-xs" style={{ color: '#9B9890' }}>{formatDate(ev.date)}</p>
          </div>
          <span className="text-xs font-semibold" style={{ color: ev.type === 'debit' ? '#DC2626' : '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>
            {ev.type === 'debit' ? '+' : '-'}{formatRupiah(ev.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SupplierPage() {
  const [tab, setTab] = useState<Tab>('supplier')
  const [search, setSearch] = useState('')
  const [poStatusFilter, setPoStatusFilter] = useState('')
  const [expandedHutang, setExpandedHutang] = useState<string | null>(null)

  // Modals
  const [supplierModal, setSupplierModal] = useState<{ open: boolean; supplier?: Supplier | null }>({ open: false })
  const [bayarModal, setBayarModal] = useState<Supplier | null>(null)
  const [buatPOModal, setBuatPOModal] = useState(false)
  const [detailPO, setDetailPO] = useState<PurchaseOrder | null>(null)
  const [terimaModal, setTerimaModal] = useState<{ open: boolean; po?: PurchaseOrder | null }>({ open: false })

  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers()
  const { data: allSuppliers } = useAllSuppliers()
  const { data: allPOs, isLoading: loadingPOs } = usePurchaseOrders()
  const { data: receipts, isLoading: loadingReceipts } = useGoodsReceipts()
  const updateStatus = useUpdatePOStatus()
  const [batalError, setBatalError] = useState('')

  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers ?? []
    return (suppliers ?? []).filter(s => s.nama.toLowerCase().includes(search.toLowerCase()))
  }, [suppliers, search])

  const filteredPOs = useMemo(() => {
    if (!poStatusFilter) return allPOs ?? []
    return (allPOs ?? []).filter(p => p.status === poStatusFilter)
  }, [allPOs, poStatusFilter])

  // Hutang tab pakai semua supplier (termasuk nonaktif) agar hutang tidak hilang
  const debtSuppliers = useMemo(() =>
    (allSuppliers ?? []).sort((a, b) => Number(b.saldo_hutang) - Number(a.saldo_hutang)),
  [allSuppliers])

  const totalDebt = useMemo(() =>
    debtSuppliers.reduce((s, sup) => s + Number(sup.saldo_hutang), 0),
  [debtSuppliers])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'supplier', label: 'Supplier' },
    { key: 'po',       label: 'Purchase Order' },
    { key: 'terima',   label: 'Terima Barang' },
    { key: 'hutang',   label: 'Hutang Supplier' },
  ]

  async function handleBatalPO(po: PurchaseOrder) {
    if (!confirm(`Batalkan PO ${po.no_po}?`)) return
    try {
      setBatalError('')
      await updateStatus.mutateAsync({ id: po.id, status: 'batal' })
    } catch (err) {
      setBatalError((err as Error).message)
    }
  }

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: '#1A1A18' }}>Supplier & Pembelian</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9B9890' }}>Manajemen supplier, PO, dan penerimaan barang</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ backgroundColor: '#F0EEE8' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setBatalError('') }}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={tab === t.key
              ? { backgroundColor: '#fff', color: '#1A1A18', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
              : { color: '#6B6963' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: SUPPLIER ─────────────────────────────────────────────── */}
      {tab === 'supplier' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari supplier..."
              className="px-3 py-2 text-sm rounded-lg border outline-none w-64"
              style={{ borderColor: '#D5D3CD', color: '#1A1A18' }} />
            <button onClick={() => setSupplierModal({ open: true, supplier: null })}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg"
              style={{ backgroundColor: '#3B6D11', color: '#fff' }}>
              + Tambah Supplier
            </button>
          </div>

          {loadingSuppliers ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filteredSuppliers.map(s => (
                <div key={s.id} className="card p-4 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <SupplierInitial nama={s.nama} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: '#1A1A18' }}>{s.nama}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#9B9890' }}>
                        {[s.kota, s.telp].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>

                  {s.produk_supply && (
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: '#6B6963' }}>
                      {s.produk_supply}
                    </p>
                  )}

                  <div className="pt-3" style={{ borderTop: '1px solid #F0EEE8' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs" style={{ color: '#9B9890' }}>Hutang</span>
                      <span className="text-sm font-bold" style={{ color: Number(s.saldo_hutang) > 0 ? '#DC2626' : '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>
                        {formatRupiah(Number(s.saldo_hutang))}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSupplierModal({ open: true, supplier: s })}
                        className="flex-1 py-1.5 text-xs font-medium rounded-lg"
                        style={{ backgroundColor: '#F0EEE8', color: '#6B6963' }}>Edit</button>
                      {Number(s.saldo_hutang) > 0 && (
                        <button onClick={() => setBayarModal(s)}
                          className="flex-1 py-1.5 text-xs font-medium rounded-lg"
                          style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>Bayar Hutang</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!filteredSuppliers.length && (
                <div className="col-span-3 py-16 text-center text-sm" style={{ color: '#9B9890' }}>
                  {search ? 'Supplier tidak ditemukan' : 'Belum ada supplier'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: PURCHASE ORDER ───────────────────────────────────────── */}
      {tab === 'po' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1.5 flex-wrap">
              {PO_STATUSES.map(({ key, label }) => (
                <button key={key} onClick={() => setPoStatusFilter(key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={poStatusFilter === key
                    ? { backgroundColor: '#3B6D11', color: '#fff' }
                    : { backgroundColor: '#F0EEE8', color: '#6B6963' }}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => setBuatPOModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg"
              style={{ backgroundColor: '#3B6D11', color: '#fff' }}>
              + Buat PO
            </button>
          </div>

          {batalError && (
            <p className="text-xs mb-3 px-1" style={{ color: '#DC2626' }}>{batalError}</p>
          )}
          <div className="card overflow-hidden">
            {loadingPOs ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : (
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#F8F8F6' }}>
                  <tr>
                    {['No PO', 'Supplier', 'Tanggal', 'Est. Kirim', 'Total', 'Status', 'Aksi'].map(h => (
                      <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9B9890' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPOs.map(po => {
                    const ss = STATUS_STYLE[po.status] ?? STATUS_STYLE.draft
                    return (
                      <tr key={po.id} style={{ borderBottom: '1px solid #F0EEE8' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8F8F6')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <td className="px-4 py-3 font-medium text-xs" style={{ color: '#1A1A18' }}>{po.no_po}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#6B6963' }}>{po.suppliers?.nama ?? '—'}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#6B6963' }}>{formatDate(po.tanggal_po)}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#6B6963' }}>{po.tanggal_kirim ? formatDate(po.tanggal_kirim) : '—'}</td>
                        <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(Number(po.total_po))}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: ss.bg, color: ss.color }}>
                            {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setDetailPO(po)}
                              className="px-2 py-1 text-xs rounded-lg" style={{ backgroundColor: '#F0EEE8', color: '#6B6963' }}>
                              Detail
                            </button>
                            {(po.status === 'dikirim' || po.status === 'sebagian') && (
                              <button onClick={() => setTerimaModal({ open: true, po })}
                                className="px-2 py-1 text-xs rounded-lg" style={{ backgroundColor: '#EAF3DE', color: '#3B6D11' }}>
                                Terima
                              </button>
                            )}
                            {po.status === 'draft' && (
                              <button onClick={() => handleBatalPO(po)}
                                className="px-2 py-1 text-xs rounded-lg" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                                Batal
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!filteredPOs.length && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: '#9B9890' }}>
                        Belum ada purchase order
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: TERIMA BARANG ────────────────────────────────────────── */}
      {tab === 'terima' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setTerimaModal({ open: true, po: null })}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg"
              style={{ backgroundColor: '#3B6D11', color: '#fff' }}>
              + Terima Tanpa PO
            </button>
          </div>

          <div className="card overflow-hidden">
            {loadingReceipts ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : (
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#F8F8F6' }}>
                  <tr>
                    {['No Terima', 'Supplier', 'Tanggal', 'Total', 'Metode', 'PO'].map(h => (
                      <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9B9890' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {receipts?.map(gr => (
                    <tr key={gr.id} style={{ borderBottom: '1px solid #F0EEE8' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8F8F6')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td className="px-4 py-3 font-medium text-xs" style={{ color: '#1A1A18' }}>{gr.no_terima}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B6963' }}>{gr.suppliers?.nama ?? '—'}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B6963' }}>{formatDate(gr.tanggal)}</td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(Number(gr.total))}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={gr.metode_bayar === 'Hutang' ? { backgroundColor: '#FEF2F2', color: '#DC2626' } : { backgroundColor: '#EAF3DE', color: '#3B6D11' }}>
                          {gr.metode_bayar}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#9B9890' }}>
                        {gr.po_id ? allPOs?.find(p => p.id === gr.po_id)?.no_po ?? '—' : '—'}
                      </td>
                    </tr>
                  ))}
                  {!receipts?.length && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: '#9B9890' }}>
                        Belum ada penerimaan barang
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: HUTANG SUPPLIER ──────────────────────────────────────── */}
      {tab === 'hutang' && (
        <div>
          {/* Summary banner */}
          {totalDebt > 0 && (
            <div className="flex items-center gap-4 mb-5 px-5 py-4 rounded-xl"
              style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <div>
                <p className="text-xs font-medium" style={{ color: '#B45309' }}>Total Hutang ke Supplier</p>
                <p className="text-xl font-bold" style={{ color: '#B45309', fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(totalDebt)}</p>
              </div>
              <div style={{ width: '1px', height: '40px', backgroundColor: '#FDE68A' }} />
              <div>
                <p className="text-xs font-medium" style={{ color: '#B45309' }}>Supplier Berpiutang</p>
                <p className="text-xl font-bold" style={{ color: '#B45309' }}>{debtSuppliers.filter(s => Number(s.saldo_hutang) > 0).length} supplier</p>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: '#F8F8F6' }}>
                <tr>
                  {['Supplier', 'Kota', 'Saldo Hutang', 'Utilisasi', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9B9890' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {debtSuppliers.map(s => (
                  <Fragment key={s.id}>
                    <tr style={{ borderBottom: expandedHutang === s.id ? 'none' : '1px solid #F0EEE8' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8F8F6')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td className="px-4 py-3">
                        <button onClick={() => setExpandedHutang(expandedHutang === s.id ? null : s.id)}
                          className="font-medium text-xs flex items-center gap-1" style={{ color: '#1A1A18' }}>
                          <span>{expandedHutang === s.id ? '▼' : '▶'}</span>
                          {s.nama}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6B6963' }}>{s.kota ?? '—'}</td>
                      <td className="px-4 py-3 text-xs font-bold" style={{ color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
                        {formatRupiah(Number(s.saldo_hutang))}
                      </td>
                      <td className="px-4 py-3 w-32">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F0EEE8' }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (Number(s.saldo_hutang) / Math.max(totalDebt, 1)) * 100)}%`, backgroundColor: '#DC2626' }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {Number(s.saldo_hutang) > 0 ? (
                          <button onClick={() => setBayarModal(s)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg"
                            style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                            Bayar Hutang
                          </button>
                        ) : (
                          <span className="text-xs" style={{ color: '#9B9890' }}>Lunas</span>
                        )}
                      </td>
                    </tr>
                    {expandedHutang === s.id && (
                      <tr style={{ borderBottom: '1px solid #F0EEE8' }}>
                        <td colSpan={5} className="px-6 pb-3 pt-1">
                          <SupplierHutangDetail supplier={s} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {!debtSuppliers.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm" style={{ color: '#9B9890' }}>
                      Belum ada supplier
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {supplierModal.open && (
        <SupplierModal
          supplier={supplierModal.supplier}
          onClose={() => setSupplierModal({ open: false })}
        />
      )}
      {bayarModal && (
        <BayarHutangSupplierModal
          supplier={bayarModal}
          onClose={() => setBayarModal(null)}
        />
      )}
      {buatPOModal && (
        <BuatPOModal onClose={() => setBuatPOModal(false)} />
      )}
      {detailPO && (
        <DetailPOModal
          po={allPOs?.find(p => p.id === detailPO.id) ?? detailPO}
          onClose={() => setDetailPO(null)}
          onTerima={() => { setTerimaModal({ open: true, po: allPOs?.find(p => p.id === detailPO.id) ?? detailPO }); setDetailPO(null) }}
        />
      )}
      {terimaModal.open && (
        <TerimaBarangModal
          po={terimaModal.po}
          onClose={() => setTerimaModal({ open: false })}
        />
      )}
    </div>
  )
}
