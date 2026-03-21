import { useEffect, useState } from 'react'
import { useToastStore } from '@/store/toastStore'
import type { Toast } from '@/store/toastStore'

function ToastItem({ id, message, type }: Toast) {
  const removeToast = useToastStore((s) => s.removeToast)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const isSuccess = type === 'success'

  return (
    <div
      onClick={() => removeToast(id)}
      style={{
        backgroundColor: isSuccess ? '#EAF3DE' : '#FEF2F2',
        border: `1px solid ${isSuccess ? '#3B6D11' : '#DC2626'}`,
        color: isSuccess ? '#3B6D11' : '#DC2626',
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 200ms ease, opacity 200ms ease',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        maxWidth: '300px',
        userSelect: 'none',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      {message}
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem {...t} />
        </div>
      ))}
    </div>
  )
}
