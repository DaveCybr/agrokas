interface Props {
  icon?: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  type?: 'product' | 'customer' | 'default'
}

function ProductIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#F8F8F6" />
      <rect x="16" y="28" width="32" height="4" rx="2" fill="#E8E6E0" />
      <path d="M20 32L16 40h32l-4-8H20Z" fill="#F0EEE8" stroke="#E8E6E0" strokeWidth="1" />
      <path d="M24 32L20 24h24l-4 8H24Z" fill="#EAF3DE" stroke="#D0CEC8" strokeWidth="1" />
      <circle cx="26" cy="44" r="3" fill="#E8E6E0" />
      <circle cx="38" cy="44" r="3" fill="#E8E6E0" />
    </svg>
  )
}

function CustomerIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#F8F8F6" />
      <circle cx="32" cy="24" r="8" fill="#EAF3DE" stroke="#D0CEC8" strokeWidth="1.5" />
      <path d="M16 48c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#E8E6E0" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="24" r="4" fill="#D0CEC8" />
    </svg>
  )
}

function DefaultIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#F8F8F6" />
      <rect x="18" y="22" width="28" height="20" rx="3" fill="#F0EEE8" stroke="#E8E6E0" strokeWidth="1.5" />
      <path d="M22 30h20M22 35h14" stroke="#D0CEC8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function EmptyState({ title, description, action, type = 'default' }: Props) {
  const Illustration =
    type === 'product' ? ProductIllustration
    : type === 'customer' ? CustomerIllustration
    : DefaultIllustration

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="mb-4">
        <Illustration />
      </div>
      <p className="font-semibold text-sm" style={{ color: '#1A1A18' }}>{title}</p>
      {description && (
        <p className="text-xs mt-1.5" style={{ color: '#9B9890' }}>{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary mt-4"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
