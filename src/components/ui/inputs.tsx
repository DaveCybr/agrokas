/** Shared input components for numeric and currency fields */

interface RupiahInputProps {
  value: number
  onChange: (v: number) => void
  disabled?: boolean
  placeholder?: string
}

/**
 * Currency input — displays formatted with thousand separators (e.g. "1.500.000"),
 * strips non-digits on change, stores raw number.
 */
export function RupiahInput({ value, onChange, disabled, placeholder = '0' }: RupiahInputProps) {
  const formatted = value ? value.toLocaleString('id-ID') : ''

  return (
    <div
      className="flex items-center rounded-lg overflow-hidden"
      style={{
        border: `1px solid ${disabled ? '#E8E6E0' : '#D5D3CD'}`,
        backgroundColor: disabled ? '#F0EEE8' : '#fff',
      }}
    >
      <span
        className="px-2 flex-shrink-0 text-xs self-stretch flex items-center"
        style={{ color: '#9B9890', borderRight: '1px solid #E8E6E0', backgroundColor: disabled ? '#F0EEE8' : '#F8F8F6' }}
      >
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={formatted}
        placeholder={placeholder}
        onChange={e => {
          const raw = Number(e.target.value.replace(/\D/g, '')) || 0
          onChange(raw)
        }}
        className="flex-1 px-2 py-1.5 text-xs outline-none"
        style={{
          fontVariantNumeric: 'tabular-nums',
          backgroundColor: 'transparent',
          color: '#1A1A18',
          cursor: disabled ? 'not-allowed' : 'text',
          minWidth: 0,
        }}
      />
    </div>
  )
}

interface QtyInputProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}

/**
 * Qty input — text field with − / + stepper buttons on each side.
 * Supports decimal values (e.g. 0.5 kg).
 */
export function QtyInput({ value, onChange, min = 0, max, step = 1, disabled }: QtyInputProps) {
  function clamp(v: number) {
    let r = isNaN(v) ? min : v
    r = Math.max(min, r)
    if (max !== undefined) r = Math.min(max, r)
    return r
  }

  function decrement() { onChange(clamp(value - step)) }
  function increment() { onChange(clamp(value + step)) }

  return (
    <div
      className="flex items-center rounded-lg overflow-hidden"
      style={{ border: '1px solid #D5D3CD', opacity: disabled ? 0.5 : 1 }}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || value <= min}
        className="flex-shrink-0 flex items-center justify-center text-base select-none"
        style={{
          width: '30px',
          height: '30px',
          backgroundColor: '#F8F8F6',
          color: '#6B6963',
          borderRight: '1px solid #E8E6E0',
          cursor: disabled || value <= min ? 'not-allowed' : 'pointer',
        }}
      >
        −
      </button>
      <input
        type="text"
        inputMode="decimal"
        disabled={disabled}
        value={value === 0 ? '' : value}
        placeholder="0"
        onChange={e => {
          const raw = e.target.value.replace(',', '.')
          const parsed = parseFloat(raw)
          onChange(clamp(isNaN(parsed) ? 0 : parsed))
        }}
        className="flex-1 text-center text-xs py-1.5 outline-none"
        style={{
          fontVariantNumeric: 'tabular-nums',
          color: '#1A1A18',
          backgroundColor: '#fff',
          minWidth: 0,
        }}
      />
      <button
        type="button"
        onClick={increment}
        disabled={disabled || (max !== undefined && value >= max)}
        className="flex-shrink-0 flex items-center justify-center text-base select-none"
        style={{
          width: '30px',
          height: '30px',
          backgroundColor: '#F8F8F6',
          color: '#6B6963',
          borderLeft: '1px solid #E8E6E0',
          cursor: disabled || (max !== undefined && value >= max) ? 'not-allowed' : 'pointer',
        }}
      >
        +
      </button>
    </div>
  )
}
