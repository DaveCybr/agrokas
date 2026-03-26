import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useLowStock } from '@/hooks/useProducts'
import { useCartStore } from '@/store/cartStore'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { useProductByBarcode } from '@/hooks/useProductByBarcode'
import { useToastStore } from '@/store/toastStore'
import { useSidebarStore } from '@/store/sidebarStore'
import { ProductGrid } from '@/components/kasir/ProductGrid'
import { CartPanel } from '@/components/kasir/CartPanel'
import { HeldTransactionsPanel } from '@/components/kasir/HeldTransactionsPanel'
import { formatRupiah } from '@/lib/utils'

function BarcodeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth="1.5" stroke="currentColor" width={size} height={size}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5
           c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5Z
           M3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5
           c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z
           M13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5
           c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121 0 2.032-.696 2.032-1.571l1.219-8.032A1.5 1.5 0 0 0 20.43 4.5H6.25L5.856 2.773A1.5 1.5 0 0 0 4.385 1.5H2.25" />
      <circle cx="9" cy="20.25" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20.25" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

type ScanFlash = 'idle' | 'success' | 'error'

export function KasirPage() {
  const { user }       = useAuthStore()
  const { data: lowStock } = useLowStock()
  const addItem        = useCartStore((s) => s.addItem)
  const addToast       = useToastStore((s) => s.addToast)
  const findProduct    = useProductByBarcode()
  const { toggle: toggleSidebar } = useSidebarStore()
  const lowCount       = lowStock?.length ?? 0
  const initials       = user?.email?.[0]?.toUpperCase() ?? 'K'

  const itemCount = useCartStore((s) => s.items.length)
  const cartTotal = useCartStore((s) => s.total())

  const [showCart, setShowCart] = useState(false)
  const [scanFlash, setScanFlash] = useState<ScanFlash>('idle')

  const barcodeEnabled = localStorage.getItem('agrokas_barcode_enabled') !== 'false'

  const now     = new Date()
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  function flash(type: 'success' | 'error') {
    setScanFlash(type)
    setTimeout(() => setScanFlash('idle'), 400)
  }

  const handleScan = useCallback(async (barcode: string) => {
    try {
      const product = await findProduct.mutateAsync(barcode)
      if (product.stok <= 0) {
        addToast(`Stok ${product.nama} habis`, 'error')
        flash('error')
        return
      }
      addItem(product)
      addToast(`✓ ${product.nama} — ditambahkan ke keranjang`, 'success')
      flash('success')
    } catch (err) {
      addToast((err as Error).message, 'error')
      flash('error')
    }
  }, [addItem, addToast, findProduct])

  const { isScanning } = useBarcodeScanner(handleScan, barcodeEnabled)

  useEffect(() => {
    if (isScanning && scanFlash === 'idle') setScanFlash('idle')
  }, [isScanning, scanFlash])

  const indicatorColor =
    scanFlash === 'success' ? '#3B6D11' :
    scanFlash === 'error'   ? '#DC2626' :
    isScanning              ? '#3B6D11' :
    '#D0CEC8'

  const indicatorBg =
    scanFlash === 'success' ? '#EAF3DE' :
    scanFlash === 'error'   ? '#FEF2F2' :
    isScanning              ? '#F0F7E8' :
    'transparent'

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Topbar */}
      <div
        className="flex items-center justify-between px-4 md:px-6 bg-white flex-shrink-0"
        style={{ height: '56px', borderBottom: '1px solid #E8E6E0' }}
      >
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-1.5 rounded-lg transition-colors hover:bg-gray-50 flex-shrink-0"
            style={{ color: '#6B6963' }}
          >
            <HamburgerIcon />
          </button>
          <div>
            <h1 className="font-semibold text-sm" style={{ color: '#1A1A18' }}>Kasir</h1>
            <p className="text-xs hidden sm:block" style={{ color: '#9B9890' }}>{dateStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <HeldTransactionsPanel />

          {lowCount > 0 && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#DC2626' }} />
              {lowCount} hampir habis
            </div>
          )}

          {barcodeEnabled && (
            <div
              title={isScanning ? 'Membaca barcode...' : 'Scanner aktif'}
              className={`w-7 h-7 rounded-lg items-center justify-center transition-all duration-200 hidden sm:flex ${isScanning ? 'animate-pulse' : ''}`}
              style={{
                color: indicatorColor,
                backgroundColor: indicatorBg,
                border: `1px solid ${indicatorBg === 'transparent' ? 'transparent' : indicatorColor + '33'}`,
              }}
            >
              <BarcodeIcon size={15} />
            </div>
          )}

          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{ backgroundColor: '#EAF3DE', color: '#3B6D11' }}
          >
            {initials}
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Product grid */}
        <div className={`flex-1 flex flex-col overflow-hidden ${showCart ? 'hidden md:flex' : 'flex'}`}>
          <ProductGrid />
        </div>

        {/* Cart panel */}
        <div className={`flex-shrink-0 flex flex-col overflow-hidden
          ${showCart ? 'flex w-full md:w-80' : 'hidden md:flex md:w-80'}`}>
          <CartPanel />
        </div>
      </div>

      {/* Mobile cart toggle bar */}
      <div
        className="md:hidden flex-shrink-0 bg-white px-3 py-2.5"
        style={{ borderTop: '1px solid #E8E6E0' }}
      >
        {showCart ? (
          <button
            onClick={() => setShowCart(false)}
            className="btn-ghost w-full text-sm gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Kembali ke Produk
          </button>
        ) : (
          <button
            onClick={() => setShowCart(true)}
            disabled={itemCount === 0}
            className="btn-primary w-full text-sm gap-2"
          >
            <CartIcon />
            {itemCount === 0
              ? 'Keranjang kosong'
              : `Keranjang (${itemCount}) · ${formatRupiah(cartTotal)}`
            }
          </button>
        )}
      </div>
    </div>
  )
}
