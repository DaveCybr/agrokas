import { ProductGrid } from '@/components/kasir/ProductGrid'
import { CartPanel } from '@/components/kasir/CartPanel'

export function KasirPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <div>
            <h1 className="font-semibold text-gray-900">Kasir</h1>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <ProductGrid />
        </div>
      </div>
      <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden">
        <CartPanel />
      </div>
    </div>
  )
}
