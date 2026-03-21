import { useState, useEffect, useRef } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useToastStore } from '@/store/toastStore'
import { formatRupiah } from '@/lib/utils'

function PauseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export function HeldTransactionsPanel() {
  const { heldTransactions, resumeTransaction, cancelHeld } = useCartStore()
  const addToast = useToastStore((s) => s.addToast)
  const [isOpen, setIsOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const count = heldTransactions.length

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setConfirmId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  if (count === 0) return null

  function handleResume(id: string, label: string) {
    resumeTransaction(id)
    addToast(`↩ Melanjutkan transaksi ${label}`, 'success')
    setIsOpen(false)
    setConfirmId(null)
  }

  function handleCancelConfirm(id: string) {
    cancelHeld(id)
    setConfirmId(null)
    if (heldTransactions.length === 1) setIsOpen(false)
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger button */}
      <button
        onClick={() => { setIsOpen((v) => !v); setConfirmId(null) }}
        className="relative flex items-center gap-1.5 rounded-xl text-xs font-medium transition-colors"
        style={{
          height: '32px',
          padding: '0 12px',
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          color: '#92400E',
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        <PauseIcon />
        <span>Tertahan</span>
        {/* Badge */}
        <span
          className="w-4 h-4 rounded-full flex items-center justify-center font-bold"
          style={{
            backgroundColor: '#DC2626',
            color: 'white',
            fontSize: '9px',
          }}
        >
          {count}
        </span>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 bg-white rounded-2xl z-40 overflow-hidden"
          style={{
            width: '280px',
            border: '1px solid #E8E6E0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #E8E6E0' }}>
            <p className="text-sm font-semibold" style={{ color: '#1A1A18' }}>
              Transaksi Tertahan ({count})
            </p>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {heldTransactions.map((h) => (
              <div
                key={h.id}
                style={{ borderBottom: '1px solid #F0EEE8' }}
              >
                {confirmId === h.id ? (
                  /* Inline cancel confirmation */
                  <div className="px-4 py-3">
                    <p className="text-xs font-medium mb-2" style={{ color: '#1A1A18' }}>
                      Batalkan "{h.label}"?
                    </p>
                    <p className="text-xs mb-3" style={{ color: '#9B9890' }}>
                      {formatRupiah(h.total)} · {h.items.length} item
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCancelConfirm(h.id)}
                        className="flex-1 text-xs font-medium rounded-lg transition-colors"
                        style={{
                          height: '28px',
                          backgroundColor: '#FEF2F2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        Ya, batalkan
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="flex-1 text-xs font-medium rounded-lg transition-colors"
                        style={{
                          height: '28px',
                          backgroundColor: 'white',
                          border: '1px solid #E8E6E0',
                          color: '#6B6963',
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        Tidak
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal item view */
                  <div
                    className="px-4 py-3 transition-colors"
                    style={{ cursor: 'default' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8F8F6')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium" style={{ color: '#1A1A18' }}>
                        {h.label}
                      </p>
                      <p className="text-[10px]" style={{ color: '#9B9890' }}>
                        {formatTime(h.heldAt)}
                      </p>
                    </div>
                    <p className="text-xs mb-2" style={{ color: '#3B6D11', fontVariantNumeric: 'tabular-nums' }}>
                      {h.items.length} item · {formatRupiah(h.total)}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResume(h.id, h.label)}
                        className="text-xs font-medium rounded-lg transition-colors"
                        style={{
                          height: '26px',
                          padding: '0 10px',
                          backgroundColor: '#EAF3DE',
                          border: '1px solid #3B6D11',
                          color: '#3B6D11',
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        → Lanjutkan
                      </button>
                      <button
                        onClick={() => setConfirmId(h.id)}
                        className="text-xs transition-colors"
                        style={{
                          color: '#9B9890',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#9B9890')}
                      >
                        ✕ Batalkan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer if max */}
          {count >= 5 && (
            <div
              className="px-4 py-2 text-xs"
              style={{ backgroundColor: '#FFFBEB', color: '#92400E', borderTop: '1px solid #FDE68A' }}
            >
              Maksimal 5 transaksi ditahan
            </div>
          )}
        </div>
      )}
    </div>
  )
}
