import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { KasirPage } from '@/pages/KasirPage'
import { ProdukPage } from '@/pages/ProdukPage'
import { PelangganPage } from '@/pages/PelangganPage'
import { LaporanPage } from '@/pages/LaporanPage'
import { PengaturanPage } from '@/pages/PengaturanPage'
import { Spinner } from '@/components/ui/Spinner'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
})

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, setUser } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [setUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) return <LoginPage />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthGate>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/kasir" replace />} />
              <Route path="/kasir"      element={<KasirPage />} />
              <Route path="/produk"     element={<ProdukPage />} />
              <Route path="/pelanggan"  element={<PelangganPage />} />
              <Route path="/laporan"    element={<LaporanPage />} />
              <Route path="/pengaturan" element={<PengaturanPage />} />
            </Route>
          </Routes>
        </AuthGate>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
