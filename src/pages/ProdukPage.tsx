import { useState, useEffect } from 'react'
import { useProductsPaginated, useCategories, useLowStock } from '@/hooks/useProducts'
import { formatRupiah } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { ProdukModal } from '@/components/produk/ProdukModal'
import { StokOpnameModal } from '@/components/produk/StokOpnameModal'
import { HapusProdukDialog } from '@/components/produk/HapusProdukDialog'
import type { Product } from '@/types'
import type { ProductsPageParams } from '@/hooks/useProducts'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// ── Icons ─────────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
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
function AdjustIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
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

const CAT_BG: Record<string, string> = {
  Pupuk:       '#EAF3DE',
  Pestisida:   '#FFFBEB',
  Benih:       '#F0FDFA',
  'Alat Tani': '#F3F4F6',
  Lainnya:     '#EFF6FF',
}

// ── Pagination controls ───────────────────────────────────────────────────────
function Pagination({
  page, total, pageSize, onChange, onPageSizeChange,
}: {
  page: number
  total: number
  pageSize: number
  onChange: (p: number) => void
  onPageSizeChange: (size: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  // Visible page numbers: always show first, last, current ±1
  const pages = Array.from(new Set([
    1,
    totalPages,
    page - 1,
    page,
    page + 1,
  ]))
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b)

  const btnBase: React.CSSProperties = {
    height: '30px',
    minWidth: '30px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 6px',
    transition: 'all 150ms',
    fontFamily: 'inherit',
    cursor: 'pointer',
    border: '1px solid #E8E6E0',
    background: 'white',
    color: '#6B6963',
  }
  const btnActive: React.CSSProperties = {
    ...btnBase,
    backgroundColor: '#EAF3DE',
    borderColor: '#3B6D11',
    color: '#3B6D11',
  }
  const btnDisabled: React.CSSProperties = {
    ...btnBase,
    opacity: 0.4,
    cursor: 'not-allowed',
  }

  return (
    <div
      className="flex items-center justify-between px-4 py-3 flex-wrap gap-2"
      style={{ borderTop: '1px solid #F0EEE8' }}
    >
      {/* Info + page size */}
      <div className="flex items-center gap-3">
        <p className="text-xs" style={{ color: '#9B9890' }}>
          {total === 0
            ? 'Tidak ada data'
            : `${from}–${to} dari ${total} produk`}
        </p>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={{
            height: '26px',
            fontSize: '11px',
            fontWeight: 500,
            fontFamily: 'inherit',
            border: '1px solid #E8E6E0',
            borderRadius: '6px',
            padding: '0 6px',
            color: '#6B6963',
            backgroundColor: 'white',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>{n} / halaman</option>
          ))}
        </select>
      </div>

      {/* Controls — only shown when more than 1 page */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {/* Prev */}
          <button
            disabled={page === 1}
            onClick={() => onChange(page - 1)}
            style={page === 1 ? btnDisabled : btnBase}
          >
            <ChevronLeftIcon />
          </button>

          {/* Page numbers */}
          {pages.map((p, i) => {
            const prev = pages[i - 1]
            return (
              <span key={p} className="flex items-center gap-1">
                {prev && p - prev > 1 && (
                  <span className="text-xs px-1" style={{ color: '#9B9890' }}>…</span>
                )}
                <button
                  onClick={() => onChange(p)}
                  style={p === page ? btnActive : btnBase}
                >
                  {p}
                </button>
              </span>
            )
          })}

          {/* Next */}
          <button
            disabled={page >= totalPages}
            onClick={() => onChange(page + 1)}
            style={page >= totalPages ? btnDisabled : btnBase}
          >
            <ChevronRightIcon />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function ProdukPage() {
  const { data: categories = [] } = useCategories()
  const { data: lowStock = [] }   = useLowStock()

  // ── Filter & pagination state ──────────────────────────────────────────────
  const [page, setPage]                 = useState(1)
  const [pageSize, setPageSize]         = useState(20)
  const [filterSearch,    setSearch]    = useState('')
  const [filterKategori,  setKategori]  = useState('')
  const [filterStatus,    setStatus]    = useState<ProductsPageParams['status']>('aktif')
  const [filterStok,      setStok]      = useState<ProductsPageParams['stokFilter']>('')

  // Reset to page 1 whenever any filter or page size changes
  useEffect(() => { setPage(1) }, [filterSearch, filterKategori, filterStatus, filterStok, pageSize])

  const queryParams: ProductsPageParams = {
    page,
    pageSize,
    search:     filterSearch,
    categoryId: filterKategori,
    status:     filterStatus,
    stokFilter: filterStok,
  }

  const { data: pageResult, isLoading, isFetching } = useProductsPaginated(queryParams)

  const products   = pageResult?.data  ?? []
  const totalCount = pageResult?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  // ── Modal state ────────────────────────────────────────────────────────────
  const [showTambah,   setShowTambah]   = useState(false)
  const [editProduk,   setEditProduk]   = useState<Product | null>(null)
  const [opnameProduk, setOpnameProduk] = useState<Product | null>(null)
  const [hapusProduk,  setHapusProduk]  = useState<Product | null>(null)

  const hasActiveFilter = !!(filterSearch || filterKategori || filterStatus !== 'aktif' || filterStok)

  const selectStyle: React.CSSProperties = {
    height: '34px',
    border: '1px solid #E8E6E0',
    color: '#6B6963',
    backgroundColor: 'white',
    fontFamily: 'inherit',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    padding: '0 10px',
    outline: 'none',
    cursor: 'pointer',
  }

  return (
    <div className="px-8 py-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: '#1A1A18' }}>Produk</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9B9890' }}>
            {totalCount > 0 ? `${totalCount} produk ditemukan` : 'Master data produk & stok'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowTambah(true)}>
          + Tambah Produk
        </button>
      </div>

      {/* ── Stok Kritis Alert (dari useLowStock — tidak terpotong pagination) ── */}
      {lowStock.length > 0 && (
        <div
          className="rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5"
          style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
        >
          <span style={{ color: '#D97706', marginTop: '1px' }}>⚠</span>
          <p className="text-sm" style={{ color: '#92400E' }}>
            <span className="font-semibold">{lowStock.length} produk stok kritis: </span>
            {lowStock.slice(0, 8).map((p, i) => (
              <span key={p.id}>
                {i > 0 && ', '}
                <button
                  className="underline font-medium hover:no-underline"
                  style={{ color: '#92400E' }}
                  onClick={() => {
                    setSearch(p.nama)
                    setStok('')
                    setStatus('aktif')
                  }}
                >
                  {p.nama} ({p.stok})
                </button>
              </span>
            ))}
            {lowStock.length > 8 && (
              <span className="ml-1">
                dan {lowStock.length - 8} lainnya —{' '}
                <button
                  className="underline font-medium"
                  style={{ color: '#92400E' }}
                  onClick={() => { setStok('kritis'); setStatus('aktif') }}
                >
                  lihat semua
                </button>
              </span>
            )}
          </p>
        </div>
      )}

      <div className="card overflow-hidden">
        {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2.5 px-4 py-3 flex-wrap"
          style={{ borderBottom: '1px solid #E8E6E0' }}
        >
          {/* Search */}
          <div className="relative flex-1" style={{ minWidth: '180px', maxWidth: '280px' }}>
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9B9890' }}>
              <SearchIcon />
            </span>
            <input
              className="input pl-9"
              style={{ height: '34px', fontSize: '13px' }}
              placeholder="Cari nama atau kode..."
              value={filterSearch}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Kategori */}
          <select style={selectStyle} value={filterKategori} onChange={(e) => setKategori(e.target.value)}>
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.nama}</option>
            ))}
          </select>

          {/* Status */}
          <select style={selectStyle} value={filterStatus} onChange={(e) => setStatus(e.target.value as ProductsPageParams['status'])}>
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>

          {/* Stok */}
          <select style={selectStyle} value={filterStok} onChange={(e) => setStok(e.target.value as ProductsPageParams['stokFilter'])}>
            <option value="">Semua Stok</option>
            <option value="kritis">Stok Kritis</option>
            <option value="habis">Stok Habis</option>
          </select>

          {/* Reset */}
          {hasActiveFilter && (
            <button
              className="text-xs font-medium"
              style={{ color: '#9B9890' }}
              onClick={() => { setSearch(''); setKategori(''); setStatus('aktif'); setStok('') }}
            >
              Reset
            </button>
          )}

          {/* Fetching indicator */}
          {isFetching && !isLoading && (
            <span className="text-xs ml-auto" style={{ color: '#9B9890' }}>Memuat...</span>
          )}
        </div>

        {/* ── Table ──────────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : products.length === 0 ? (
          !hasActiveFilter ? (
            <EmptyState
              type="product"
              title="Belum ada produk"
              description="Tambahkan produk pertama untuk mulai berjualan"
              action={{ label: '+ Tambah Produk', onClick: () => setShowTambah(true) }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm font-medium" style={{ color: '#6B6963' }}>
                Tidak ada produk yang sesuai filter
              </p>
              <button
                className="text-xs mt-1.5 underline"
                style={{ color: '#9B9890' }}
                onClick={() => { setSearch(''); setKategori(''); setStatus('aktif'); setStok('') }}
              >
                Reset filter
              </button>
            </div>
          )
        ) : (
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: '#F8F8F6' }}>
              <tr>
                {['Produk', 'Kategori', 'Satuan', 'Harga Beli', 'Harga Jual', 'Stok', 'Status', ''].map((h) => (
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
              {products.map((p) => {
                const isLow   = p.stok > 0 && p.stok <= p.stok_minimum
                const isHabis = p.stok === 0
                const catName = p.categories?.nama ?? 'Lainnya'
                const catBg   = CAT_BG[catName] ?? '#F3F4F6'

                return (
                  <tr
                    key={p.id}
                    className="group transition-colors"
                    style={{ borderBottom: '1px solid #F0EEE8', height: '52px' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8F8F6')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Produk */}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                          style={{ backgroundColor: catBg }}
                        >
                          {p.categories?.icon ?? '📦'}
                        </div>
                        <div>
                          <p className="font-medium text-sm leading-tight" style={{ color: p.aktif ? '#1A1A18' : '#9B9890' }}>
                            {p.nama}
                          </p>
                          {p.kode && (
                            <p className="font-mono leading-tight mt-0.5" style={{ fontSize: '10px', color: '#9B9890' }}>
                              {p.kode}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Kategori */}
                    <td className="px-4 py-2 text-xs" style={{ color: '#6B6963' }}>
                      {p.categories?.nama ?? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                          Tanpa Kategori
                        </span>
                      )}
                    </td>

                    {/* Satuan */}
                    <td className="px-4 py-2 text-xs" style={{ color: '#6B6963' }}>{p.satuan}</td>

                    {/* Harga Beli */}
                    <td className="px-4 py-2 text-xs" style={{ color: '#9B9890', fontVariantNumeric: 'tabular-nums' }}>
                      {formatRupiah(p.harga_beli)}
                    </td>

                    {/* Harga Jual */}
                    <td className="px-4 py-2 text-sm font-semibold" style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>
                      {formatRupiah(p.harga_jual)}
                    </td>

                    {/* Stok */}
                    <td className="px-4 py-2">
                      {isHabis ? (
                        <span className="badge-red">Habis</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {isLow && (
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#DC2626' }} />
                          )}
                          <span
                            className="text-sm font-semibold"
                            style={{ color: isLow ? '#DC2626' : '#1A1A18', fontVariantNumeric: 'tabular-nums' }}
                          >
                            {p.stok}
                          </span>
                          {isLow && <span className="text-[10px]" style={{ color: '#DC2626' }}>kritis</span>}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2">
                      <Badge variant={p.aktif ? 'green' : 'gray'}>
                        {p.aktif ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-2">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          title="Edit"
                          onClick={() => setEditProduk(p)}
                          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-gray-100"
                          style={{ color: '#6B6963' }}
                        >
                          <PencilIcon />
                        </button>
                        <button
                          title="Stok opname"
                          onClick={() => setOpnameProduk(p)}
                          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-gray-100"
                          style={{ color: '#6B6963' }}
                        >
                          <AdjustIcon />
                        </button>
                        {p.aktif && (
                          <button
                            title="Nonaktifkan"
                            onClick={() => setHapusProduk(p)}
                            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-red-50"
                            style={{ color: '#D0CEC8' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#D0CEC8')}
                          >
                            <TrashIcon />
                          </button>
                        )}
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
      {(showTambah || editProduk) && (
        <ProdukModal
          product={editProduk}
          onClose={() => { setShowTambah(false); setEditProduk(null) }}
        />
      )}
      {opnameProduk && (
        <StokOpnameModal product={opnameProduk} onClose={() => setOpnameProduk(null)} />
      )}
      {hapusProduk && (
        <HapusProdukDialog product={hapusProduk} onClose={() => setHapusProduk(null)} />
      )}
    </div>
  )
}
