import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useLowStock } from '@/hooks/useProducts'
import { useCartStore } from '@/store/cartStore'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { useProductByBarcode } from '@/hooks/useProductByBarcode'
import { useToastStore } from '@/store/toastStore'
import { ProductGrid } from '@/components/kasir/ProductGrid'
import { CartPanel } from '@/components/kasir/CartPanel'
import { HeldTransactionsPanel } from '@/components/kasir/HeldTransactionsPanel'

// ── Barcode indicator icon ────────────────────────────────────────────────────
function BarcodeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      width={size}
      height={size}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5
           c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5Z
           M3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5
           c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z
           M13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5
           c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
      />
    </svg>
  )
}

// ── Scan status type ──────────────────────────────────────────────────────────
type ScanFlash = 'idle' | 'success' | 'error'

// ── Page ──────────────────────────────────────────────────────────────────────
export function KasirPage() {
  const { user }       = useAuthStore()
  const { data: lowStock } = useLowStock()
  const addItem        = useCartStore((s) => s.addItem)
  const addToast       = useToastStore((s) => s.addToast)
  const findProduct    = useProductByBarcode()
  const lowCount       = lowStock?.length ?? 0
  const initials       = user?.email?.[0]?.toUpperCase() ?? 'K'

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

  // Upgrade scanFlash to 'scanning' when isScanning starts
  useEffect(() => {
    if (isScanning && scanFlash === 'idle') setScanFlash('idle')
  }, [isScanning, scanFlash])

  // ── Indicator styles ──────────────────────────────────────────────────────
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
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div
          className="flex items-center justify-between px-6 bg-white flex-shrink-0"
          style={{ height: '56px', borderBottom: '1px solid #E8E6E0' }}
        >
          <div>
            <h1 className="font-semibold text-sm" style={{ color: '#1A1A18' }}>Kasir</h1>
            <p className="text-xs" style={{ color: '#9B9890' }}>{dateStr}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Held transactions */}
            <HeldTransactionsPanel />

            {/* Low stock alert */}
            {lowCount > 0 && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#DC2626' }} />
                {lowCount} produk hampir habis
              </div>
            )}

            {/* Barcode scanner indicator */}
            {barcodeEnabled && (
              <div
                title={
                  isScanning
                    ? 'Membaca barcode...'
                    : 'Scanner aktif — scan barcode untuk tambah produk'
                }
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  isScanning ? 'animate-pulse' : ''
                }`}
                style={{
                  color: indicatorColor,
                  backgroundColor: indicatorBg,
                  border: `1px solid ${indicatorBg === 'transparent' ? 'transparent' : indicatorColor + '33'}`,
                }}
              >
                <BarcodeIcon size={15} />
              </div>
            )}

            {/* User avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ backgroundColor: '#EAF3DE', color: '#3B6D11' }}
            >
              {initials}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ProductGrid />
        </div>
      </div>

      <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
        <CartPanel />
      </div>
    </div>
  )
}
