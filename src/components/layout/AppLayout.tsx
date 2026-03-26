import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '@/components/ui/Toast'
import { useSidebarStore } from '@/store/sidebarStore'

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function LeafLogo() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
      <path d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 0-8.862 12.872M12.75 3.031a9 9 0 0 1 6.69 14.036l-.776-.518a1.875 1.875 0 0 0-1.664-.199L14.125 17.6a2.25 2.25 0 0 0-1.197 1.194l-.415.831a1.125 1.125 0 0 1-1.013.628h-.416" />
    </svg>
  )
}

export function AppLayout() {
  const { open, toggle, close } = useSidebarStore()
  const location = useLocation()
  // KasirPage has its own topbar with hamburger — don't double up
  const isKasir = location.pathname === '/kasir'

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F8F8F6' }}>
      <Sidebar />

      {/* Mobile overlay when sidebar open */}
      {open && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ backgroundColor: 'rgba(26,26,24,0.5)' }}
          onClick={close}
        />
      )}

      <main className="flex-1 min-h-screen md:ml-52 flex flex-col">
        {/* Mobile topbar — hidden on KasirPage (it has its own) */}
        {!isKasir && (
          <div
            className="md:hidden flex items-center h-12 px-4 bg-white sticky top-0 z-10 flex-shrink-0"
            style={{ borderBottom: '1px solid #E8E6E0' }}
          >
            <button
              onClick={toggle}
              className="p-1.5 rounded-lg transition-colors hover:bg-gray-50"
              style={{ color: '#6B6963' }}
            >
              <HamburgerIcon />
            </button>
            <div className="flex items-center gap-2 ml-3">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#3B6D11' }}
              >
                <LeafLogo />
              </div>
              <span className="font-bold text-sm" style={{ color: '#1A1A18' }}>AgroKas</span>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </main>

      <ToastContainer />
    </div>
  )
}
