import { useCartStore } from '@/store/cartStore'
import { useProducts, useCategories } from '@/hooks/useProducts'
import { useToastStore } from '@/store/toastStore'
import { formatRupiah } from '@/lib/utils'
import { useState } from 'react'
import type { Product } from '@/types'

const CAT_BG: Record<string, string> = {
  Pupuk:       '#EAF3DE',
  Pestisida:   '#FFFBEB',
  Benih:       '#F0FDFA',
  'Alat Tani': '#F3F4F6',
  Lainnya:     '#EFF6FF',
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl p-3" style={{ border: '1px solid #E8E6E0', backgroundColor: 'white' }}>
      <div className="w-8 h-8 rounded-lg bg-gray-100 mb-2" />
      <div className="h-2.5 bg-gray-100 rounded mb-1.5" />
      <div className="h-2.5 bg-gray-100 rounded w-2/3 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)
  const addToast = useToastStore((s) => s.addToast)
  const isLowStock = product.stok <= product.stok_minimum
  const catName = product.categories?.nama ?? 'Lainnya'
  const catBg = CAT_BG[catName] ?? '#F3F4F6'

  function handleClick() {
    addItem(product)
    addToast(`${product.nama} ditambahkan`, 'success')
  }

  return (
    <button
      onClick={handleClick}
      className="text-left flex flex-col gap-1 transition-all duration-150 active:scale-[0.97] relative p-3 rounded-xl"
      style={{
        backgroundColor: 'white',
        border: '1px solid #E8E6E0',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = '1px solid #3B6D11'
        e.currentTarget.style.backgroundColor = '#F0F7E8'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = '1px solid #E8E6E0'
        e.currentTarget.style.backgroundColor = 'white'
      }}
    >
      {isLowStock && (
        <span
          className="absolute top-2 right-2 rounded-full"
          style={{ width: '6px', height: '6px', backgroundColor: '#DC2626' }}
        />
      )}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-base mb-1 flex-shrink-0"
        style={{ backgroundColor: catBg }}
      >
        {product.categories?.icon ?? '📦'}
      </div>
      <p className="text-xs font-semibold leading-tight line-clamp-2" style={{ color: '#1A1A18' }}>
        {product.nama}
      </p>
      <p className="text-[10px]" style={{ color: '#9B9890' }}>{product.satuan}</p>
      <p className="text-sm font-bold mt-auto" style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>
        {formatRupiah(product.harga_jual)}
      </p>
      <p className="text-[10px]" style={{ color: isLowStock ? '#DC2626' : '#9B9890' }}>
        Stok: {product.stok}
      </p>
    </button>
  )
}

export function ProductGrid() {
  const [activeCat, setActiveCat] = useState<string | undefined>()
  const [search, setSearch] = useState('')

  const addItem  = useCartStore((s) => s.addItem)
  const addToast = useToastStore((s) => s.addToast)

  const { data: categories } = useCategories()
  const { data: products, isLoading } = useProducts(activeCat, search || undefined)

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || !search.trim()) return
    const q = search.trim().toLowerCase()
    // Prefer exact kode match (barcode scanner path)
    const match =
      products?.find((p) => p.kode?.toLowerCase() === q) ??
      (products?.length === 1 ? products[0] : undefined)
    if (match) {
      if (match.stok <= 0) {
        addToast(`Stok ${match.nama} habis`, 'error')
      } else {
        addItem(match)
        addToast(`${match.nama} ditambahkan`, 'success')
      }
      setSearch('')
      e.preventDefault()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 py-2.5 bg-white" style={{ borderBottom: '1px solid #E8E6E0' }}>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: '#9B9890' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Cari produk atau scan barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Categories */}
      <div
        className="flex gap-1.5 px-3 py-2 bg-white overflow-x-auto"
        style={{ borderBottom: '1px solid #E8E6E0' }}
      >
        <button
          onClick={() => setActiveCat(undefined)}
          className="flex-shrink-0 text-xs px-3 py-1 rounded-full border transition-all duration-150 font-medium"
          style={
            !activeCat
              ? { backgroundColor: '#EAF3DE', borderColor: '#3B6D11', color: '#3B6D11' }
              : { backgroundColor: 'white', borderColor: '#E8E6E0', color: '#6B6963' }
          }
        >
          Semua
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(activeCat === cat.id ? undefined : cat.id)}
            className="flex-shrink-0 text-xs px-3 py-1 rounded-full border transition-all duration-150 font-medium"
            style={
              activeCat === cat.id
                ? { backgroundColor: '#EAF3DE', borderColor: '#3B6D11', color: '#3B6D11' }
                : { backgroundColor: 'white', borderColor: '#E8E6E0', color: '#6B6963' }
            }
          >
            {cat.icon} {cat.nama}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <p className="text-sm font-medium" style={{ color: '#6B6963' }}>Produk tidak ditemukan</p>
            <p className="text-xs mt-1" style={{ color: '#9B9890' }}>Coba kata kunci lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {products?.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
