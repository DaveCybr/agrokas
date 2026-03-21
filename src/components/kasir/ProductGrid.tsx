import { useCartStore } from '@/store/cartStore'
import { useProducts, useCategories } from '@/hooks/useProducts'
import { formatRupiah } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import { useState } from 'react'
import type { Product } from '@/types'

const CAT_COLORS: Record<string, string> = {
  Pupuk:     'bg-primary-50',
  Pestisida: 'bg-amber-50',
  Benih:     'bg-teal-50',
  'Alat Tani': 'bg-gray-100',
  Lainnya:   'bg-blue-50',
}

function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)
  const isLowStock = product.stok <= product.stok_minimum
  const catName = product.categories?.nama ?? 'Lainnya'

  return (
    <button
      onClick={() => addItem(product)}
      className="card p-3 text-left hover:border-primary-200 hover:shadow-md active:scale-[0.97] transition-all duration-150 relative flex flex-col gap-1"
    >
      {isLowStock && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-400" />
      )}
      <div className={`w-9 h-9 rounded-lg ${CAT_COLORS[catName] ?? 'bg-gray-100'} flex items-center justify-center text-lg mb-1`}>
        {product.categories?.icon ?? '📦'}
      </div>
      <p className="text-xs font-medium leading-tight line-clamp-2">{product.nama}</p>
      <p className="text-[10px] text-gray-400">{product.satuan}</p>
      <p className="text-xs font-semibold text-primary-600 mt-auto">
        {formatRupiah(product.harga_jual)}
      </p>
      <p className={`text-[10px] ${isLowStock ? 'text-red-400' : 'text-gray-400'}`}>
        Stok: {product.stok}
      </p>
    </button>
  )
}

export function ProductGrid() {
  const [activeCat, setActiveCat] = useState<string | undefined>()
  const [search, setSearch] = useState('')

  const { data: categories } = useCategories()
  const { data: products, isLoading } = useProducts(activeCat, search || undefined)

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-gray-100 bg-white">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Cari produk atau scan barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-3 py-2.5 border-b border-gray-100 bg-white overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveCat(undefined)}
          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
            !activeCat
              ? 'bg-primary-50 border-primary-200 text-primary-800 font-medium'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          Semua
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(activeCat === cat.id ? undefined : cat.id)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
              activeCat === cat.id
                ? 'bg-primary-50 border-primary-200 text-primary-800 font-medium'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {cat.icon} {cat.nama}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : products?.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Produk tidak ditemukan</div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {products?.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
