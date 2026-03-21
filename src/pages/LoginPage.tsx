import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui/Spinner'

function LeafLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 0-8.862 12.872M12.75 3.031a9 9 0 0 1 6.69 14.036l-.776-.518a1.875 1.875 0 0 0-1.664-.199L14.125 17.6a2.25 2.25 0 0 0-1.197 1.194l-.415.831a1.125 1.125 0 0 1-1.013.628h-.416" />
    </svg>
  )
}

export function LoginPage() {
  const { signIn } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch {
      setError('Email atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #F8F8F6 0%, #EAF3DE 100%)' }}
    >
      {/* Logo above card */}
      <div className="flex flex-col items-center mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
          style={{ backgroundColor: '#3B6D11' }}
        >
          <LeafLogo />
        </div>
        <h1 className="text-xl font-bold" style={{ color: '#1A1A18' }}>AgroKas</h1>
        <p className="text-xs mt-0.5" style={{ color: '#9B9890' }}>POS Toko Pertanian</p>
      </div>

      {/* Card */}
      <div
        className="w-full"
        style={{
          maxWidth: '360px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8E6E0',
          borderRadius: '16px',
          padding: '32px',
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: '#6B6963' }}
            >
              Email
            </label>
            <input
              type="email"
              className="input"
              placeholder="kasir@toko.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: '#6B6963' }}
            >
              Password
            </label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div
              className="px-3 py-2 rounded-lg text-xs font-medium"
              style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
            style={{ height: '40px', marginTop: '8px' }}
          >
            {loading && <Spinner size="sm" />}
            {loading ? 'Masuk...' : 'Masuk →'}
          </button>
        </form>
      </div>
    </div>
  )
}
