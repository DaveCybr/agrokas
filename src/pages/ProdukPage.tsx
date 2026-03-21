import { useProducts } from '@/hooks/useProducts'
import { formatRupiah } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { useState } from 'react'

export function ProdukPage() {
  const [search, setSearch] = useState('')
  const { data: products, isLoading } = useProducts(undefined, search || undefined)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Produk</h1>
          <p className="text-sm text-gray-400">Master data produk & stok</p>
        </div>
        <button className="btn-primary text-sm">+ Tambah Produk</button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <input
            className="input max-w-sm"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : products?.length === 0 ? (
          <EmptyState icon="📦" title="Belum ada produk" description="Tambahkan produk pertama kamu" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                {['Kode', 'Nama Produk', 'Kategori', 'Satuan', 'Harga Jual', 'Stok', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products?.map((p) => {
                const isLow = p.stok <= p.stok_minimum
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.kode ?? '—'}</td>
                    <td className="px-4 py-3 font-medium">{p.nama}</td>
                    <td className="px-4 py-3 text-gray-500">{p.categories?.nama ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.satuan}</td>
                    <td className="px-4 py-3 font-medium text-primary-700">{formatRupiah(p.harga_jual)}</td>
                    <td className="px-4 py-3">
                      <span className={isLow ? 'text-red-500 font-medium' : ''}>{p.stok}</span>
                      {isLow && <span className="ml-1 text-[10px] text-red-400">⚠ kritis</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={p.aktif ? 'green' : 'gray'}>{p.aktif ? 'Aktif' : 'Nonaktif'}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
