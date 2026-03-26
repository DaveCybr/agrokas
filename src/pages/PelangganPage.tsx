import { useState, useEffect } from 'react'
import { useCustomers, useCustomersPaginated } from '@/hooks/useCustomers'
import { formatRupiah, getInitials } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { PelangganModal } from '@/components/pelanggan/PelangganModal'
import { BayarHutangModal } from '@/components/pelanggan/BayarHutangModal'
import { DetailPelangganModal } from '@/components/pelanggan/DetailPelangganModal'
import { HapusPelangganDialog } from '@/components/pelanggan/HapusPelangganDialog'
import type { Customer } from '@/types'
import type { CustomersPageParams } from '@/hooks/useCustomers'

// ── Icons ─────────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}
function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}
function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
    </svg>
  )
}
function CreditCardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  )
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}
function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}
function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({
  page, total, pageSize, onChange, onPageSizeChange,
}: {
  page: number
  total: number
  pageSize: number
  onChange: (p: number) => void
  onPageSizeChange: (s: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  const pages = Array.from(new Set([1, totalPages, page - 1, page, page + 1]))
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b)

  const btnBase: React.CSSProperties = {
    height: '30px', minWidth: '30px', borderRadius: '6px', fontSize: '12px',
    fontWeight: 500, display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', padding: '0 6px', transition: 'all 150ms',
    fontFamily: 'inherit', cursor: 'pointer',
    border: '1px solid #E8E6E0', background: 'white', color: '#6B6963',
  }
  const btnActive: React.CSSProperties = {
    ...btnBase, backgroundColor: '#EAF3DE', borderColor: '#3B6D11', color: '#3B6D11',
  }
  const btnDisabled: React.CSSProperties = { ...btnBase, opacity: 0.4, cursor: 'not-allowed' }

  return (
    <div
      className="flex items-center justify-between px-4 py-3 flex-wrap gap-2"
      style={{ borderTop: '1px solid #F0EEE8' }}
    >
      <div className="flex items-center gap-3">
        <p className="text-xs" style={{ color: '#9B9890' }}>
          {total === 0 ? 'Tidak ada data' : `${from}–${to} dari ${total} pelanggan`}
        </p>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={{
            height: '26px', fontSize: '11px', fontWeight: 500, fontFamily: 'inherit',
            border: '1px solid #E8E6E0', borderRadius: '6px', padding: '0 6px',
            color: '#6B6963', backgroundColor: 'white', cursor: 'pointer', outline: 'none',
          }}
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>{n} / halaman</option>
          ))}
        </select>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button disabled={page === 1} onClick={() => onChange(page - 1)} style={page === 1 ? btnDisabled : btnBase}>
            <ChevronLeftIcon />
          </button>
          {pages.map((p, i) => {
            const prev = pages[i - 1]
            return (
              <span key={p} className="flex items-center gap-1">
                {prev && p - prev > 1 && (
                  <span className="text-xs px-1" style={{ color: '#9B9890' }}>…</span>
                )}
                <button onClick={() => onChange(p)} style={p === page ? btnActive : btnBase}>{p}</button>
              </span>
            )
          })}
          <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} style={page >= totalPages ? btnDisabled : btnBase}>
            <ChevronRightIcon />
          </button>
        </div>
      )}
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  height: '34px', border: '1px solid #E8E6E0', color: '#6B6963',
  backgroundColor: 'white', fontFamily: 'inherit', borderRadius: '8px',
  fontSize: '13px', fontWeight: 500, padding: '0 10px', outline: 'none', cursor: 'pointer',
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function PelangganPage() {
  // For outstanding debt summary — fetch all active customers (no pagination)
  const { data: allCustomers = [] } = useCustomers()

  // ── Filter & pagination state ──────────────────────────────────────────────
  const [page,         setPage]    = useState(1)
  const [pageSize,     setPageSize] = useState(10)
  const [filterSearch, setSearch]  = useState('')
  const [filterTipe,   setTipe]    = useState<CustomersPageParams['tipe']>('')
  const [filterHutang, setHutang]  = useState<CustomersPageParams['hutang']>('')

  useEffect(() => { setPage(1) }, [filterSearch, filterTipe, filterHutang, pageSize])

  const queryParams: CustomersPageParams = {
    page, pageSize, search: filterSearch, tipe: filterTipe, hutang: filterHutang,
  }
  const { data: pageResult, isLoading, isFetching } = useCustomersPaginated(queryParams)

  const customers  = pageResult?.data  ?? []
  const totalCount = pageResult?.total ?? 0

  // ── Modal state ────────────────────────────────────────────────────────────
  const [showTambah,      setShowTambah]     = useState(false)
  const [editPelanggan,   setEditPelanggan]  = useState<Customer | null>(null)
  const [detailPelanggan, setDetailPelanggan] = useState<Customer | null>(null)
  const [bayarHutang,     setBayarHutang]    = useState<Customer | null>(null)
  const [hapusPelanggan,  setHapusPelanggan] = useState<Customer | null>(null)

  // ── Outstanding debt summary (from full list, not paginated) ───────────────
  const totalHutang     = allCustomers.reduce((s, c) => s + c.saldo_hutang, 0)
  const jumlahBerhutang = allCustomers.filter((c) => c.saldo_hutang > 0).length

  const hasFilter = !!(filterSearch || filterTipe || filterHutang)

  function handleDetailEdit() {
    const c = detailPelanggan
    setDetailPelanggan(null)
    if (c) setEditPelanggan(c)
  }
  function handleDetailBayar() {
    const c = detailPelanggan
    setDetailPelanggan(null)
    if (c) setBayarHutang(c)
  }

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: '#1A1A18' }}>Pelanggan</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9B9890' }}>
            {totalCount > 0 ? `${totalCount} pelanggan ditemukan` : 'Data pelanggan & buku hutang'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowTambah(true)}>
          + Tambah Pelanggan
        </button>
      </div>

      {/* ── Hutang Outstanding Alert ─────────────────────────────────────────── */}
      {totalHutang > 0 && (
        <div
          className="rounded-xl px-5 py-4 mb-4 flex items-center justify-between"
          style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
        >
          <p className="text-sm" style={{ color: '#DC2626' }}>
            <span className="mr-1.5">💳</span>
            <span className="font-semibold">Total hutang outstanding: {formatRupiah(totalHutang)}</span>
            <span className="ml-1 font-normal" style={{ color: '#9B9890' }}>
              — {jumlahBerhutang} pelanggan
            </span>
          </p>
          <button
            className="text-xs font-medium underline"
            style={{ color: '#DC2626', background: 'none', cursor: 'pointer' }}
            onClick={() => setHutang('ada-hutang')}
          >
            Lihat semua →
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2.5 px-4 py-3 flex-wrap"
          style={{ borderBottom: '1px solid #E8E6E0' }}
        >
          <div className="relative flex-1" style={{ minWidth: '180px', maxWidth: '280px' }}>
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9B9890' }}>
              <SearchIcon />
            </span>
            <input
              className="input pl-9"
              style={{ height: '34px', fontSize: '13px' }}
              placeholder="Cari nama, desa, HP..."
              value={filterSearch}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select style={selectStyle} value={filterTipe} onChange={(e) => setTipe(e.target.value as CustomersPageParams['tipe'])}>
            <option value="">Semua Tipe</option>
            <option value="petani">Petani</option>
            <option value="agen">Agen</option>
            <option value="poktan">Poktan</option>
          </select>

          <select style={selectStyle} value={filterHutang} onChange={(e) => setHutang(e.target.value as CustomersPageParams['hutang'])}>
            <option value="">Semua</option>
            <option value="ada-hutang">Ada Hutang</option>
            <option value="lunas">Lunas</option>
          </select>

          {hasFilter && (
            <button
              className="text-xs font-medium"
              style={{ color: '#9B9890', background: 'none', cursor: 'pointer' }}
              onClick={() => { setSearch(''); setTipe(''); setHutang('') }}
            >
              Reset
            </button>
          )}

          {isFetching && !isLoading && (
            <span className="text-xs ml-auto" style={{ color: '#9B9890' }}>Memuat...</span>
          )}
        </div>

        {/* ── Table ──────────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : customers.length === 0 && !hasFilter ? (
          <EmptyState
            type="customer"
            title="Belum ada pelanggan"
            description="Tambahkan data pelanggan untuk mencatat hutang"
            action={{ label: '+ Tambah Pelanggan', onClick: () => setShowTambah(true) }}
          />
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm font-medium" style={{ color: '#6B6963' }}>
              Tidak ada pelanggan yang sesuai filter
            </p>
            <button
              className="text-xs mt-1.5 underline"
              style={{ color: '#9B9890', background: 'none', cursor: 'pointer' }}
              onClick={() => { setSearch(''); setTipe(''); setHutang('') }}
            >
              Reset filter
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: '#F8F8F6' }}>
              <tr>
                {['Pelanggan', 'Tipe', 'Desa / Kecamatan', 'Hutang', 'Limit', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left"
                    style={{
                      fontSize: '11px', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      color: '#9B9890', whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const persen = c.limit_kredit > 0
                  ? Math.min(100, (c.saldo_hutang / c.limit_kredit) * 100)
                  : 0

                return (
                  <tr
                    key={c.id}
                    className="group transition-colors"
                    style={{ borderBottom: '1px solid #F0EEE8', height: '56px' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8F8F6')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                          style={{ backgroundColor: '#EAF3DE', color: '#3B6D11' }}
                        >
                          {getInitials(c.nama)}
                        </div>
                        <div>
                          <p className="font-medium text-sm leading-tight" style={{ color: '#1A1A18' }}>{c.nama}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: '#9B9890' }}>{c.telp ?? '—'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-2">
                      <Badge variant={c.tipe === 'poktan' ? 'blue' : c.tipe === 'agen' ? 'amber' : 'gray'}>
                        {c.tipe}
                      </Badge>
                    </td>

                    <td className="px-4 py-2">
                      <p className="text-xs" style={{ color: '#6B6963' }}>{c.desa ?? '—'}</p>
                      {c.kecamatan && (
                        <p className="text-[11px] mt-0.5" style={{ color: '#9B9890' }}>{c.kecamatan}</p>
                      )}
                    </td>

                    <td className="px-4 py-2">
                      {c.saldo_hutang > 0 ? (
                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: '#DC2626', fontVariantNumeric: 'tabular-nums' }}
                          >
                            {formatRupiah(c.saldo_hutang)}
                          </p>
                          {c.limit_kredit > 0 && (
                            <div className="h-0.5 bg-gray-100 rounded-full mt-1 overflow-hidden" style={{ width: '80px' }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${persen}%`,
                                  backgroundColor: persen > 80 ? '#DC2626' : persen > 50 ? '#D97706' : '#3B6D11',
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm" style={{ color: '#9B9890' }}>—</span>
                      )}
                    </td>

                    <td className="px-4 py-2 text-xs" style={{ color: '#9B9890', fontVariantNumeric: 'tabular-nums' }}>
                      {formatRupiah(c.limit_kredit)}
                    </td>

                    <td className="px-4 py-2">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          title="Detail"
                          onClick={() => setDetailPelanggan(c)}
                          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-gray-100"
                          style={{ color: '#6B6963' }}
                        >
                          <EyeIcon />
                        </button>
                        <button
                          title="Edit"
                          onClick={() => setEditPelanggan(c)}
                          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-gray-100"
                          style={{ color: '#6B6963' }}
                        >
                          <PencilIcon />
                        </button>
                        {c.saldo_hutang > 0 && (
                          <button
                            title="Bayar Hutang"
                            onClick={() => setBayarHutang(c)}
                            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-green-50"
                            style={{ color: '#9B9890' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#3B6D11')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#9B9890')}
                          >
                            <CreditCardIcon />
                          </button>
                        )}
                        <button
                          title="Nonaktifkan"
                          onClick={() => setHapusPelanggan(c)}
                          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-red-50"
                          style={{ color: '#D0CEC8' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#D0CEC8')}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* ── Pagination ─────────────────────────────────────────────────────── */}
        {totalCount > 0 && (
          <Pagination
            page={page}
            total={totalCount}
            pageSize={pageSize}
            onChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {(showTambah || editPelanggan) && (
        <PelangganModal
          customer={editPelanggan}
          onClose={() => { setShowTambah(false); setEditPelanggan(null) }}
        />
      )}
      {detailPelanggan && (
        <DetailPelangganModal
          customer={detailPelanggan}
          onEdit={handleDetailEdit}
          onBayar={handleDetailBayar}
          onClose={() => setDetailPelanggan(null)}
        />
      )}
      {bayarHutang && (
        <BayarHutangModal
          customer={bayarHutang}
          onClose={() => setBayarHutang(null)}
        />
      )}
      {hapusPelanggan && (
        <HapusPelangganDialog
          customer={hapusPelanggan}
          onClose={() => setHapusPelanggan(null)}
        />
      )}
    </div>
  )
}
