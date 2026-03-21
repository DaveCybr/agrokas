import { useEffect, useRef, useState } from 'react'

interface UseBarcodeScanner {
  lastScanned: string | null
  isScanning: boolean
}

/**
 * Detects input from a USB barcode scanner.
 * Scanners act like keyboards but type each character < 50ms apart, ending with Enter.
 * We distinguish scanner input from normal typing by measuring inter-key delay.
 */
export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  enabled: boolean = true,
): UseBarcodeScanner {
  const bufferRef       = useRef<string>('')
  const lastKeyTimeRef  = useRef<number>(0)
  const isScannerRef    = useRef<boolean>(false)
  const onScanRef       = useRef(onScan)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [isScanning,  setIsScanning]  = useState(false)

  // Always keep the callback ref fresh so we never need to re-attach the listener
  useEffect(() => { onScanRef.current = onScan }, [onScan])

  useEffect(() => {
    if (!enabled) {
      bufferRef.current = ''
      isScannerRef.current = false
      setIsScanning(false)
      return
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept events while user is typing in a form field
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const now = Date.now()
      const gap = lastKeyTimeRef.current === 0 ? 0 : now - lastKeyTimeRef.current

      if (e.key === 'Enter') {
        const code = bufferRef.current
        if (isScannerRef.current && code.length >= 2) {
          setLastScanned(code)
          onScanRef.current(code)
        }
        // Reset
        bufferRef.current = ''
        lastKeyTimeRef.current = 0
        isScannerRef.current = false
        setIsScanning(false)
        return
      }

      // Only handle printable single characters
      if (e.key.length !== 1) return

      // Gap too large → not scanner input; start a fresh buffer
      if (gap > 100 && bufferRef.current.length > 0) {
        bufferRef.current = ''
        isScannerRef.current = false
        setIsScanning(false)
      }

      bufferRef.current += e.key
      lastKeyTimeRef.current = now

      // Mark as scanner mode once we see two consecutive fast keystrokes
      if (gap > 0 && gap < 50) {
        isScannerRef.current = true
        setIsScanning(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled])

  return { lastScanned, isScanning }
}
